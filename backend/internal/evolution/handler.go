package evolution

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type Handler struct {
	svc    *Service
	apiKey string
	logger *zap.Logger
}

func NewHandler(svc *Service, apiKey string, logger *zap.Logger) *Handler {
	return &Handler{svc: svc, apiKey: apiKey, logger: logger}
}

// POST /api/webhooks/evolution
func (h *Handler) Webhook(c *gin.Context) {
	incomingKey := c.GetHeader("apikey")
	if h.apiKey != "" && incomingKey != h.apiKey {
		h.logger.Warn("evolution webhook: invalid apikey", zap.String("ip", c.ClientIP()))
		c.Status(http.StatusUnauthorized)
		return
	}

	// Body size guard — prevent large payloads from media messages
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 512*1024)

	var payload WebhookPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.Status(http.StatusBadRequest)
		return
	}

	h.logger.Debug("evolution webhook received",
		zap.String("event", payload.Event),
		zap.String("instance", payload.Instance),
	)

	if err := h.svc.HandleWebhook(c.Request.Context(), &payload); err != nil {
		h.logger.Error("evolution webhook error",
			zap.String("event", payload.Event),
			zap.String("instance", payload.Instance),
			zap.Error(err),
		)
		c.Status(http.StatusInternalServerError)
		return
	}

	c.Status(http.StatusOK)
}

// GET /api/evolution/status — returns connection status for tenant's instance
func (h *Handler) GetStatus(c *gin.Context) {
	slug := c.GetString("tenant_slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tenant slug not resolved"})
		return
	}

	status, err := h.svc.GetInstanceStatus(c.Request.Context(), slug)
	if err != nil {
		h.logger.Warn("evolution: get status", zap.Error(err))
		c.JSON(http.StatusOK, &InstanceStatus{InstanceName: slug, Status: "disconnected"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": status})
}

// GET /api/evolution/qr — returns QR code for tenant to scan
func (h *Handler) GetQR(c *gin.Context) {
	slug := c.GetString("tenant_slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tenant slug not resolved"})
		return
	}

	qr, err := h.svc.GetQRCode(c.Request.Context(), slug)
	if err != nil {
		h.logger.Warn("evolution: get qr", zap.Error(err))
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": gin.H{
			"code":    "evolution_unavailable",
			"message": "Serviço WhatsApp temporariamente indisponível. Aguarde alguns segundos e tente novamente.",
		}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": qr})
}

// POST /api/evolution/connect — creates instance if missing, returns QR
func (h *Handler) Connect(c *gin.Context) {
	slug := c.GetString("tenant_slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tenant slug not resolved"})
		return
	}

	// Try to create instance (idempotent — Evolution returns 400 if already exists)
	created, err := h.svc.CreateInstance(c.Request.Context(), slug)
	if err != nil {
		h.logger.Warn("evolution: create instance", zap.Error(err))
	}

	// If newly created, give Evolution a moment to initialise the instance
	// before requesting the QR code (otherwise Evolution may return an error)
	if created {
		select {
		case <-c.Request.Context().Done():
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": gin.H{
				"code":    "evolution_unavailable",
				"message": "Serviço WhatsApp indisponível. Tente novamente.",
			}})
			return
		case <-time.After(2 * time.Second):
		}
	}

	qr, err := h.svc.GetQRCode(c.Request.Context(), slug)
	if err != nil {
		h.logger.Warn("evolution: connect get qr", zap.Error(err))
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": gin.H{
			"code":    "evolution_unavailable",
			"message": "Serviço WhatsApp temporariamente indisponível. Aguarde alguns segundos e tente novamente.",
		}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": qr})
}

// GET /api/evolution/health — probes whether Evolution API is reachable
// Returns 200 if up, 503 if down. Used by the frontend to show startup state.
func (h *Handler) GetHealth(c *gin.Context) {
	up := h.svc.IsReachable(c.Request.Context())
	if !up {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "unavailable"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// DELETE /api/evolution/disconnect — logs out tenant instance
func (h *Handler) Disconnect(c *gin.Context) {
	slug := c.GetString("tenant_slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tenant slug not resolved"})
		return
	}

	if err := h.svc.DisconnectInstance(c.Request.Context(), slug); err != nil {
		h.logger.Warn("evolution: disconnect", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Desconectado com sucesso."})
}
