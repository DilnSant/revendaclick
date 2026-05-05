package billing

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"revendaclick/backend/internal/middleware"
	"revendaclick/backend/internal/response"
)

type Handler struct {
	svc       *Service
	asaasToken string // webhook auth token (same as API key prefix or separate secret)
}

func NewHandler(svc *Service, asaasToken string) *Handler {
	return &Handler{svc: svc, asaasToken: asaasToken}
}

// GET /api/billing/subscription
func (h *Handler) GetSubscription(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	sub, err := h.svc.GetSubscription(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalError(c)
		return
	}
	if sub == nil {
		response.NotFound(c)
		return
	}
	response.JSON(c, http.StatusOK, sub)
}

// POST /api/billing/subscribe
func (h *Handler) Subscribe(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	var req SubscribeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if req.PlanName == "" {
		response.BadRequest(c, "plan_name is required")
		return
	}

	sub, err := h.svc.Subscribe(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, sub)
}

// POST /api/webhooks/asaas  (public — validated by token header)
func (h *Handler) Webhook(c *gin.Context) {
	token := c.GetHeader("asaas-access-token")
	if h.asaasToken != "" && token != h.asaasToken {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	var wh AsaasWebhook
	if err := c.ShouldBindJSON(&wh); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	if err := h.svc.HandleWebhook(c.Request.Context(), &wh); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"received": true})
}
