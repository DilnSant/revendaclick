package landinglead

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// Payload mirrors what the Next.js API route sends in fireWebhook().
type Payload struct {
	Name          string  `json:"name"`
	Phone         string  `json:"phone"`
	VehiclesCount *string `json:"vehicles_count"`
	City          *string `json:"city"`
	State         *string `json:"state"`
	Source        string  `json:"source"`
	UTMSource     *string `json:"utm_source"`
	UTMCampaign   *string `json:"utm_campaign"`
	CreatedAt     string  `json:"created_at"`
}

type evolutionSender interface {
	SendMessage(ctx context.Context, instance, number, text string) error
}

type Handler struct {
	secret   string // optional — matches WEBHOOK_SECRET on the Next.js side
	instance string // Evolution API instance name to send notifications from
	number   string // WhatsApp number to receive lead alerts (e.g. "5511999999999")
	evo      evolutionSender
	logger   *zap.Logger
}

func NewHandler(secret, instance, number string, evo evolutionSender, logger *zap.Logger) *Handler {
	return &Handler{
		secret:   secret,
		instance: strings.TrimSpace(instance),
		number:   strings.TrimSpace(number),
		evo:      evo,
		logger:   logger,
	}
}

// POST /api/webhooks/landing-lead
func (h *Handler) Webhook(c *gin.Context) {
	// Optional secret validation
	if h.secret != "" && c.GetHeader("x-webhook-secret") != h.secret {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid secret"})
		return
	}

	body, err := io.ReadAll(io.LimitReader(c.Request.Body, 32*1024))
	if err != nil || len(body) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "empty body"})
		return
	}

	var p Payload
	if err := json.Unmarshal(body, &p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	phonePreview := p.Phone
	if len(phonePreview) > 4 {
		phonePreview = phonePreview[:4]
	}
	h.logger.Info("landing-lead webhook received",
		zap.String("name", p.Name),
		zap.String("phone", phonePreview+"****"),
	)

	// Send WhatsApp notification if configured
	if h.instance != "" && h.number != "" {
		msg := buildMessage(p)
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()
		if err := h.evo.SendMessage(ctx, h.instance, h.number, msg); err != nil {
			h.logger.Warn("landing-lead: whatsapp notify failed", zap.Error(err))
			// Non-blocking — lead is already saved in Supabase
		}
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}

func buildMessage(p Payload) string {
	var sb strings.Builder
	sb.WriteString("🔔 *Novo Lead RevendaClick*\n\n")
	sb.WriteString(fmt.Sprintf("*Nome:* %s\n", p.Name))
	sb.WriteString(fmt.Sprintf("*Telefone:* %s\n", p.Phone))
	if p.City != nil && *p.City != "" {
		loc := *p.City
		if p.State != nil && *p.State != "" {
			loc += " / " + *p.State
		}
		sb.WriteString(fmt.Sprintf("*Cidade:* %s\n", loc))
	}
	if p.VehiclesCount != nil && *p.VehiclesCount != "" {
		sb.WriteString(fmt.Sprintf("*Estoque:* %s veículos\n", *p.VehiclesCount))
	}
	if p.UTMCampaign != nil && *p.UTMCampaign != "" {
		sb.WriteString(fmt.Sprintf("*Campanha:* %s\n", *p.UTMCampaign))
	} else if p.UTMSource != nil && *p.UTMSource != "" {
		sb.WriteString(fmt.Sprintf("*Origem:* %s\n", *p.UTMSource))
	}
	sb.WriteString(fmt.Sprintf("\n_Recebido em %s_", formatBRT(p.CreatedAt)))
	return sb.String()
}

func formatBRT(iso string) string {
	t, err := time.Parse(time.RFC3339, iso)
	if err != nil {
		return iso
	}
	loc, _ := time.LoadLocation("America/Sao_Paulo")
	return t.In(loc).Format("02/01 15:04")
}
