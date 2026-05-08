package audit

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	appMiddleware "revendaclick/backend/internal/middleware"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) List(c *gin.Context) {
	tenantID := c.GetString(appMiddleware.CtxTenantID)
	if tenantID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "tenant required"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit > 200 {
		limit = 200
	}

	logs, err := h.repo.List(c.Request.Context(), tenantID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load audit logs"})
		return
	}

	if logs == nil {
		logs = []*Log{}
	}
	c.JSON(http.StatusOK, gin.H{"data": logs})
}
