package onboarding

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
	"revendaclick/backend/internal/middleware"
	"revendaclick/backend/internal/response"
)

var (
	slugRe  = regexp.MustCompile(`^[a-z0-9][a-z0-9\-]{1,48}[a-z0-9]$`)
	emailRe = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
)

// slugsReservados são slugs que colidem com rotas estáticas do frontend.
// A vitrine da loja é servida por app/(public)/[slug]; no Next.js a rota
// estática vence a dinâmica, então uma loja com um destes slugs ficaria
// inacessível — o cliente veria a landing page no lugar da vitrine.
//
// Manter em sincronia com:
//   - frontend/components/landing/segments/data.ts (SLUGS_RESERVADOS)
//   - os diretórios de primeiro nível em frontend/app/
var slugsReservados = map[string]bool{
	// Landings segmentadas (sessão 64)
	"revendas-pequenas":  true,
	"multimarcas":        true,
	"premium":            true,
	"crm-automotivo":     true,
	"erp-automotivo":     true,
	"site-para-revendas": true,
	// Rotas da aplicação
	"admin": true, "api": true, "auth": true, "login": true, "register": true,
	"onboarding": true, "dashboard": true, "settings": true, "billing": true,
	"vehicles": true, "leads": true, "customers": true, "financial": true,
	"sales": true, "vendors": true, "whatsapp": true, "crm": true, "store": true,
	"analytics": true, "automations": true, "campaigns": true, "obrigado": true,
	"privacidade": true, "privacy": true, "terms": true, "logout": true,
	"reset-password": true, "forgot-password": true, "conta-suspensa": true,
	"robots": true, "sitemap": true, "not-found": true, "error": true,
}

type Checklist struct {
	TenantID string `json:"tenant_id"`
	// v2 steps (required for completion)
	AddedVehicle      bool `json:"added_vehicle"`
	PublishedStore    bool `json:"published_store"`
	ReceivedFirstLead bool `json:"received_first_lead"`
	// v2 optional step
	WhatsAppConnected bool `json:"whatsapp_connected"`
	// legacy fields (kept for backwards compat)
	ConfiguredWhatsApp bool       `json:"configured_whatsapp"`
	AddedSeller        bool       `json:"added_seller"`
	CompletedAt        *time.Time `json:"completed_at,omitempty"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

type UpdateRequest struct {
	// v2 steps
	AddedVehicle      *bool `json:"added_vehicle"`
	PublishedStore    *bool `json:"published_store"`
	ReceivedFirstLead *bool `json:"received_first_lead"`
	WhatsAppConnected *bool `json:"whatsapp_connected"`
	// legacy (still accepted)
	ConfiguredWhatsApp *bool `json:"configured_whatsapp"`
	AddedSeller        *bool `json:"added_seller"`
}

// SetupRequest — creates tenant + owner user in a single transaction (first-time onboarding)
type SetupRequest struct {
	TenantSlug    string `json:"tenant_slug"`
	TenantName    string `json:"tenant_name"`
	TenantEmail   string `json:"tenant_email"`
	PhoneWhatsApp string `json:"phone_whatsapp"`
	UserName      string `json:"user_name"`
}

func (r *SetupRequest) validate() error {
	slug := strings.TrimSpace(r.TenantSlug)
	email := strings.ToLower(strings.TrimSpace(r.TenantEmail))
	switch {
	case slug == "":
		return errors.New("tenant_slug is required")
	case !slugRe.MatchString(slug):
		return errors.New("tenant_slug: use apenas letras minúsculas, números e hífens (mínimo 3 caracteres)")
	case slugsReservados[strings.ToLower(slug)]:
		return errors.New("tenant_slug: este endereço é reservado pelo sistema — escolha outro para a sua loja")
	case strings.TrimSpace(r.TenantName) == "":
		return errors.New("tenant_name is required")
	case len(strings.TrimSpace(r.TenantName)) > 120:
		return errors.New("tenant_name too long (max 120 chars)")
	case email == "":
		return errors.New("tenant_email is required")
	case !emailRe.MatchString(email):
		return errors.New("tenant_email: formato de e-mail inválido")
	case strings.TrimSpace(r.PhoneWhatsApp) == "":
		return errors.New("phone_whatsapp is required")
	case strings.TrimSpace(r.UserName) == "":
		return errors.New("user_name is required")
	case len(strings.TrimSpace(r.UserName)) > 80:
		return errors.New("user_name too long (max 80 chars)")
	}
	return nil
}

type SetupResult struct {
	TenantID   string `json:"tenant_id"`
	TenantSlug string `json:"tenant_slug"`
	TenantName string `json:"tenant_name"`
}

type Handler struct {
	pool        *pgxpool.Pool
	supabaseURL string
	serviceKey  string
	logger      *zap.Logger
}

func NewHandler(pool *pgxpool.Pool, supabaseURL, serviceKey string, logger *zap.Logger) *Handler {
	return &Handler{pool: pool, supabaseURL: supabaseURL, serviceKey: serviceKey, logger: logger}
}

// POST /api/onboarding/setup  (JWT auth only — no tenant resolution required)
func (h *Handler) Setup(c *gin.Context) {
	userID := middleware.UserIDFromGin(c)
	if userID == "" {
		response.Unauthorized(c)
		return
	}

	var req SetupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if err := req.validate(); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	// Idempotency check: user already provisioned
	var existingTenantID string
	_ = h.pool.QueryRow(c.Request.Context(),
		`SELECT tenant_id::text FROM users WHERE id = $1 AND is_active = TRUE`, userID,
	).Scan(&existingTenantID)
	if existingTenantID != "" {
		response.BadRequest(c, "usuário já possui uma loja cadastrada")
		return
	}

	result, err := h.setupTenantTx(c.Request.Context(), userID, &req)
	if err != nil {
		msg := err.Error()
		switch {
		case strings.Contains(msg, "tenants_slug") || (strings.Contains(msg, "unique") && strings.Contains(msg, "slug")):
			response.BadRequest(c, "este slug já está em uso, escolha outro")
		case strings.Contains(msg, "tenants_email") || (strings.Contains(msg, "unique") && strings.Contains(msg, "email")):
			response.BadRequest(c, "este email já está cadastrado")
		case strings.Contains(msg, "tenants_slug_format"):
			response.BadRequest(c, "slug inválido: use apenas letras minúsculas, números e hífens (mínimo 3 caracteres)")
		default:
			_ = c.Error(err)
			response.InternalError(c)
		}
		return
	}

	// Update Supabase app_metadata so the JWT carries tenant_id + user_role.
	// Non-fatal: getTenantForUser in the frontend has a service-role fallback, so
	// the user reaches /dashboard even if this fails. Still log clearly for ops.
	if err := h.updateSupabaseAppMetadata(c.Request.Context(), userID, result.TenantID, "owner"); err != nil {
		h.logger.Warn("Setup: updateSupabaseAppMetadata failed — JWT will lack tenant_id claim until next session refresh",
			zap.String("user_id", userID),
			zap.String("tenant_id", result.TenantID),
			zap.Error(err),
		)
	}

	response.JSON(c, http.StatusCreated, result)
}

func (h *Handler) setupTenantTx(ctx context.Context, userID string, req *SetupRequest) (*SetupResult, error) {
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// 1. Create tenant — DB triggers auto-create onboarding_checklist + trial subscription
	var tenantID string
	if err = tx.QueryRow(ctx, `
		INSERT INTO tenants (slug, name, email, phone_whatsapp)
		VALUES ($1, $2, $3, $4)
		RETURNING id::text`,
		strings.TrimSpace(req.TenantSlug),
		strings.TrimSpace(req.TenantName),
		strings.TrimSpace(req.TenantEmail),
		strings.TrimSpace(req.PhoneWhatsApp),
	).Scan(&tenantID); err != nil {
		return nil, err
	}

	// 2. Create owner user record (links auth.users → tenant)
	if _, err = tx.Exec(ctx, `
		INSERT INTO users (id, tenant_id, role, name, email)
		VALUES ($1, $2, 'owner', $3, $4)`,
		userID, tenantID,
		strings.TrimSpace(req.UserName),
		strings.TrimSpace(req.TenantEmail),
	); err != nil {
		return nil, err
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &SetupResult{
		TenantID:   tenantID,
		TenantSlug: strings.TrimSpace(req.TenantSlug),
		TenantName: strings.TrimSpace(req.TenantName),
	}, nil
}

// updateSupabaseAppMetadata patches app_metadata on the Supabase Auth user so that
// subsequent JWTs include tenant_id and user_role — required for Storage RLS.
// Retries up to 3 times on network errors and 5xx responses.
// Never retries on 4xx (except 429 rate-limit) because those indicate a config problem.
func (h *Handler) updateSupabaseAppMetadata(ctx context.Context, userID, tenantID, role string) error {
	if h.supabaseURL == "" || h.serviceKey == "" {
		return fmt.Errorf("supabase credentials not configured")
	}

	payload, _ := json.Marshal(map[string]any{
		"app_metadata": map[string]string{
			"tenant_id": tenantID,
			"user_role": role,
		},
	})

	apiURL := strings.TrimRight(h.supabaseURL, "/") + "/auth/v1/admin/users/" + userID
	client := &http.Client{Timeout: 8 * time.Second}

	var lastErr error
	for attempt := 1; attempt <= 3; attempt++ {
		if attempt > 1 {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(time.Duration(attempt-1) * 500 * time.Millisecond):
			}
		}

		req, err := http.NewRequestWithContext(ctx, http.MethodPut, apiURL, bytes.NewReader(payload))
		if err != nil {
			return err
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+h.serviceKey)
		req.Header.Set("apikey", h.serviceKey)

		resp, err := client.Do(req)
		if err != nil {
			lastErr = err
			h.logger.Warn("updateSupabaseAppMetadata: request error",
				zap.String("user_id", userID),
				zap.Int("attempt", attempt),
				zap.Error(err),
			)
			continue
		}

		respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		resp.Body.Close()

		if resp.StatusCode < 400 {
			h.logger.Info("updateSupabaseAppMetadata: success",
				zap.String("user_id", userID),
				zap.String("tenant_id", tenantID),
				zap.Int("attempt", attempt),
			)
			return nil
		}

		lastErr = fmt.Errorf("supabase admin API returned %d: %s", resp.StatusCode, strings.TrimSpace(string(respBody)))
		h.logger.Warn("updateSupabaseAppMetadata: non-2xx response",
			zap.String("user_id", userID),
			zap.Int("attempt", attempt),
			zap.Int("status", resp.StatusCode),
			zap.String("body", string(respBody)),
		)

		// 4xx (except 429 rate-limit) are config errors — retrying won't help
		if resp.StatusCode != http.StatusTooManyRequests && resp.StatusCode < 500 {
			return lastErr
		}
	}

	h.logger.Error("updateSupabaseAppMetadata: all retries exhausted",
		zap.String("user_id", userID),
		zap.String("tenant_id", tenantID),
		zap.Error(lastErr),
	)
	return lastErr
}

// GET /api/onboarding
func (h *Handler) Get(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	cl := &Checklist{}
	err := h.pool.QueryRow(c.Request.Context(), `
		SELECT tenant_id,
		       added_vehicle, published_store, received_first_lead, whatsapp_connected,
		       configured_whatsapp, added_seller,
		       completed_at, updated_at
		FROM onboarding_checklists WHERE tenant_id = $1`, tenantID,
	).Scan(
		&cl.TenantID,
		&cl.AddedVehicle, &cl.PublishedStore, &cl.ReceivedFirstLead, &cl.WhatsAppConnected,
		&cl.ConfiguredWhatsApp, &cl.AddedSeller,
		&cl.CompletedAt, &cl.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(c)
		return
	}
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, cl)
}

// PUT /api/onboarding
func (h *Handler) Update(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	// completed_at is now managed by the DB trigger _update_onboarding_completed
	cl := &Checklist{}
	err := h.pool.QueryRow(c.Request.Context(), `
		UPDATE onboarding_checklists SET
			added_vehicle        = COALESCE($2, added_vehicle),
			published_store      = COALESCE($3, published_store),
			received_first_lead  = COALESCE($4, received_first_lead),
			whatsapp_connected   = COALESCE($5, whatsapp_connected),
			configured_whatsapp  = COALESCE($6, configured_whatsapp),
			added_seller         = COALESCE($7, added_seller)
		WHERE tenant_id = $1
		RETURNING tenant_id,
		          added_vehicle, published_store, received_first_lead, whatsapp_connected,
		          configured_whatsapp, added_seller,
		          completed_at, updated_at`,
		tenantID,
		req.AddedVehicle, req.PublishedStore, req.ReceivedFirstLead, req.WhatsAppConnected,
		req.ConfiguredWhatsApp, req.AddedSeller,
	).Scan(
		&cl.TenantID,
		&cl.AddedVehicle, &cl.PublishedStore, &cl.ReceivedFirstLead, &cl.WhatsAppConnected,
		&cl.ConfiguredWhatsApp, &cl.AddedSeller,
		&cl.CompletedAt, &cl.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(c)
		return
	}
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, cl)
}
