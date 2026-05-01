package plans

import (
	"net/http"

	"github.com/gin-gonic/gin"
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
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, usage)
}
