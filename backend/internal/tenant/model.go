package tenant

import (
	"encoding/json"
	"time"
)

type Tenant struct {
	ID            string          `json:"id"`
	Slug          string          `json:"slug"`
	Name          string          `json:"name"`
	Email         string          `json:"email"`
	PhoneWhatsApp string          `json:"phone_whatsapp"`
	LogoURL       *string         `json:"logo_url,omitempty"`
	Description   *string         `json:"description,omitempty"`
	Address       json.RawMessage `json:"address,omitempty"`
	SocialLinks   json.RawMessage `json:"social_links,omitempty"`
	CustomDomain  *string         `json:"custom_domain,omitempty"`
	SEOTitle      *string         `json:"seo_title,omitempty"`
	SEODescription *string        `json:"seo_description,omitempty"`
	Theme         json.RawMessage `json:"theme,omitempty"`
	IsActive      bool            `json:"is_active"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
}

type UpdateRequest struct {
	Name          *string          `json:"name"`
	PhoneWhatsApp *string          `json:"phone_whatsapp"`
	LogoURL       *string          `json:"logo_url"`
	Description   *string          `json:"description"`
	Address       *json.RawMessage `json:"address"`
	SocialLinks   *json.RawMessage `json:"social_links"`
	CustomDomain  *string          `json:"custom_domain"`
	SEOTitle      *string          `json:"seo_title"`
	SEODescription *string         `json:"seo_description"`
	Theme         *json.RawMessage `json:"theme"`
}

type CreateRequest struct {
	Slug          string `json:"slug"`
	Name          string `json:"name"`
	Email         string `json:"email"`
	PhoneWhatsApp string `json:"phone_whatsapp"`
}

func (r *CreateRequest) Validate() error {
	switch {
	case r.Slug == "":
		return ErrValidation("slug is required")
	case r.Name == "":
		return ErrValidation("name is required")
	case r.Email == "":
		return ErrValidation("email is required")
	case r.PhoneWhatsApp == "":
		return ErrValidation("phone_whatsapp is required")
	}
	return nil
}

type ErrValidation string

func (e ErrValidation) Error() string { return string(e) }
