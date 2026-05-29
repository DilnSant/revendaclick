package plans

import "time"

type Plan struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	DisplayName  string    `json:"display_name"`
	Tagline      string    `json:"tagline"`
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
	VehiclesCount int      `json:"vehicles_count"`
	UsersCount    int      `json:"users_count"`
	LeadsCount    int      `json:"leads_count"`
	MaxVehicles   int      `json:"max_vehicles"`
	MaxUsers      int      `json:"max_users"`
	MaxLeads      int      `json:"max_leads"`
	VehiclesPct   float64  `json:"vehicles_pct"`
	UsersPct      float64  `json:"users_pct"`
	PlanName      string   `json:"plan_name"`
	PlanDisplay   string   `json:"plan_display"`
	SubStatus     string   `json:"subscription_status"`
	Features      []string `json:"features"`

	// Alert thresholds (computed)
	VehiclesAlert string `json:"vehicles_alert"` // "ok", "warning", "critical", "blocked"
	UsersAlert    string `json:"users_alert"`

	// Feature availability helpers (computed from Features list)
	HasCRM                 bool `json:"has_crm"`
	HasAnalytics           bool `json:"has_analytics"`
	HasWhatsApp            bool `json:"has_whatsapp"`
	HasKanban              bool `json:"has_kanban"`
	HasAPIAccess           bool `json:"has_api_access"`
	HasWhiteLabel          bool `json:"has_white_label"`
	HasCentralAtendimento  bool `json:"has_central_atendimento"`
	HasWhatsAppQR          bool `json:"has_whatsapp_qr"`
	HasFinancial           bool `json:"has_financial"`
	HasVendors             bool `json:"has_vendors"`
	HasAIAssistance        bool `json:"has_ai_assistance"`
	HasAutomation          bool `json:"has_automation"`
	HasCampaigns           bool `json:"has_campaigns"`
	HasLeadRecovery        bool `json:"has_lead_recovery"`
	HasMultiStore          bool `json:"has_multi_store"`
	HasExtraUser           bool `json:"has_extra_user"`
}

func (u *Usage) ComputeAlerts() {
	u.VehiclesAlert = alertLevel(u.VehiclesPct, u.MaxVehicles)
	u.UsersAlert    = alertLevel(u.UsersPct, u.MaxUsers)
}

func (u *Usage) ComputeFeatureFlags() {
	fm := make(map[string]bool, len(u.Features))
	for _, f := range u.Features {
		fm[f] = true
	}
	u.HasCRM                = fm["crm"]
	u.HasAnalytics          = fm["analytics"]
	u.HasWhatsApp           = fm["whatsapp_button"]
	u.HasKanban             = fm["kanban"]
	u.HasAPIAccess          = fm["api_access"]
	u.HasWhiteLabel         = fm["white_label"]
	u.HasCentralAtendimento = fm["central_atendimento"]
	u.HasWhatsAppQR         = fm["whatsapp_qr"]
	u.HasFinancial          = fm["financial"]
	u.HasVendors            = fm["vendors"]
	u.HasAIAssistance       = fm["ai_assistance"]
	u.HasAutomation         = fm["automation"]
	u.HasCampaigns          = fm["campaigns"]
	u.HasLeadRecovery       = fm["lead_recovery"]
	u.HasMultiStore         = fm["multi_store"]
	u.HasExtraUser          = fm["extra_user"]
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
