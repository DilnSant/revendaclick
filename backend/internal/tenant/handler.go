package tenant

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"revendaclick/backend/internal/middleware"
	"revendaclick/backend/internal/response"
	"revendaclick/backend/internal/storecontact"
)

type Handler struct {
	svc        *Service
	contactSvc *storecontact.Service
}

func NewHandler(svc *Service, contactSvc *storecontact.Service) *Handler {
	return &Handler{svc: svc, contactSvc: contactSvc}
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

	// Busca contato público — sem erro se não cadastrado (nil é aceitável)
	var contact *storecontact.StoreContact
	if h.contactSvc != nil {
		contact, _ = h.contactSvc.Get(c.Request.Context(), t.ID)
	}

	// Monta resposta pública sem campos sensíveis
	publicData := gin.H{
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
	}

	if contact != nil {
		publicData["public_contact"] = gin.H{
			"public_whatsapp": contact.PublicWhatsApp,
			"public_phone":    contact.PublicPhone,
			"public_email":    contact.PublicEmail,
			"instagram":       contact.Instagram,
			"groups_link":     contact.GroupsLink,
			"location":        contact.Location,
		}
	} else {
		publicData["public_contact"] = nil
	}

	c.JSON(http.StatusOK, gin.H{"data": publicData})
}
