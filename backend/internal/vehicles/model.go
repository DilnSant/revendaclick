package vehicles

import (
	"errors"
	"time"
)

var (
	ErrNotFound     = errors.New("vehicle not found")
	ErrLimitReached = errors.New("vehicle limit reached")
	ErrForbidden    = errors.New("forbidden")
)

type Vehicle struct {
	ID              string    `json:"id"`
	TenantID        string    `json:"tenant_id"`
	SellerID        *string   `json:"seller_id,omitempty"`
	Title           string    `json:"title"`
	Brand           string    `json:"brand"`
	Model           string    `json:"model"`
	Version         *string   `json:"version,omitempty"`
	YearModel       int       `json:"year_model"`
	YearManufacture int       `json:"year_manufacture"`
	Color           *string   `json:"color,omitempty"`
	Mileage         int       `json:"mileage"`
	Fuel            string    `json:"fuel"`
	Transmission    string    `json:"transmission"`
	Doors           *int      `json:"doors,omitempty"`
	Engine          *string   `json:"engine,omitempty"`
	Horsepower      *int      `json:"horsepower,omitempty"`
	Features        []string  `json:"features"`
	Price           float64   `json:"price"`
	PriceNegotiable bool      `json:"price_negotiable"`
	FipePrice       *float64  `json:"fipe_price,omitempty"`
	Status          string    `json:"status"`
	Condition       string    `json:"condition"`
	IsFeatured      bool      `json:"is_featured"`
	Images          []string  `json:"images"`
	ThumbnailURL    *string   `json:"thumbnail_url,omitempty"`
	VideoURL        *string   `json:"video_url,omitempty"`
	Slug            string    `json:"slug"`
	Description     *string   `json:"description,omitempty"`
	PlateLastDigits *string   `json:"plate_last_digits,omitempty"`
	ViewsCount      int       `json:"views_count"`
	LeadsCount      int       `json:"leads_count"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type CreateRequest struct {
	SellerID        *string  `json:"seller_id"`
	Title           string   `json:"title"`
	Brand           string   `json:"brand"`
	Model           string   `json:"model"`
	Version         *string  `json:"version"`
	YearModel       int      `json:"year_model"`
	YearManufacture int      `json:"year_manufacture"`
	Color           *string  `json:"color"`
	Mileage         int      `json:"mileage"`
	Fuel            string   `json:"fuel"`
	Transmission    string   `json:"transmission"`
	Doors           *int     `json:"doors"`
	Engine          *string  `json:"engine"`
	Horsepower      *int     `json:"horsepower"`
	Features        []string `json:"features"`
	Price           float64  `json:"price"`
	PriceNegotiable bool     `json:"price_negotiable"`
	FipePrice       *float64 `json:"fipe_price"`
	Condition       string   `json:"condition"`
	Images          []string `json:"images"`
	ThumbnailURL    *string  `json:"thumbnail_url"`
	VideoURL        *string  `json:"video_url"`
	Slug            string   `json:"slug"`
	Description     *string  `json:"description"`
	PlateLastDigits *string  `json:"plate_last_digits"`
}

type UpdateRequest struct {
	SellerID        *string  `json:"seller_id"`
	Title           *string  `json:"title"`
	Brand           *string  `json:"brand"`
	Model           *string  `json:"model"`
	Version         *string  `json:"version"`
	YearModel       *int     `json:"year_model"`
	YearManufacture *int     `json:"year_manufacture"`
	Color           *string  `json:"color"`
	Mileage         *int     `json:"mileage"`
	Fuel            *string  `json:"fuel"`
	Transmission    *string  `json:"transmission"`
	Doors           *int     `json:"doors"`
	Engine          *string  `json:"engine"`
	Horsepower      *int     `json:"horsepower"`
	Features        []string `json:"features"`
	Price           *float64 `json:"price"`
	PriceNegotiable *bool    `json:"price_negotiable"`
	FipePrice       *float64 `json:"fipe_price"`
	Status          *string  `json:"status"`
	IsFeatured      *bool    `json:"is_featured"`
	Images          []string `json:"images"`
	ThumbnailURL    *string  `json:"thumbnail_url"`
	VideoURL        *string  `json:"video_url"`
	Description     *string  `json:"description"`
}

type ListFilter struct {
	Status    string
	Brand     string
	MinPrice  *float64
	MaxPrice  *float64
	Condition string
	Limit     int
	Offset    int
}

func (r *CreateRequest) Validate() error {
	switch {
	case r.Title == "":
		return validationErr("title is required")
	case r.Brand == "":
		return validationErr("brand is required")
	case r.Model == "":
		return validationErr("model is required")
	case r.YearModel < 1950:
		return validationErr("year_model is invalid")
	case r.Price <= 0:
		return validationErr("price must be positive")
	case r.Slug == "":
		return validationErr("slug is required")
	case r.Fuel == "":
		return validationErr("fuel is required")
	case r.Transmission == "":
		return validationErr("transmission is required")
	}
	return nil
}

type validationErr string

func (e validationErr) Error() string { return string(e) }
