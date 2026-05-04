package customers

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

// GET /api/customers
func (h *Handler) List(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	f := ListFilter{
		Search: c.Query("search"),
		State:  c.Query("state"),
		Limit:  queryInt(c.Query("limit"), 20),
		Offset: queryInt(c.Query("offset"), 0),
	}
	if v := c.Query("active"); v != "" {
		b := v == "true"
		f.IsActive = &b
	}

	list, total, err := h.svc.List(c.Request.Context(), tenantID, f)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSONWithMeta(c, http.StatusOK, list, &response.Meta{
		Total:  total,
		Limit:  f.Limit,
		Offset: f.Offset,
	})
}

// POST /api/customers
func (h *Handler) Create(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	var req CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	cust, err := h.svc.Create(c.Request.Context(), tenantID, &req)
	if err != nil {
		var valErr validationErr
		if errors.As(err, &valErr) {
			response.BadRequest(c, valErr.Error())
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusCreated, cust)
}

// GET /api/customers/:id
func (h *Handler) Get(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	cust, err := h.svc.GetByID(c.Request.Context(), tenantID, c.Param("id"))
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(c)
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, cust)
}

// PUT /api/customers/:id
func (h *Handler) Update(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	cust, err := h.svc.Update(c.Request.Context(), tenantID, c.Param("id"), &req)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(c)
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, cust)
}

// DELETE /api/customers/:id
func (h *Handler) Delete(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	if err := h.svc.Delete(c.Request.Context(), tenantID, c.Param("id")); err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(c)
			return
		}
		response.InternalError(c)
		return
	}
	response.NoContent(c)
}

func queryInt(s string, fallback int) int {
	if v, err := strconv.Atoi(s); err == nil && v > 0 {
		return v
	}
	return fallback
}
