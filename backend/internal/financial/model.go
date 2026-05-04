package financial

import (
	"errors"
	"time"
)

var (
	ErrNotFound  = errors.New("financial entry not found")
	ErrForbidden = errors.New("forbidden")
)

type Entry struct {
	ID            string     `json:"id"`
	TenantID      string     `json:"tenant_id"`
	Type          string     `json:"type"`
	Category      string     `json:"category"`
	Description   string     `json:"description"`
	Amount        float64    `json:"amount"`
	PaymentMethod string     `json:"payment_method"`
	Status        string     `json:"status"`
	DueDate       *string    `json:"due_date,omitempty"`
	PaidAt        *time.Time `json:"paid_at,omitempty"`
	ReferenceID   *string    `json:"reference_id,omitempty"`
	ReferenceType *string    `json:"reference_type,omitempty"`
	Notes         *string    `json:"notes,omitempty"`
	CreatedBy     *string    `json:"created_by,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type Sale struct {
	ID              string     `json:"id"`
	TenantID        string     `json:"tenant_id"`
	VehicleID       string     `json:"vehicle_id"`
	LeadID          *string    `json:"lead_id,omitempty"`
	SellerID        *string    `json:"seller_id,omitempty"`
	CustomerID      *string    `json:"customer_id,omitempty"`
	SalePrice       float64    `json:"sale_price"`
	ListPrice       float64    `json:"list_price"`
	Discount        float64    `json:"discount"`
	FinancingType   string     `json:"financing_type"`
	FinancingAmount *float64   `json:"financing_amount,omitempty"`
	PaymentMethod   string     `json:"payment_method"`
	Status          string     `json:"status"`
	SoldAt          *time.Time `json:"sold_at,omitempty"`
	Notes           *string    `json:"notes,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type Commission struct {
	ID         string     `json:"id"`
	TenantID   string     `json:"tenant_id"`
	SaleID     string     `json:"sale_id"`
	SellerID   string     `json:"seller_id"`
	Type       string     `json:"type"`
	Rate       *float64   `json:"rate,omitempty"`
	Amount     float64    `json:"amount"`
	Status     string     `json:"status"`
	PaidAt     *time.Time `json:"paid_at,omitempty"`
	Notes      *string    `json:"notes,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

type CashFlowMonth struct {
	Month        string  `json:"month"`
	TotalIncome  float64 `json:"total_income"`
	TotalExpense float64 `json:"total_expense"`
	NetBalance   float64 `json:"net_balance"`
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

type CreateEntryRequest struct {
	Type          string   `json:"type"`
	Category      string   `json:"category"`
	Description   string   `json:"description"`
	Amount        float64  `json:"amount"`
	PaymentMethod string   `json:"payment_method"`
	Status        string   `json:"status"`
	DueDate       *string  `json:"due_date"`
	Notes         *string  `json:"notes"`
}

type CreateSaleRequest struct {
	VehicleID       string   `json:"vehicle_id"`
	LeadID          *string  `json:"lead_id"`
	SellerID        *string  `json:"seller_id"`
	CustomerID      *string  `json:"customer_id"`
	SalePrice       float64  `json:"sale_price"`
	ListPrice       float64  `json:"list_price"`
	Discount        float64  `json:"discount"`
	FinancingType   string   `json:"financing_type"`
	FinancingAmount *float64 `json:"financing_amount"`
	PaymentMethod   string   `json:"payment_method"`
	Notes           *string  `json:"notes"`
}

type UpdateSaleRequest struct {
	Status        *string  `json:"status"`
	SalePrice     *float64 `json:"sale_price"`
	PaymentMethod *string  `json:"payment_method"`
	Notes         *string  `json:"notes"`
}

type ListEntryFilter struct {
	Type   string
	Status string
	Limit  int
	Offset int
}

type ListSaleFilter struct {
	SellerID string
	Status   string
	Limit    int
	Offset   int
}

func (r *CreateEntryRequest) Validate() error {
	if r.Type == "" {
		return validationErr("type is required")
	}
	if r.Description == "" {
		return validationErr("description is required")
	}
	if r.Amount <= 0 {
		return validationErr("amount must be greater than zero")
	}
	return nil
}

func (r *CreateSaleRequest) Validate() error {
	if r.VehicleID == "" {
		return validationErr("vehicle_id is required")
	}
	if r.SalePrice <= 0 {
		return validationErr("sale_price must be greater than zero")
	}
	if r.ListPrice <= 0 {
		return validationErr("list_price must be greater than zero")
	}
	return nil
}

type validationErr string

func (e validationErr) Error() string { return string(e) }
