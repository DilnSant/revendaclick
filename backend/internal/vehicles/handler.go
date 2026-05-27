package vehicles

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

// GET /api/vehicles
func (h *Handler) List(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	f := ListFilter{
		Status:    c.Query("status"),
		Brand:     c.Query("brand"),
		Condition: c.Query("condition"),
		Limit:     queryInt(c.Query("limit"), 20),
		Offset:    queryInt(c.Query("offset"), 0),
	}
	if v := c.Query("min_price"); v != "" {
		if p, err := strconv.ParseFloat(v, 64); err == nil {
			f.MinPrice = &p
		}
	}
	if v := c.Query("max_price"); v != "" {
		if p, err := strconv.ParseFloat(v, 64); err == nil {
			f.MaxPrice = &p
		}
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

// POST /api/vehicles
func (h *Handler) Create(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	var req CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	v, err := h.svc.Create(c.Request.Context(), tenantID, &req)
	if err != nil {
		if errors.Is(err, ErrLimitReached) {
			response.ErrUpgrade(c, "Você atingiu o limite de veículos do seu plano. Faça upgrade para continuar.")
			return
		}
		var valErr validationErr
		if errors.As(err, &valErr) {
			response.BadRequest(c, valErr.Error())
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusCreated, v)
}

// GET /api/vehicles/:id
func (h *Handler) Get(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	id := c.Param("id")

	v, err := h.svc.GetByID(c.Request.Context(), tenantID, id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(c)
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, v)
}

// PUT /api/vehicles/:id
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

	v, err := h.svc.Update(c.Request.Context(), tenantID, id, userRole, userID, &req)
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
	response.JSON(c, http.StatusOK, v)
}

// DELETE /api/vehicles/:id
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

// GET /api/public/:slug/vehicles
func (h *Handler) ListPublic(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	f := ListFilter{
		Status:       "available",
		Brand:        c.Query("brand"),
		Fuel:         c.Query("fuel"),
		Transmission: c.Query("transmission"),
		Condition:    c.Query("condition"),
		Sort:         c.Query("sort"),
		Search:       c.Query("search"),
		Limit:        queryInt(c.Query("limit"), 20),
		Offset:       queryInt(c.Query("offset"), 0),
	}
	if v := c.Query("min_price"); v != "" {
		if p, err := strconv.ParseFloat(v, 64); err == nil {
			f.MinPrice = &p
		}
	}
	if v := c.Query("max_price"); v != "" {
		if p, err := strconv.ParseFloat(v, 64); err == nil {
			f.MaxPrice = &p
		}
	}

	list, total, err := h.svc.List(c.Request.Context(), tenantID, f)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSONWithMeta(c, http.StatusOK, list, &response.Meta{Total: total, Limit: f.Limit, Offset: f.Offset})
}

// GET /api/public/:slug/vehicles/:vehicleSlug
func (h *Handler) GetPublic(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	slug := c.Param("vehicleSlug")

	v, err := h.svc.GetBySlug(c.Request.Context(), tenantID, slug)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(c)
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, v)
}

func queryInt(s string, fallback int) int {
	if v, err := strconv.Atoi(s); err == nil && v > 0 {
		return v
	}
	return fallback
}
