package admin

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"revendaclick/backend/internal/response"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

// GET /api/admin/tenants
func (h *Handler) ListTenants(c *gin.Context) {
	list, err := h.repo.ListTenants(c.Request.Context())
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, gin.H{"tenants": list, "total": len(list)})
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
	response.JSON(c, http.StatusOK, gin.H{"extended": true, "days": req.Days})
}

// POST /api/admin/tenants/:id/block
func (h *Handler) BlockTenant(c *gin.Context) {
	tenantID := c.Param("id")
	if err := h.repo.BlockTenant(c.Request.Context(), tenantID); err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, gin.H{"blocked": true})
}

// POST /api/admin/tenants/:id/unblock
func (h *Handler) UnblockTenant(c *gin.Context) {
	tenantID := c.Param("id")
	if err := h.repo.UnblockTenant(c.Request.Context(), tenantID); err != nil {
		response.InternalError(c)
		return
	}
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
	response.JSON(c, http.StatusOK, gin.H{"revoked": true, "feature": feature})
}
