package admin

import "time"

// ── Tenants ───────────────────────────────────────────────────────────────────

type TenantSummary struct {
	ID           string     `json:"id"`
	Slug         string     `json:"slug"`
	Name         string     `json:"name"`
	Email        string     `json:"email"`
	IsActive     bool       `json:"is_active"`
	CreatedAt    time.Time  `json:"created_at"`
	SubStatus    string     `json:"sub_status"`
	PlanName     string     `json:"plan_name"`
	PlanDisplay  string     `json:"plan_display"`
	TrialEndsAt  *time.Time `json:"trial_ends_at,omitempty"`
	PeriodEnd    *time.Time `json:"period_end,omitempty"`
	VehicleCount int        `json:"vehicle_count"`
	UserCount    int        `json:"user_count"`
	LeadCount    int        `json:"lead_count"`
}

type UpdateTenantAdminRequest struct {
	Name  *string `json:"name,omitempty"`
	Email *string `json:"email,omitempty"`
	Slug  *string `json:"slug,omitempty"`
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

// ── Subscriptions ─────────────────────────────────────────────────────────────

type SubscriptionAdmin struct {
	ID                  string     `json:"id"`
	TenantID            string     `json:"tenant_id"`
	TenantSlug          string     `json:"tenant_slug"`
	TenantName          string     `json:"tenant_name"`
	PlanID              string     `json:"plan_id"`
	PlanName            string     `json:"plan_name"`
	PlanDisplay         string     `json:"plan_display"`
	Status              string     `json:"status"`
	BillingCycle        string     `json:"billing_cycle"`
	TrialEndsAt         *time.Time `json:"trial_ends_at,omitempty"`
	CurrentPeriodStart  *time.Time `json:"current_period_start,omitempty"`
	CurrentPeriodEnd    *time.Time `json:"current_period_end,omitempty"`
	GraceUntil          *time.Time `json:"grace_until,omitempty"`
	CanceledAt          *time.Time `json:"canceled_at,omitempty"`
	AsaasSubscriptionID string     `json:"asaas_subscription_id,omitempty"`
	CreatedAt           time.Time  `json:"created_at"`
}

type UpdateSubscriptionRequest struct {
	PlanName         *string    `json:"plan_name,omitempty"`
	Status           *string    `json:"status,omitempty"`
	TrialEndsAt      *time.Time `json:"trial_ends_at,omitempty"`
	CurrentPeriodEnd *time.Time `json:"current_period_end,omitempty"`
	GraceUntil       *time.Time `json:"grace_until,omitempty"`
	CanceledAt       *time.Time `json:"canceled_at,omitempty"`
	ClearTrialEnd    bool       `json:"clear_trial_end,omitempty"`
	ClearGraceUntil  bool       `json:"clear_grace_until,omitempty"`
	ClearCanceledAt  bool       `json:"clear_canceled_at,omitempty"`
}

// ── Users (admin global) ──────────────────────────────────────────────────────

type UserAdmin struct {
	ID         string     `json:"id"`
	TenantID   *string    `json:"tenant_id,omitempty"`
	TenantSlug *string    `json:"tenant_slug,omitempty"`
	TenantName *string    `json:"tenant_name,omitempty"`
	Role       string     `json:"role"`
	Name       string     `json:"name"`
	Email      string     `json:"email"`
	IsActive   bool       `json:"is_active"`
	LastSeenAt *time.Time `json:"last_seen_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

type UpdateUserAdminRequest struct {
	Name     *string `json:"name,omitempty"`
	Role     *string `json:"role,omitempty"`
	IsActive *bool   `json:"is_active,omitempty"`
}

// ── Plans (admin) ─────────────────────────────────────────────────────────────

type PlanAdmin struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	DisplayName  string   `json:"display_name"`
	Tagline      string   `json:"tagline"`
	MaxVehicles  int      `json:"max_vehicles"`
	MaxUsers     int      `json:"max_users"`
	MaxLeads     int      `json:"max_leads"`
	PriceMonthly float64  `json:"price_monthly"`
	PriceYearly  float64  `json:"price_yearly"`
	Features     []string `json:"features"`
	IsActive     bool     `json:"is_active"`
}

type UpdatePlanRequest struct {
	DisplayName  *string  `json:"display_name,omitempty"`
	Tagline      *string  `json:"tagline,omitempty"`
	MaxVehicles  *int     `json:"max_vehicles,omitempty"`
	MaxUsers     *int     `json:"max_users,omitempty"`
	MaxLeads     *int     `json:"max_leads,omitempty"`
	PriceMonthly *float64 `json:"price_monthly,omitempty"`
	PriceYearly  *float64 `json:"price_yearly,omitempty"`
	Features     []string `json:"features,omitempty"`
	IsActive     *bool    `json:"is_active,omitempty"`
}

// ── WhatsApp admin ────────────────────────────────────────────────────────────

type QRAdminResp struct {
	Base64 string `json:"base64,omitempty"`
	Code   string `json:"code,omitempty"`
	Count  int    `json:"count,omitempty"`
}
