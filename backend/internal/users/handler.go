package users

import (
	"errors"
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

// GET /api/users/sellers
func (h *Handler) ListSellers(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	list, err := h.svc.ListSellers(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, list)
}

// GET /api/users  (admin only)
func (h *Handler) List(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	list, err := h.svc.List(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, list)
}

// POST /api/users  (admin only)
func (h *Handler) Create(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	var req CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	u, err := h.svc.Create(c.Request.Context(), tenantID, &req)
	if err != nil {
		if errors.Is(err, ErrLimitReached) {
			response.ErrUpgrade(c, "Você atingiu o limite de usuários do seu plano. Faça upgrade para continuar.")
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
	response.JSON(c, http.StatusCreated, u)
}

// GET /api/users/:id
func (h *Handler) Get(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	id := c.Param("id")

	u, err := h.svc.GetByID(c.Request.Context(), tenantID, id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(c)
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, u)
}

// PUT /api/users/:id
func (h *Handler) Update(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	callerRole := middleware.UserRoleFromGin(c)
	callerID := middleware.UserIDFromGin(c)
	id := c.Param("id")

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	u, err := h.svc.Update(c.Request.Context(), tenantID, id, callerRole, callerID, &req)
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
	response.JSON(c, http.StatusOK, u)
}

// DELETE /api/users/:id  (admin only)
func (h *Handler) Delete(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	callerID := middleware.UserIDFromGin(c)
	id := c.Param("id")

	if err := h.svc.Delete(c.Request.Context(), tenantID, id, callerID); err != nil {
		switch {
		case errors.Is(err, ErrNotFound):
			response.NotFound(c)
		case errors.Is(err, ErrForbidden):
			response.Forbidden(c)
		default:
			var valErr validationErr
			if errors.As(err, &valErr) {
				response.BadRequest(c, valErr.Error())
				return
			}
			response.InternalError(c)
		}
		return
	}
	response.NoContent(c)
}
