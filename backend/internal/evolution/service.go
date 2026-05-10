package evolution

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

var nonDigit = regexp.MustCompile(`\D`)

type Service struct {
	pool    *pgxpool.Pool
	logger  *zap.Logger
	apiURL  string
	apiKey  string
	client  *http.Client
}

func NewService(pool *pgxpool.Pool, logger *zap.Logger, apiURL, apiKey string) *Service {
	return &Service{
		pool:   pool,
		logger: logger,
		apiURL: strings.TrimRight(apiURL, "/"),
		apiKey: apiKey,
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

// HandleWebhook processes an inbound Evolution webhook event.
func (s *Service) HandleWebhook(ctx context.Context, payload *WebhookPayload) error {
	if payload.Event != "messages.upsert" {
		return nil
	}

	md := parseMessageData(payload.Data)
	if md.FromMe || md.RemoteJID == "" {
		return nil
	}

	// Skip group messages (contain @g.us)
	if strings.Contains(md.RemoteJID, "@g.us") {
		return nil
	}

	phone := normalizePhone(md.RemoteJID)
	if phone == "" {
		return nil
	}

	tenantID, err := s.tenantIDByInstance(ctx, payload.Instance)
	if err != nil {
		s.logger.Warn("evolution: tenant not found for instance",
			zap.String("instance", payload.Instance))
		return nil
	}

	leadID, err := s.upsertLead(ctx, tenantID, phone, md.PushName)
	if err != nil {
		return fmt.Errorf("evolution: upsert lead: %w", err)
	}

	if md.Body != "" {
		if err := s.addActivity(ctx, tenantID, leadID, md.Body); err != nil {
			s.logger.Warn("evolution: add activity failed", zap.Error(err))
		}
	}

	return nil
}

// IsReachable probes whether the Evolution API responds at all.
func (s *Service) IsReachable(ctx context.Context) bool {
	probeCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	url := fmt.Sprintf("%s/", s.apiURL)
	req, err := http.NewRequestWithContext(probeCtx, http.MethodGet, url, nil)
	if err != nil {
		return false
	}
	resp, err := s.client.Do(req)
	if err != nil {
		return false
	}
	resp.Body.Close()
	return resp.StatusCode < 500
}

// GetInstanceStatus returns the connection status of a tenant's WhatsApp instance.
func (s *Service) GetInstanceStatus(ctx context.Context, tenantSlug string) (*InstanceStatus, error) {
	url := fmt.Sprintf("%s/instance/fetchInstances", s.apiURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("apikey", s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var list []struct {
		Instance struct {
			InstanceName string `json:"instanceName"`
			Status       string `json:"connectionStatus"`
		} `json:"instance"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}

	for _, item := range list {
		if item.Instance.InstanceName == tenantSlug {
			return &InstanceStatus{
				InstanceName: item.Instance.InstanceName,
				Status:       item.Instance.Status,
			}, nil
		}
	}
	return &InstanceStatus{InstanceName: tenantSlug, Status: "disconnected"}, nil
}

// GetQRCode fetches the QR code for a tenant's WhatsApp instance.
// Retries up to 3 times with a short delay to handle Evolution startup latency.
func (s *Service) GetQRCode(ctx context.Context, tenantSlug string) (*QRCodeResponse, error) {
	url := fmt.Sprintf("%s/instance/connect/%s", s.apiURL, tenantSlug)

	var lastErr error
	for attempt := 0; attempt < 3; attempt++ {
		if attempt > 0 {
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(time.Duration(attempt*2) * time.Second):
			}
		}

		req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("apikey", s.apiKey)

		resp, err := s.client.Do(req)
		if err != nil {
			lastErr = err
			s.logger.Warn("evolution: qr retry", zap.Int("attempt", attempt+1), zap.Error(err))
			continue
		}

		var qr QRCodeResponse
		decodeErr := json.NewDecoder(resp.Body).Decode(&qr)
		resp.Body.Close()

		if decodeErr != nil {
			lastErr = decodeErr
			continue
		}
		if resp.StatusCode >= 500 {
			lastErr = fmt.Errorf("evolution: qr returned %d", resp.StatusCode)
			s.logger.Warn("evolution: qr server error", zap.Int("status", resp.StatusCode), zap.Int("attempt", attempt+1))
			continue
		}
		// Evolution v2 returns base64 with "data:image/png;base64," prefix — strip it
		// so the frontend can handle it consistently.
		if strings.HasPrefix(qr.Base64, "data:") {
			if comma := strings.IndexByte(qr.Base64, ','); comma >= 0 {
				qr.Base64 = qr.Base64[comma+1:]
			}
		}
		return &qr, nil
	}
	return nil, fmt.Errorf("evolution: qr unavailable after retries: %w", lastErr)
}

// CreateInstance creates a new Evolution instance for a tenant.
// Returns (created=true) if newly created, (created=false) if already existed.
func (s *Service) CreateInstance(ctx context.Context, tenantSlug string) (created bool, err error) {
	body := map[string]any{
		"instanceName": tenantSlug,
		"integration":  "WHATSAPP-BAILEYS",
		"qrcode":       true,
	}
	b, _ := json.Marshal(body)
	url := fmt.Sprintf("%s/instance/create", s.apiURL)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(b))
	if err != nil {
		return false, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	// 400 means instance already exists — that's fine (idempotent)
	if resp.StatusCode == http.StatusBadRequest {
		return false, nil
	}
	if resp.StatusCode >= 500 {
		return false, fmt.Errorf("evolution: create instance returned %d", resp.StatusCode)
	}
	return resp.StatusCode == http.StatusCreated || resp.StatusCode == http.StatusOK, nil
}

// DisconnectInstance logs out a tenant's WhatsApp instance.
func (s *Service) DisconnectInstance(ctx context.Context, tenantSlug string) error {
	url := fmt.Sprintf("%s/instance/logout/%s", s.apiURL, tenantSlug)
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("apikey", s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("evolution: disconnect returned %d", resp.StatusCode)
	}
	return nil
}

// SendMessage sends a WhatsApp message via Evolution API.
func (s *Service) SendMessage(ctx context.Context, instance, number, text string) error {
	body := map[string]any{
		"number": number,
		"options": map[string]any{
			"delay":    1200,
			"presence": "composing",
		},
		"textMessage": map[string]any{
			"text": text,
		},
	}

	b, _ := json.Marshal(body)
	url := fmt.Sprintf("%s/message/sendText/%s", s.apiURL, instance)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(b))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("evolution: send message returned %d", resp.StatusCode)
	}
	return nil
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

func (s *Service) tenantIDByInstance(ctx context.Context, instance string) (string, error) {
	var id string
	err := s.pool.QueryRow(ctx,
		"SELECT id FROM tenants WHERE slug = $1 AND is_active = TRUE", instance,
	).Scan(&id)
	return id, err
}

func (s *Service) upsertLead(ctx context.Context, tenantID, phone, name string) (string, error) {
	var id string

	// Check if a lead with this phone already exists for the tenant
	err := s.pool.QueryRow(ctx,
		"SELECT id FROM leads WHERE tenant_id = $1 AND phone = $2 LIMIT 1",
		tenantID, phone,
	).Scan(&id)

	if err == nil {
		return id, nil
	}

	// Create new lead
	displayName := name
	if displayName == "" {
		displayName = phone
	}

	err = s.pool.QueryRow(ctx, `
		INSERT INTO leads (tenant_id, name, phone, source)
		VALUES ($1, $2, $3, 'whatsapp')
		RETURNING id`,
		tenantID, displayName, phone,
	).Scan(&id)

	return id, err
}

func (s *Service) addActivity(ctx context.Context, tenantID, leadID, message string) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO lead_activities (tenant_id, lead_id, type, description)
		VALUES ($1, $2, 'whatsapp', $3)`,
		tenantID, leadID, truncate(message, 1000),
	)
	return err
}

func normalizePhone(jid string) string {
	// Strip @s.whatsapp.net suffix
	phone := strings.Split(jid, "@")[0]
	// Keep only digits
	phone = nonDigit.ReplaceAllString(phone, "")
	if len(phone) < 8 {
		return ""
	}
	return phone
}

func truncate(s string, max int) string {
	runes := []rune(s)
	if len(runes) <= max {
		return s
	}
	return string(runes[:max])
}
