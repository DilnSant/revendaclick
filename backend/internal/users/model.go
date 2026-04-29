package users

import (
	"errors"
	"time"
)

var (
	ErrNotFound     = errors.New("user not found")
	ErrLimitReached = errors.New("user limit reached")
	ErrForbidden    = errors.New("forbidden")
)

type User struct {
	ID         string     `json:"id"`
	TenantID   string     `json:"tenant_id"`
	Role       string     `json:"role"`
	Name       string     `json:"name"`
	Email      string     `json:"email"`
	Phone      *string    `json:"phone,omitempty"`
	AvatarURL  *string    `json:"avatar_url,omitempty"`
	IsActive   bool       `json:"is_active"`
	LastSeenAt *time.Time `json:"last_seen_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

type Seller struct {
	ID            string    `json:"id"`
	TenantID      string    `json:"tenant_id"`
	UserID        string    `json:"user_id"`
	DisplayName   string    `json:"display_name"`
	PhoneWhatsApp string    `json:"phone_whatsapp"`
	Bio           *string   `json:"bio,omitempty"`
	PhotoURL      *string   `json:"photo_url,omitempty"`
	IsActive      bool      `json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type CreateRequest struct {
	ID    string `json:"id"` // Supabase auth user UUID
	Role  string `json:"role"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Phone *string `json:"phone"`
}

type UpdateRequest struct {
	Role      *string `json:"role"`
	Name      *string `json:"name"`
	Phone     *string `json:"phone"`
	AvatarURL *string `json:"avatar_url"`
	IsActive  *bool   `json:"is_active"`
}

func (r *CreateRequest) Validate() error {
	switch {
	case r.ID == "":
		return validationErr("id (auth user UUID) is required")
	case r.Name == "":
		return validationErr("name is required")
	case r.Email == "":
		return validationErr("email is required")
	}
	return nil
}

type validationErr string

func (e validationErr) Error() string { return string(e) }
