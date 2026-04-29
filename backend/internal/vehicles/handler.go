package vehicles

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

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

// GET /api/vehicles
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantIDFromCtx(r.Context())
	q := r.URL.Query()

	f := ListFilter{
		Status:    q.Get("status"),
		Brand:     q.Get("brand"),
		Condition: q.Get("condition"),
		Limit:     queryInt(q.Get("limit"), 20),
		Offset:    queryInt(q.Get("offset"), 0),
	}
	if v := q.Get("min_price"); v != "" {
		if p, err := strconv.ParseFloat(v, 64); err == nil {
			f.MinPrice = &p
		}
	}
	if v := q.Get("max_price"); v != "" {
		if p, err := strconv.ParseFloat(v, 64); err == nil {
			f.MaxPrice = &p
		}
	}

	list, total, err := h.svc.List(r.Context(), tenantID, f)
	if err != nil {
		response.InternalError(w)
		return
	}
	response.JSONWithMeta(w, http.StatusOK, list, &response.Meta{
		Total:  total,
		Limit:  f.Limit,
		Offset: f.Offset,
	})
}

// POST /api/vehicles
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantIDFromCtx(r.Context())

	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	v, err := h.svc.Create(r.Context(), tenantID, &req)
	if err != nil {
		if errors.Is(err, ErrLimitReached) {
			response.ErrUpgrade(w, "Você atingiu o limite de veículos do seu plano. Faça upgrade para continuar.")
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
	response.JSON(w, http.StatusCreated, v)
}

// GET /api/vehicles/{id}
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantIDFromCtx(r.Context())
	id := chi.URLParam(r, "id")

	v, err := h.svc.GetByID(r.Context(), tenantID, id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(w)
			return
		}
		response.InternalError(w)
		return
	}
	response.JSON(w, http.StatusOK, v)
}

// PUT /api/vehicles/{id}
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.TenantIDFromCtx(ctx)
	userRole := middleware.UserRoleFromCtx(ctx)
	userID := middleware.UserIDFromCtx(ctx)
	id := chi.URLParam(r, "id")

	var req UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	v, err := h.svc.Update(ctx, tenantID, id, userRole, userID, &req)
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
	response.JSON(w, http.StatusOK, v)
}

// DELETE /api/vehicles/{id}
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantIDFromCtx(r.Context())
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(r.Context(), tenantID, id); err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(w)
			return
		}
		response.InternalError(w)
		return
	}
	response.NoContent(w)
}

// GET /api/public/{slug}/vehicles
func (h *Handler) ListPublic(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantIDFromCtx(r.Context())
	q := r.URL.Query()

	f := ListFilter{
		Status:    "available",
		Brand:     q.Get("brand"),
		Condition: q.Get("condition"),
		Limit:     queryInt(q.Get("limit"), 20),
		Offset:    queryInt(q.Get("offset"), 0),
	}

	list, total, err := h.svc.List(r.Context(), tenantID, f)
	if err != nil {
		response.InternalError(w)
		return
	}
	response.JSONWithMeta(w, http.StatusOK, list, &response.Meta{Total: total, Limit: f.Limit, Offset: f.Offset})
}

// GET /api/public/{slug}/vehicles/{vehicleSlug}
func (h *Handler) GetPublic(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantIDFromCtx(r.Context())
	slug := chi.URLParam(r, "vehicleSlug")

	v, err := h.svc.GetBySlug(r.Context(), tenantID, slug)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(w)
			return
		}
		response.InternalError(w)
		return
	}
	response.JSON(w, http.StatusOK, v)
}

func queryInt(s string, fallback int) int {
	if v, err := strconv.Atoi(s); err == nil && v > 0 {
		return v
	}
	return fallback
}
