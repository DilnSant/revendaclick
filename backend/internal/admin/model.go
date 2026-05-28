package admin

import "time"

type TenantSummary struct {
	ID           string     `json:"id"`
	Slug         string     `json:"slug"`
	Name         string     `json:"name"`
	Email        string     `json:"email"`
	IsActive     bool       `json:"is_active"`
	CreatedAt    time.Time  `json:"created_at"`
	// Subscription
	SubStatus    string     `json:"sub_status"`
	PlanName     string     `json:"plan_name"`
	PlanDisplay  string     `json:"plan_display"`
	TrialEndsAt  *time.Time `json:"trial_ends_at,omitempty"`
	PeriodEnd    *time.Time `json:"period_end,omitempty"`
	// Usage
	VehicleCount int        `json:"vehicle_count"`
	UserCount    int        `json:"user_count"`
	LeadCount    int        `json:"lead_count"`
}

type TenantFeatureGrant struct {
	ID        string     `json:"id"`
	TenantID  string     `json:"tenant_id"`
	Feature   string     `json:"feature"`
	Enabled   bool       `json:"enabled"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
	Note      string     `json:"note,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

type ActivateRequest struct {
	PlanName string `json:"plan_name"`
}

type ExtendTrialRequest struct {
	Days int `json:"days"`
}

type GrantFeatureRequest struct {
	Feature   string     `json:"feature"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
	Note      string     `json:"note,omitempty"`
}
