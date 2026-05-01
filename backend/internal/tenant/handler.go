package tenant

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

// GET /api/tenants/me
func (h *Handler) GetMe(c *gin.Context) {
	id := middleware.TenantIDFromGin(c)
	t, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(c)
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, t)
}

// PUT /api/tenants/me  (owner/admin)
func (h *Handler) UpdateMe(c *gin.Context) {
	id := middleware.TenantIDFromGin(c)

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	t, err := h.svc.Update(c.Request.Context(), id, &req)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(c)
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, t)
}

// POST /api/tenants  (onboarding, service-role only)
func (h *Handler) Create(c *gin.Context) {
	var req CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	t, err := h.svc.Create(c.Request.Context(), &req)
	if err != nil {
		var valErr ErrValidation
		if errors.As(err, &valErr) {
			response.BadRequest(c, valErr.Error())
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusCreated, t)
}

// GET /api/public/:slug  (no auth)
func (h *Handler) GetPublic(c *gin.Context) {
	slug := c.Param("slug")
	t, err := h.svc.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(c)
			return
		}
		response.InternalError(c)
		return
	}
	// Strip sensitive fields for public response
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"id":              t.ID,
			"slug":            t.Slug,
			"name":            t.Name,
			"phone_whatsapp":  t.PhoneWhatsApp,
			"logo_url":        t.LogoURL,
			"description":     t.Description,
			"social_links":    t.SocialLinks,
			"seo_title":       t.SEOTitle,
			"seo_description": t.SEODescription,
			"theme":           t.Theme,
		},
	})
}
