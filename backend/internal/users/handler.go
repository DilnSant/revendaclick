package users

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"revendaclick/backend/internal/middleware"
	"revendaclick/backend/internal/response"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// GET /api/users
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantIDFromCtx(r.Context())
	list, err := h.svc.List(r.Context(), tenantID)
	if err != nil {
		response.InternalError(w)
		return
	}
	response.JSON(w, http.StatusOK, list)
}

// POST /api/users
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantIDFromCtx(r.Context())

	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	u, err := h.svc.Create(r.Context(), tenantID, &req)
	if err != nil {
		if errors.Is(err, ErrLimitReached) {
			response.ErrUpgrade(w, "Você atingiu o limite de usuários do seu plano. Faça upgrade para continuar.")
			return
		}
		var valErr validationErr
		if errors.As(err, &valErr) {
			response.BadRequest(w, valErr.Error())
			return
		}
		response.InternalError(w)
		return
	}
	response.JSON(w, http.StatusCreated, u)
}

// GET /api/users/{id}
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantIDFromCtx(r.Context())
	id := chi.URLParam(r, "id")

	u, err := h.svc.GetByID(r.Context(), tenantID, id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(w)
			return
		}
		response.InternalError(w)
		return
	}
	response.JSON(w, http.StatusOK, u)
}

// PUT /api/users/{id}
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.TenantIDFromCtx(ctx)
	callerRole := middleware.UserRoleFromCtx(ctx)
	callerID := middleware.UserIDFromCtx(ctx)
	id := chi.URLParam(r, "id")

	var req UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	u, err := h.svc.Update(ctx, tenantID, id, callerRole, callerID, &req)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotFound):
			response.NotFound(w)
		case errors.Is(err, ErrForbidden):
			response.Forbidden(w)
		default:
			response.InternalError(w)
		}
		return
	}
	response.JSON(w, http.StatusOK, u)
}

// DELETE /api/users/{id}
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.TenantIDFromCtx(ctx)
	callerID := middleware.UserIDFromCtx(ctx)
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(ctx, tenantID, id, callerID); err != nil {
		switch {
		case errors.Is(err, ErrNotFound):
			response.NotFound(w)
		case errors.Is(err, ErrForbidden):
			response.Forbidden(w)
		default:
			var valErr validationErr
			if errors.As(err, &valErr) {
				response.BadRequest(w, valErr.Error())
				return
			}
			response.InternalError(w)
		}
		return
	}
	response.NoContent(w)
}

// GET /api/users/sellers
func (h *Handler) ListSellers(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantIDFromCtx(r.Context())
	list, err := h.svc.ListSellers(r.Context(), tenantID)
	if err != nil {
		response.InternalError(w)
		return
	}
	response.JSON(w, http.StatusOK, list)
}
