package analytics

import (
	"net/http"

	"github.com/gin-gonic/gin"
	appMiddleware "revendaclick/backend/internal/middleware"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) GetSummary(c *gin.Context) {
	tenantID := c.GetString(appMiddleware.CtxTenantID)
	if tenantID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "tenant required"})
		return
	}

	summary, err := h.svc.GetSummary(c.Request.Context(), tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load analytics"})
		return
	}

	c.JSON(http.StatusOK, summary)
}
