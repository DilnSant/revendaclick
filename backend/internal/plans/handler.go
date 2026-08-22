package plans

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"revendaclick/backend/internal/middleware"
	"revendaclick/backend/internal/response"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// GET /api/plans  (public)
func (h *Handler) ListPlans(c *gin.Context) {
	plans, err := h.svc.ListPlans(c.Request.Context())
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, plans)
}

// GET /api/usage  (protected)
func (h *Handler) GetUsage(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	usage, err := h.svc.GetUsage(c.Request.Context(), tenantID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Tenant has no subscription row at all (should not happen post-onboarding,
			// but must not surface as a 500 — it is an expected "no subscription" state).
			response.Err(c, http.StatusNotFound, "no_subscription", "No subscription found for this tenant")
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, usage)
}
