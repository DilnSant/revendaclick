package leads

import (
	"errors"
	"time"
)

var (
	ErrNotFound  = errors.New("lead not found")
	ErrForbidden = errors.New("forbidden")
)

type Lead struct {
	ID             string     `json:"id"`
	TenantID       string     `json:"tenant_id"`
	VehicleID      *string    `json:"vehicle_id,omitempty"`
	SellerID       *string    `json:"seller_id,omitempty"`
	Name           string     `json:"name"`
	Phone          string     `json:"phone"`
	Email          *string    `json:"email,omitempty"`
	Message        *string    `json:"message,omitempty"`
	Status         string     `json:"status"`
	Source         string     `json:"source"`
	Notes          *string    `json:"notes,omitempty"`
	UTMSource      *string    `json:"utm_source,omitempty"`
	UTMMedium      *string    `json:"utm_medium,omitempty"`
	UTMCampaign    *string    `json:"utm_campaign,omitempty"`
	KanbanPosition int        `json:"kanban_position"`
	ContactedAt    *time.Time `json:"contacted_at,omitempty"`
	ClosedAt       *time.Time `json:"closed_at,omitempty"`
	FollowUpAt     *time.Time `json:"follow_up_at,omitempty"`
	FollowUpNote   *string    `json:"follow_up_note,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type Activity struct {
	ID          string    `json:"id"`
	TenantID    string    `json:"tenant_id"`
	LeadID      string    `json:"lead_id"`
	UserID      *string   `json:"user_id,omitempty"`
	Type        string    `json:"type"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateRequest struct {
	VehicleID   *string `json:"vehicle_id"`
	SellerID    *string `json:"seller_id"`
	Name        string  `json:"name"`
	Phone       string  `json:"phone"`
	Email       *string `json:"email"`
	Message     *string `json:"message"`
	Source      string  `json:"source"`
	UTMSource   *string `json:"utm_source"`
	UTMMedium   *string `json:"utm_medium"`
	UTMCampaign *string `json:"utm_campaign"`
}

type UpdateRequest struct {
	SellerID       *string    `json:"seller_id"`
	Status         *string    `json:"status"`
	Notes          *string    `json:"notes"`
	KanbanPosition *int       `json:"kanban_position"`
	FollowUpAt     *time.Time `json:"follow_up_at"`
	FollowUpNote   *string    `json:"follow_up_note"`
}

type AddActivityRequest struct {
	Type        string `json:"type"`
	Description string `json:"description"`
}

type ListFilter struct {
	Status   string
	SellerID string
	Limit    int
	Offset   int
}

var validLeadSources = map[string]bool{
	"marketplace": true,
	"whatsapp":    true,
	"referral":    true,
	"direct":      true,
	"social":      true,
	"other":       true,
}

func (r *CreateRequest) Validate() error {
	switch {
	case r.Name == "":
		return validationErr("name is required")
	case len(r.Name) > 120:
		return validationErr("name too long")
	case r.Phone == "":
		return validationErr("phone is required")
	case len(r.Phone) > 30:
		return validationErr("phone too long")
	case r.Message != nil && len(*r.Message) > 2000:
		return validationErr("message too long")
	case r.Email != nil && len(*r.Email) > 254:
		return validationErr("email too long")
	case r.Source != "" && !validLeadSources[r.Source]:
		return validationErr("source inválido: use marketplace, whatsapp, referral, direct, social ou other")
	}
	return nil
}

type validationErr string

func (e validationErr) Error() string { return string(e) }
