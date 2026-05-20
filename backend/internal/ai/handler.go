package ai

import (
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

type suggestReplyRequest struct {
	StoreName    string `json:"store_name" binding:"required"`
	VehicleTitle string `json:"vehicle_title"`
	LeadMessage  string `json:"lead_message" binding:"required"`
}

type classifyRequest struct {
	Name    string `json:"name" binding:"required"`
	Message string `json:"message" binding:"required"`
}

const (
	maxAIMessageLen = 2000 // ~500 tokens — prevents cost DoS via large inputs
	maxAINameLen    = 200
	maxAITitleLen   = 300
)

// POST /api/ai/suggest-reply
func (h *Handler) SuggestReply(c *gin.Context) {
	_ = middleware.TenantIDFromGin(c)

	var req suggestReplyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if len(req.LeadMessage) > maxAIMessageLen {
		response.BadRequest(c, "lead_message too long")
		return
	}
	if len(req.VehicleTitle) > maxAITitleLen {
		response.BadRequest(c, "vehicle_title too long")
		return
	}

	text, err := h.svc.SuggestReply(c.Request.Context(), req.StoreName, req.VehicleTitle, req.LeadMessage)
	if err != nil {
		response.InternalError(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{"suggestion": text})
}

// POST /api/ai/classify-lead
func (h *Handler) ClassifyLead(c *gin.Context) {
	_ = middleware.TenantIDFromGin(c)

	var req classifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if len(req.Message) > maxAIMessageLen {
		response.BadRequest(c, "message too long")
		return
	}
	if len(req.Name) > maxAINameLen {
		response.BadRequest(c, "name too long")
		return
	}

	label, err := h.svc.ClassifyLead(c.Request.Context(), req.Name, req.Message)
	if err != nil {
		response.InternalError(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{"classification": label})
}
