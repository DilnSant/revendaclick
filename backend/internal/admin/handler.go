package admin

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"revendaclick/backend/internal/middleware"
	"revendaclick/backend/internal/response"
)

// whatsappSvc abstracts the evolution.Service methods used by admin.
type whatsappSvc interface {
	GetQRCode(ctx context.Context, slug string) (base64 string, code string, count int, err error)
	DisconnectInstance(ctx context.Context, slug string) error
	CreateInstance(ctx context.Context, slug string) (created bool, err error)
}

type Handler struct {
	repo   *Repository
	waSvc  whatsappSvc
}

func NewHandler(repo *Repository, waSvc whatsappSvc) *Handler {
	return &Handler{repo: repo, waSvc: waSvc}
}

// ── Tenants ───────────────────────────────────────────────────────────────────

// GET /api/admin/tenants
func (h *Handler) ListTenants(c *gin.Context) {
	list, err := h.repo.ListTenants(c.Request.Context())
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, gin.H{"tenants": list, "total": len(list)})
}

// PUT /api/admin/tenants/:id
func (h *Handler) UpdateTenant(c *gin.Context) {
	id := c.Param("id")
	var req UpdateTenantAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if err := h.repo.UpdateTenantAdmin(c.Request.Context(), id, &req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	h.repo.WriteAdminAudit(c.Request.Context(),
		middleware.UserIDFromGin(c), id, "update", "tenant", id,
		nil, map[string]any{"name": req.Name, "email": req.Email, "slug": req.Slug},
		c.ClientIP(),
	)
	response.JSON(c, http.StatusOK, gin.H{"updated": true})
}

// POST /api/admin/tenants/:id/activate
func (h *Handler) ActivateTenant(c *gin.Context) {
	tenantID := c.Param("id")
	var req ActivateRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.PlanName == "" {
		response.BadRequest(c, "plan_name is required")
		return
	}
	req.PlanName = strings.ToLower(strings.TrimSpace(req.PlanName))
	planID, err := h.repo.GetPlanByName(c.Request.Context(), req.PlanName)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	if err := h.repo.ActivateTenant(c.Request.Context(), tenantID, planID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	h.repo.WriteAdminAudit(c.Request.Context(),
		middleware.UserIDFromGin(c), tenantID, "activate", "subscription", tenantID,
		nil, map[string]any{"plan_name": req.PlanName, "status": "active"},
		c.ClientIP(),
	)
	response.JSON(c, http.StatusOK, gin.H{"activated": true, "plan_name": req.PlanName})
}

// POST /api/admin/tenants/:id/extend-trial
func (h *Handler) ExtendTrial(c *gin.Context) {
	tenantID := c.Param("id")
	var req ExtendTrialRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Days <= 0 {
		response.BadRequest(c, "days must be a positive integer")
		return
	}
	if req.Days > 365 {
		response.BadRequest(c, "days must be ≤ 365")
		return
	}
	if err := h.repo.ExtendTrial(c.Request.Context(), tenantID, req.Days); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	h.repo.WriteAdminAudit(c.Request.Context(),
		middleware.UserIDFromGin(c), tenantID, "extend_trial", "subscription", tenantID,
		nil, map[string]any{"days": req.Days},
		c.ClientIP(),
	)
	response.JSON(c, http.StatusOK, gin.H{"extended": true, "days": req.Days})
}

// POST /api/admin/tenants/:id/block
func (h *Handler) BlockTenant(c *gin.Context) {
	tenantID := c.Param("id")
	if err := h.repo.BlockTenant(c.Request.Context(), tenantID); err != nil {
		response.InternalError(c)
		return
	}
	h.repo.WriteAdminAudit(c.Request.Context(),
		middleware.UserIDFromGin(c), tenantID, "block", "tenant", tenantID,
		map[string]any{"is_active": true}, map[string]any{"is_active": false},
		c.ClientIP(),
	)
	response.JSON(c, http.StatusOK, gin.H{"blocked": true})
}

// POST /api/admin/tenants/:id/unblock
func (h *Handler) UnblockTenant(c *gin.Context) {
	tenantID := c.Param("id")
	if err := h.repo.UnblockTenant(c.Request.Context(), tenantID); err != nil {
		response.InternalError(c)
		return
	}
	h.repo.WriteAdminAudit(c.Request.Context(),
		middleware.UserIDFromGin(c), tenantID, "unblock", "tenant", tenantID,
		map[string]any{"is_active": false}, map[string]any{"is_active": true},
		c.ClientIP(),
	)
	response.JSON(c, http.StatusOK, gin.H{"unblocked": true})
}

// GET /api/admin/tenants/:id/features
func (h *Handler) ListFeatures(c *gin.Context) {
	tenantID := c.Param("id")
	list, err := h.repo.ListGrantedFeatures(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, gin.H{"features": list})
}

// POST /api/admin/tenants/:id/features
func (h *Handler) GrantFeature(c *gin.Context) {
	tenantID := c.Param("id")
	var req GrantFeatureRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Feature == "" {
		response.BadRequest(c, "feature is required")
		return
	}
	grant, err := h.repo.GrantFeature(c.Request.Context(), tenantID, req.Feature, req.Note, req.ExpiresAt)
	if err != nil {
		response.InternalError(c)
		return
	}
	h.repo.WriteAdminAudit(c.Request.Context(),
		middleware.UserIDFromGin(c), tenantID, "grant_feature", "tenant_feature", tenantID,
		nil, map[string]any{"feature": req.Feature, "note": req.Note},
		c.ClientIP(),
	)
	response.JSON(c, http.StatusOK, grant)
}

// DELETE /api/admin/tenants/:id/features/:feature
func (h *Handler) RevokeFeature(c *gin.Context) {
	tenantID := c.Param("id")
	feature := c.Param("feature")
	if err := h.repo.RevokeFeature(c.Request.Context(), tenantID, feature); err != nil {
		response.InternalError(c)
		return
	}
	h.repo.WriteAdminAudit(c.Request.Context(),
		middleware.UserIDFromGin(c), tenantID, "revoke_feature", "tenant_feature", tenantID,
		map[string]any{"feature": feature}, nil,
		c.ClientIP(),
	)
	response.JSON(c, http.StatusOK, gin.H{"revoked": true, "feature": feature})
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

// GET /api/admin/subscriptions
func (h *Handler) ListSubscriptions(c *gin.Context) {
	list, err := h.repo.ListSubscriptions(c.Request.Context())
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, gin.H{"subscriptions": list, "total": len(list)})
}

// PUT /api/admin/subscriptions/:tenantId
func (h *Handler) UpdateSubscription(c *gin.Context) {
	tenantID := c.Param("tenantId")
	var req UpdateSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if req.PlanName != nil {
		*req.PlanName = strings.ToLower(strings.TrimSpace(*req.PlanName))
	}
	if err := h.repo.UpdateSubscription(c.Request.Context(), tenantID, &req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	h.repo.WriteAdminAudit(c.Request.Context(),
		middleware.UserIDFromGin(c), tenantID, "update", "subscription", tenantID,
		nil, map[string]any{"plan_name": req.PlanName, "status": req.Status},
		c.ClientIP(),
	)
	response.JSON(c, http.StatusOK, gin.H{"updated": true})
}

// ── Users ─────────────────────────────────────────────────────────────────────

// GET /api/admin/users
func (h *Handler) ListUsersAdmin(c *gin.Context) {
	list, err := h.repo.ListUsersAdmin(c.Request.Context())
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, gin.H{"users": list, "total": len(list)})
}

// PUT /api/admin/users/:id
func (h *Handler) UpdateUserAdmin(c *gin.Context) {
	id := c.Param("id")
	var req UpdateUserAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	u, err := h.repo.UpdateUserAdmin(c.Request.Context(), id, &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	tenantID := ""
	if u.TenantID != nil {
		tenantID = *u.TenantID
	}
	h.repo.WriteAdminAudit(c.Request.Context(),
		middleware.UserIDFromGin(c), tenantID, "update", "user", id,
		nil, map[string]any{"role": req.Role, "is_active": req.IsActive, "name": req.Name},
		c.ClientIP(),
	)
	response.JSON(c, http.StatusOK, u)
}

// ── Plans ─────────────────────────────────────────────────────────────────────

// GET /api/admin/plans
func (h *Handler) ListPlansAdmin(c *gin.Context) {
	list, err := h.repo.ListPlansAdmin(c.Request.Context())
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, gin.H{"plans": list})
}

// PUT /api/admin/plans/:id
func (h *Handler) UpdatePlan(c *gin.Context) {
	id := c.Param("id")
	var req UpdatePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	p, err := h.repo.UpdatePlan(c.Request.Context(), id, &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	h.repo.WriteAdminAudit(c.Request.Context(),
		middleware.UserIDFromGin(c), "", "update", "plan", id,
		nil, map[string]any{"display_name": req.DisplayName, "price_monthly": req.PriceMonthly, "features": req.Features},
		c.ClientIP(),
	)
	response.JSON(c, http.StatusOK, p)
}

// ── WhatsApp ──────────────────────────────────────────────────────────────────

// POST /api/admin/whatsapp/:name/disconnect
func (h *Handler) WADisconnect(c *gin.Context) {
	name := c.Param("name")
	if h.waSvc == nil {
		response.BadRequest(c, "evolution service not configured")
		return
	}
	if err := h.waSvc.DisconnectInstance(c.Request.Context(), name); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	h.repo.WriteAdminAudit(c.Request.Context(),
		middleware.UserIDFromGin(c), "", "disconnect", "whatsapp_instance", "",
		map[string]any{"name": name}, nil,
		c.ClientIP(),
	)
	response.JSON(c, http.StatusOK, gin.H{"disconnected": true, "instance": name})
}

// POST /api/admin/whatsapp/:name/restart
func (h *Handler) WARestart(c *gin.Context) {
	name := c.Param("name")
	if h.waSvc == nil {
		response.BadRequest(c, "evolution service not configured")
		return
	}
	_ = h.waSvc.DisconnectInstance(c.Request.Context(), name)
	_, err := h.waSvc.CreateInstance(c.Request.Context(), name)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	h.repo.WriteAdminAudit(c.Request.Context(),
		middleware.UserIDFromGin(c), "", "restart", "whatsapp_instance", "",
		nil, map[string]any{"name": name},
		c.ClientIP(),
	)
	response.JSON(c, http.StatusOK, gin.H{"restarted": true, "instance": name})
}

// GET /api/admin/whatsapp/:name/qr
func (h *Handler) WAGetQR(c *gin.Context) {
	name := c.Param("name")
	if h.waSvc == nil {
		response.BadRequest(c, "evolution service not configured")
		return
	}
	base64, code, count, err := h.waSvc.GetQRCode(c.Request.Context(), name)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, QRAdminResp{Base64: base64, Code: code, Count: count})
}
