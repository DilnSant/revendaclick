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
	// Validate Evolution API key header
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
