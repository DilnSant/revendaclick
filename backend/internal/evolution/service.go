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
		client: &http.Client{Timeout: 15 * time.Second},
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
