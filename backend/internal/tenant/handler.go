package tenant

import (
	"encoding/json"
	"errors"
	"net/http"

	"revendaclick/backend/internal/middleware"
	"revendaclick/backend/internal/response"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// GET /api/tenants/me
func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	id := middleware.TenantIDFromCtx(r.Context())
	t, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(w)
			return
		}
		response.InternalError(w)
		return
	}
	response.JSON(w, http.StatusOK, t)
}

// PUT /api/tenants/me
func (h *Handler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	id := middleware.TenantIDFromCtx(r.Context())

	var req UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	t, err := h.svc.Update(r.Context(), id, &req)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(w)
			return
		}
		response.InternalError(w)
		return
	}
	response.JSON(w, http.StatusOK, t)
}

// POST /api/tenants  (used by onboarding, typically via service_role)
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	t, err := h.svc.Create(r.Context(), &req)
	if err != nil {
		var valErr ErrValidation
		if errors.As(err, &valErr) {
			response.BadRequest(w, valErr.Error())
			return
		}
		response.InternalError(w)
		return
	}
	response.JSON(w, http.StatusCreated, t)
}

// GET /api/public/{slug}  (no auth)
func (h *Handler) GetPublic(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	t, err := h.svc.GetBySlug(r.Context(), slug)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(w)
			return
		}
		response.InternalError(w)
		return
	}
	// Strip sensitive fields for public response
	pub := map[string]any{
		"id":             t.ID,
		"slug":           t.Slug,
		"name":           t.Name,
		"phone_whatsapp": t.PhoneWhatsApp,
		"logo_url":       t.LogoURL,
		"description":    t.Description,
		"social_links":   t.SocialLinks,
		"seo_title":      t.SEOTitle,
		"seo_description": t.SEODescription,
		"theme":          t.Theme,
	}
	response.JSON(w, http.StatusOK, pub)
}
