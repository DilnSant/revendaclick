package billing

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"revendaclick/backend/internal/middleware"
	"revendaclick/backend/internal/response"
)

type Handler struct {
	svc        *Service
	asaasToken string // webhook access token (Asaas dashboard → Integrações → Webhooks)
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

// DELETE /api/billing/subscription
func (h *Handler) Cancel(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	if err := h.svc.CancelSubscription(c.Request.Context(), tenantID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, gin.H{"canceled": true})
}

// POST /api/billing/reactivate
func (h *Handler) Reactivate(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	if err := h.svc.ReactivateSubscription(c.Request.Context(), tenantID); err != nil {
		response.InternalError(c)
		return
	}
	sub, _ := h.svc.GetSubscription(c.Request.Context(), tenantID)
	response.JSON(c, http.StatusOK, sub)
}

// GET /api/billing/invoices
func (h *Handler) ListInvoices(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	invoices, err := h.svc.ListInvoices(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, gin.H{"invoices": invoices, "total": len(invoices)})
}

// POST /api/webhooks/asaas — public, validated by access-token header
func (h *Handler) Webhook(c *gin.Context) {
	if h.asaasToken != "" {
		if c.GetHeader("asaas-access-token") != h.asaasToken {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
	}

	rawBody, err := io.ReadAll(c.Request.Body)
	if err != nil || len(rawBody) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "empty body"})
		return
	}
	if len(rawBody) > 64*1024 {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "payload too large"})
		return
	}

	var wh AsaasWebhook
	if err := json.Unmarshal(rawBody, &wh); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	if err := h.svc.HandleWebhook(c.Request.Context(), &wh, rawBody); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"received": true, "event": wh.Event})
}
