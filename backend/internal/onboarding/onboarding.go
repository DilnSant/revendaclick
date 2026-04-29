package onboarding

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

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
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantIDFromCtx(r.Context())

	c := &Checklist{}
	err := h.pool.QueryRow(r.Context(), `
		SELECT tenant_id, added_vehicle, configured_whatsapp,
		       published_store, added_seller, completed_at, updated_at
		FROM onboarding_checklists WHERE tenant_id = $1`, tenantID,
	).Scan(&c.TenantID, &c.AddedVehicle, &c.ConfiguredWhatsApp,
		&c.PublishedStore, &c.AddedSeller, &c.CompletedAt, &c.UpdatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(w)
		return
	}
	if err != nil {
		response.InternalError(w)
		return
	}
	response.JSON(w, http.StatusOK, c)
}

// PUT /api/onboarding
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantIDFromCtx(r.Context())

	var req UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	c := &Checklist{}
	err := h.pool.QueryRow(r.Context(), `
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
	).Scan(&c.TenantID, &c.AddedVehicle, &c.ConfiguredWhatsApp,
		&c.PublishedStore, &c.AddedSeller, &c.CompletedAt, &c.UpdatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(w)
		return
	}
	if err != nil {
		response.InternalError(w)
		return
	}
	response.JSON(w, http.StatusOK, c)
}
