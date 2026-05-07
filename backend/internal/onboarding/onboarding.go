package onboarding

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"revendaclick/backend/internal/middleware"
	"revendaclick/backend/internal/response"
)

type Checklist struct {
	TenantID           string     `json:"tenant_id"`
	AddedVehicle       bool       `json:"added_vehicle"`
	ConfiguredWhatsApp bool       `json:"configured_whatsapp"`
	PublishedStore     bool       `json:"published_store"`
	AddedSeller        bool       `json:"added_seller"`
	CompletedAt        *time.Time `json:"completed_at,omitempty"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

type UpdateRequest struct {
	AddedVehicle       *bool `json:"added_vehicle"`
	ConfiguredWhatsApp *bool `json:"configured_whatsapp"`
	PublishedStore     *bool `json:"published_store"`
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
	switch {
	case strings.TrimSpace(r.TenantSlug) == "":
		return errors.New("tenant_slug is required")
	case strings.TrimSpace(r.TenantName) == "":
		return errors.New("tenant_name is required")
	case strings.TrimSpace(r.TenantEmail) == "":
		return errors.New("tenant_email is required")
	case strings.TrimSpace(r.PhoneWhatsApp) == "":
		return errors.New("phone_whatsapp is required")
	case strings.TrimSpace(r.UserName) == "":
		return errors.New("user_name is required")
	}
	return nil
}

type SetupResult struct {
	TenantID   string `json:"tenant_id"`
	TenantSlug string `json:"tenant_slug"`
	TenantName string `json:"tenant_name"`
}

type Handler struct {
	pool *pgxpool.Pool
}

func NewHandler(pool *pgxpool.Pool) *Handler {
	return &Handler{pool: pool}
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

// GET /api/onboarding
func (h *Handler) Get(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	cl := &Checklist{}
	err := h.pool.QueryRow(c.Request.Context(), `
		SELECT tenant_id, added_vehicle, configured_whatsapp,
		       published_store, added_seller, completed_at, updated_at
		FROM onboarding_checklists WHERE tenant_id = $1`, tenantID,
	).Scan(&cl.TenantID, &cl.AddedVehicle, &cl.ConfiguredWhatsApp,
		&cl.PublishedStore, &cl.AddedSeller, &cl.CompletedAt, &cl.UpdatedAt)

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

	cl := &Checklist{}
	err := h.pool.QueryRow(c.Request.Context(), `
		UPDATE onboarding_checklists SET
			added_vehicle        = COALESCE($2, added_vehicle),
			configured_whatsapp  = COALESCE($3, configured_whatsapp),
			published_store      = COALESCE($4, published_store),
			added_seller         = COALESCE($5, added_seller),
			completed_at = CASE
				WHEN COALESCE($2, added_vehicle) AND COALESCE($3, configured_whatsapp)
				     AND COALESCE($4, published_store) AND COALESCE($5, added_seller)
				     AND completed_at IS NULL
				THEN NOW()
				ELSE completed_at
			END
		WHERE tenant_id = $1
		RETURNING tenant_id, added_vehicle, configured_whatsapp,
		          published_store, added_seller, completed_at, updated_at`,
		tenantID, req.AddedVehicle, req.ConfiguredWhatsApp,
		req.PublishedStore, req.AddedSeller,
	).Scan(&cl.TenantID, &cl.AddedVehicle, &cl.ConfiguredWhatsApp,
		&cl.PublishedStore, &cl.AddedSeller, &cl.CompletedAt, &cl.UpdatedAt)

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
