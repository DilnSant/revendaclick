package plans

import "time"

type Plan struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	DisplayName  string    `json:"display_name"`
	MaxVehicles  int       `json:"max_vehicles"`
	MaxUsers     int       `json:"max_users"`
	MaxLeads     int       `json:"max_leads"`
	PriceMonthly float64   `json:"price_monthly"`
	PriceYearly  float64   `json:"price_yearly"`
	Features     []string  `json:"features"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
}

type Usage struct {
	VehiclesCount int     `json:"vehicles_count"`
	UsersCount    int     `json:"users_count"`
	LeadsCount    int     `json:"leads_count"`
	MaxVehicles   int     `json:"max_vehicles"`
	MaxUsers      int     `json:"max_users"`
	MaxLeads      int     `json:"max_leads"`
	VehiclesPct   float64 `json:"vehicles_pct"`
	UsersPct      float64 `json:"users_pct"`
	PlanName      string  `json:"plan_name"`
	PlanDisplay   string  `json:"plan_display"`
	SubStatus     string  `json:"subscription_status"`

	// Alert thresholds (computed)
	VehiclesAlert string `json:"vehicles_alert"` // "ok", "warning", "critical", "blocked"
	UsersAlert    string `json:"users_alert"`
}

func (u *Usage) ComputeAlerts() {
	u.VehiclesAlert = alertLevel(u.VehiclesPct, u.MaxVehicles)
	u.UsersAlert = alertLevel(u.UsersPct, u.MaxUsers)
}

func alertLevel(pct float64, max int) string {
	if max == -1 {
		return "ok"
	}
	switch {
	case pct >= 100:
		return "blocked"
	case pct >= 85:
		return "critical"
	case pct >= 80:
		return "warning"
	default:
		return "ok"
	}
}
