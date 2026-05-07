package evolution

import (
	"net/http"

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
		c.Status(http.StatusUnauthorized)
		return
	}

	var payload WebhookPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.Status(http.StatusBadRequest)
		return
	}

	if err := h.svc.HandleWebhook(c.Request.Context(), &payload); err != nil {
		h.logger.Error("evolution webhook error", zap.Error(err))
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
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "QR não disponível. Instância pode não existir."})
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

	// Try to create instance (idempotent — Evolution API returns 400 if exists)
	_ = h.svc.CreateInstance(c.Request.Context(), slug)

	qr, err := h.svc.GetQRCode(c.Request.Context(), slug)
	if err != nil {
		h.logger.Warn("evolution: connect get qr", zap.Error(err))
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Não foi possível obter QR code."})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": qr})
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
