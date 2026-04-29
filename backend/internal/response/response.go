package response

import (
	"encoding/json"
	"net/http"
)

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

func JSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(Envelope{Data: data})
}

func JSONWithMeta(w http.ResponseWriter, status int, data any, meta *Meta) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(Envelope{Data: data, Meta: meta})
}

func Err(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(Envelope{Error: &Error{Code: code, Message: message}})
}

func ErrUpgrade(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnprocessableEntity)
	_ = json.NewEncoder(w).Encode(Envelope{
		Error: &Error{
			Code:            "plan_limit_reached",
			Message:         message,
			UpgradeRequired: true,
		},
	})
}

func NoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

func NotFound(w http.ResponseWriter) {
	Err(w, http.StatusNotFound, "not_found", "Resource not found")
}

func Forbidden(w http.ResponseWriter) {
	Err(w, http.StatusForbidden, "forbidden", "Insufficient permissions")
}

func Unauthorized(w http.ResponseWriter) {
	Err(w, http.StatusUnauthorized, "unauthorized", "Authentication required")
}

func InternalError(w http.ResponseWriter) {
	Err(w, http.StatusInternalServerError, "internal_error", "An unexpected error occurred")
}

func BadRequest(w http.ResponseWriter, message string) {
	Err(w, http.StatusBadRequest, "bad_request", message)
}
