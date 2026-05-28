package storecontact

import "time"

type StoreContact struct {
	ID             string    `json:"id"`
	TenantID       string    `json:"tenant_id"`
	PublicWhatsApp *string   `json:"public_whatsapp,omitempty"`
	PublicPhone    *string   `json:"public_phone,omitempty"`
	PublicEmail    *string   `json:"public_email,omitempty"`
	Instagram      *string   `json:"instagram,omitempty"`
	GroupsLink     *string   `json:"groups_link,omitempty"`
	Location       *string   `json:"location,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type UpsertRequest struct {
	PublicWhatsApp *string `json:"public_whatsapp"`
	PublicPhone    *string `json:"public_phone"`
	PublicEmail    *string `json:"public_email"`
	Instagram      *string `json:"instagram"`
	GroupsLink     *string `json:"groups_link"`
	Location       *string `json:"location"`
}
