package audit

import "time"

type Log struct {
	ID         string            `json:"id"`
	TenantID   string            `json:"tenant_id"`
	UserID     *string           `json:"user_id,omitempty"`
	Action     string            `json:"action"`
	EntityType string            `json:"entity_type"`
	EntityID   *string           `json:"entity_id,omitempty"`
	OldData    map[string]any    `json:"old_data,omitempty"`
	NewData    map[string]any    `json:"new_data,omitempty"`
	CreatedAt  time.Time         `json:"created_at"`
}

type WriteRequest struct {
	UserID     string
	Action     string
	EntityType string
	EntityID   string
	OldData    map[string]any
	NewData    map[string]any
	IPAddress  string
}
