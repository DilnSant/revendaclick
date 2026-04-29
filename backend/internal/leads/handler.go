package leads

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

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

// GET /api/leads
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.TenantIDFromCtx(ctx)
	userRole := middleware.UserRoleFromCtx(ctx)
	userID := middleware.UserIDFromCtx(ctx)
	q := r.URL.Query()

	f := ListFilter{
		Status: q.Get("status"),
		Limit:  queryInt(q.Get("limit"), 50),
		Offset: queryInt(q.Get("offset"), 0),
	}

	// Sellers only see their own leads
	if userRole == "seller" {
		f.SellerID = userID
	}

	list, total, err := h.svc.List(ctx, tenantID, f)
	if err != nil {
		response.InternalError(w)
		return
	}
	response.JSONWithMeta(w, http.StatusOK, list, &response.Meta{Total: total, Limit: f.Limit, Offset: f.Offset})
}

// POST /api/leads  (also public — no auth required)
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantIDFromCtx(r.Context())
	if tenantID == "" {
		// Public route: get tenantID from slug in URL
		tenantID = r.PathValue("tenantID")
	}

	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	ip := extractIP(r)
	l, err := h.svc.Create(r.Context(), tenantID, &req, ip)
	if err != nil {
		var valErr validationErr
		if errors.As(err, &valErr) {
			response.BadRequest(w, valErr.Error())
			return
		}
		response.InternalError(w)
		return
	}
	response.JSON(w, http.StatusCreated, l)
}

// GET /api/leads/{id}
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantIDFromCtx(r.Context())
	id := chi.URLParam(r, "id")

	l, err := h.svc.GetByID(r.Context(), tenantID, id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(w)
			return
		}
		response.InternalError(w)
		return
	}
	response.JSON(w, http.StatusOK, l)
}

// PUT /api/leads/{id}
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

	l, err := h.svc.Update(ctx, tenantID, id, userRole, userID, &req)
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
	response.JSON(w, http.StatusOK, l)
}

// DELETE /api/leads/{id}
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

// GET /api/leads/{id}/activities
func (h *Handler) ListActivities(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantIDFromCtx(r.Context())
	leadID := chi.URLParam(r, "id")

	list, err := h.svc.ListActivities(r.Context(), tenantID, leadID)
	if err != nil {
		response.InternalError(w)
		return
	}
	response.JSON(w, http.StatusOK, list)
}

// POST /api/leads/{id}/activities
func (h *Handler) AddActivity(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.TenantIDFromCtx(ctx)
	userID := middleware.UserIDFromCtx(ctx)
	leadID := chi.URLParam(r, "id")

	var req AddActivityRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	a, err := h.svc.AddActivity(ctx, tenantID, leadID, userID, &req)
	if err != nil {
		var valErr validationErr
		if errors.As(err, &valErr) {
			response.BadRequest(w, valErr.Error())
			return
		}
		response.InternalError(w)
		return
	}
	response.JSON(w, http.StatusCreated, a)
}

func extractIP(r *http.Request) string {
	if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
		return strings.Split(ip, ",")[0]
	}
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	return strings.Split(r.RemoteAddr, ":")[0]
}

func queryInt(s string, fallback int) int {
	if v, err := parseInt(s); err == nil && v > 0 {
		return v
	}
	return fallback
}

func parseInt(s string) (int, error) {
	if s == "" {
		return 0, errors.New("empty")
	}
	v := 0
	for _, c := range s {
		if c < '0' || c > '9' {
			return 0, errors.New("not a digit")
		}
		v = v*10 + int(c-'0')
	}
	return v, nil
}
