package onboarding

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"revendaclick/backend/internal/middleware"
	"revendaclick/backend/internal/response"
)

type Checklist struct {
	TenantID           string     `json:"tenant_id"`
	AddedVehicle       bool       `json:"added_vehicle"`
	ConfiguredWhatsApp bool       `json:"configured_whatsapp"`
	PublishedStore     bool       `json:"published_store"`
	AddedSeller        bool       `json:"added_seller"`
	CompletedAt        *time.Time `json:"completed_at,omitempty"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

type UpdateRequest struct {
	AddedVehicle       *bool `json:"added_vehicle"`
	ConfiguredWhatsApp *bool `json:"configured_whatsapp"`
	PublishedStore     *bool `json:"published_store"`
	AddedSeller        *bool `json:"added_seller"`
}

type Handler struct {
	pool *pgxpool.Pool
}

func NewHandler(pool *pgxpool.Pool) *Handler {
	return &Handler{pool: pool}
}

// GET /api/onboarding
func (h *Handler) Get(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	cl := &Checklist{}
	err := h.pool.QueryRow(c.Request.Context(), `
		SELECT tenant_id, added_vehicle, configured_whatsapp,
		       published_store, added_seller, completed_at, updated_at
		FROM onboarding_checklists WHERE tenant_id = $1`, tenantID,
	).Scan(&cl.TenantID, &cl.AddedVehicle, &cl.ConfiguredWhatsApp,
		&cl.PublishedStore, &cl.AddedSeller, &cl.CompletedAt, &cl.UpdatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(c)
		return
	}
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, cl)
}

// PUT /api/onboarding
func (h *Handler) Update(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	cl := &Checklist{}
	err := h.pool.QueryRow(c.Request.Context(), `
		UPDATE onboarding_checklists SET
			added_vehicle        = COALESCE($2, added_vehicle),
			configured_whatsapp  = COALESCE($3, configured_whatsapp),
			published_store      = COALESCE($4, published_store),
			added_seller         = COALESCE($5, added_seller),
			completed_at = CASE
				WHEN COALESCE($2, added_vehicle) AND COALESCE($3, configured_whatsapp)
				     AND COALESCE($4, published_store) AND COALESCE($5, added_seller)
				     AND completed_at IS NULL
				THEN NOW()
				ELSE completed_at
			END
		WHERE tenant_id = $1
		RETURNING tenant_id, added_vehicle, configured_whatsapp,
		          published_store, added_seller, completed_at, updated_at`,
		tenantID, req.AddedVehicle, req.ConfiguredWhatsApp,
		req.PublishedStore, req.AddedSeller,
	).Scan(&cl.TenantID, &cl.AddedVehicle, &cl.ConfiguredWhatsApp,
		&cl.PublishedStore, &cl.AddedSeller, &cl.CompletedAt, &cl.UpdatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(c)
		return
	}
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, cl)
}
