package customers

import (
	"errors"
	"time"
)

var ErrNotFound = errors.New("customer not found")

type Customer struct {
	ID           string    `json:"id"`
	TenantID     string    `json:"tenant_id"`
	Name         string    `json:"name"`
	Email        *string   `json:"email,omitempty"`
	Phone        *string   `json:"phone,omitempty"`
	CpfCnpj      *string   `json:"cpf_cnpj,omitempty"`
	AddressCity  *string   `json:"address_city,omitempty"`
	AddressState *string   `json:"address_state,omitempty"`
	Notes        *string   `json:"notes,omitempty"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateRequest struct {
	Name         string  `json:"name"`
	Email        *string `json:"email"`
	Phone        *string `json:"phone"`
	CpfCnpj      *string `json:"cpf_cnpj"`
	AddressCity  *string `json:"address_city"`
	AddressState *string `json:"address_state"`
	Notes        *string `json:"notes"`
}

type UpdateRequest struct {
	Name         *string `json:"name"`
	Email        *string `json:"email"`
	Phone        *string `json:"phone"`
	CpfCnpj      *string `json:"cpf_cnpj"`
	AddressCity  *string `json:"address_city"`
	AddressState *string `json:"address_state"`
	Notes        *string `json:"notes"`
	IsActive     *bool   `json:"is_active"`
}

type ListFilter struct {
	Search   string
	State    string
	IsActive *bool
	Limit    int
	Offset   int
}

func (r *CreateRequest) Validate() error {
	if r.Name == "" {
		return validationErr("name is required")
	}
	return nil
}

type validationErr string

func (e validationErr) Error() string { return string(e) }
