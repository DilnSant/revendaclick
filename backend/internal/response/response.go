package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ── Envelope ─────────────────────────────────────────────────────────────────

type Envelope struct {
	Data  any    `json:"data,omitempty"`
	Error *Error `json:"error,omitempty"`
	Meta  *Meta  `json:"meta,omitempty"`
}

type Error struct {
	Code            string `json:"code"`
	Message         string `json:"message"`
	UpgradeRequired bool   `json:"upgrade_required,omitempty"`
}

type Meta struct {
	Total  int `json:"total,omitempty"`
	Page   int `json:"page,omitempty"`
	Limit  int `json:"limit,omitempty"`
	Offset int `json:"offset,omitempty"`
}

// ── Response helpers ─────────────────────────────────────────────────────────

func JSON(c *gin.Context, status int, data any) {
	c.JSON(status, Envelope{Data: data})
}

func JSONWithMeta(c *gin.Context, status int, data any, meta *Meta) {
	c.JSON(status, Envelope{Data: data, Meta: meta})
}

func Err(c *gin.Context, status int, code, message string) {
	c.JSON(status, Envelope{Error: &Error{Code: code, Message: message}})
}

func ErrUpgrade(c *gin.Context, message string) {
	c.JSON(http.StatusUnprocessableEntity, Envelope{
		Error: &Error{
			Code:            "plan_limit_reached",
			Message:         message,
			UpgradeRequired: true,
		},
	})
}

func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

func NotFound(c *gin.Context) {
	Err(c, http.StatusNotFound, "not_found", "Resource not found")
}

func Forbidden(c *gin.Context) {
	Err(c, http.StatusForbidden, "forbidden", "Insufficient permissions")
}

func Unauthorized(c *gin.Context) {
	Err(c, http.StatusUnauthorized, "unauthorized", "Authentication required")
}

func InternalError(c *gin.Context) {
	Err(c, http.StatusInternalServerError, "internal_error", "An unexpected error occurred")
}

func BadRequest(c *gin.Context, message string) {
	Err(c, http.StatusBadRequest, "bad_request", message)
}
