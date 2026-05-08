package leads

import (
	"errors"
	"net/http"
	"strconv"

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

// GET /api/leads
func (h *Handler) List(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	userRole := middleware.UserRoleFromGin(c)
	userID := middleware.UserIDFromGin(c)

	f := ListFilter{
		Status: c.Query("status"),
		Limit:  queryInt(c.Query("limit"), 50),
		Offset: queryInt(c.Query("offset"), 0),
	}
	// Sellers only see leads assigned to them
	if userRole == "seller" {
		f.SellerID = userID
	}

	list, total, err := h.svc.List(c.Request.Context(), tenantID, f)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSONWithMeta(c, http.StatusOK, list, &response.Meta{Total: total, Limit: f.Limit, Offset: f.Offset})
}

// POST /api/leads  (also public — SlugTenantResolver sets tenant_id for public route)
func (h *Handler) Create(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	var req CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	l, err := h.svc.Create(c.Request.Context(), tenantID, &req, c.ClientIP())
	if err != nil {
		var valErr validationErr
		if errors.As(err, &valErr) {
			response.BadRequest(c, valErr.Error())
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusCreated, l)
}

// GET /api/leads/:id
func (h *Handler) Get(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	id := c.Param("id")

	l, err := h.svc.GetByID(c.Request.Context(), tenantID, id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(c)
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, l)
}

// PUT /api/leads/:id
func (h *Handler) Update(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	userRole := middleware.UserRoleFromGin(c)
	userID := middleware.UserIDFromGin(c)
	id := c.Param("id")

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	l, err := h.svc.Update(c.Request.Context(), tenantID, id, userRole, userID, &req)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotFound):
			response.NotFound(c)
		case errors.Is(err, ErrForbidden):
			response.Forbidden(c)
		default:
			response.InternalError(c)
		}
		return
	}
	response.JSON(c, http.StatusOK, l)
}

// DELETE /api/leads/:id
func (h *Handler) Delete(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	id := c.Param("id")

	if err := h.svc.Delete(c.Request.Context(), tenantID, id); err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(c)
			return
		}
		response.InternalError(c)
		return
	}
	response.NoContent(c)
}

// GET /api/leads/:id/activities
func (h *Handler) ListActivities(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	leadID := c.Param("id")

	list, err := h.svc.ListActivities(c.Request.Context(), tenantID, leadID)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, list)
}

// POST /api/leads/:id/activities
func (h *Handler) AddActivity(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	userID := middleware.UserIDFromGin(c)
	leadID := c.Param("id")

	var req AddActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	a, err := h.svc.AddActivity(c.Request.Context(), tenantID, leadID, userID, &req)
	if err != nil {
		var valErr validationErr
		if errors.As(err, &valErr) {
			response.BadRequest(c, valErr.Error())
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusCreated, a)
}

// GET /api/leads/follow-ups — returns overdue and due-today leads
func (h *Handler) ListFollowUps(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	userRole := middleware.UserRoleFromGin(c)
	userID := middleware.UserIDFromGin(c)

	sellerFilter := ""
	if userRole == "seller" {
		sellerFilter = userID
	}

	list, err := h.svc.ListFollowUps(c.Request.Context(), tenantID, sellerFilter)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, list)
}

func queryInt(s string, fallback int) int {
	if v, err := strconv.Atoi(s); err == nil && v > 0 {
		return v
	}
	return fallback
}
