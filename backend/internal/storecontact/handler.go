package storecontact

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

// GET /api/store-contact — contato público do tenant autenticado
func (h *Handler) Get(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	sc, err := h.svc.Get(c.Request.Context(), tenantID)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			// Ainda não configurado — retorna objeto vazio (não é erro)
			response.JSON(c, http.StatusOK, &StoreContact{TenantID: tenantID})
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, sc)
}

// PUT /api/store-contact — salva/atualiza contato público (owner/admin)
func (h *Handler) Upsert(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	var req UpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	sc, err := h.svc.Upsert(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, sc)
}
