package analytics

type Summary struct {
	// Follow-ups
	OverdueFollowUps int `json:"overdue_follow_ups"`
	DueTodayFollowUps int `json:"due_today_follow_ups"`

	// Lead funnel
	TotalLeads      int     `json:"total_leads"`
	NewLeads        int     `json:"new_leads"`
	InProgressLeads int     `json:"in_progress_leads"`
	ProposalLeads   int     `json:"proposal_leads"`
	WonLeads        int     `json:"won_leads"`
	LostLeads       int     `json:"lost_leads"`
	ConversionRate  float64 `json:"conversion_rate"`

	// Leads by source
	LeadsBySource []SourceCount `json:"leads_by_source"`

	// Vehicle stock
	TotalVehicles     int `json:"total_vehicles"`
	AvailableVehicles int `json:"available_vehicles"`
	ReservedVehicles  int `json:"reserved_vehicles"`
	SoldVehicles      int `json:"sold_vehicles"`
	InactiveVehicles  int `json:"inactive_vehicles"`

	// Financial (current month)
	MonthRevenue  float64 `json:"month_revenue"`
	MonthSales    int     `json:"month_sales"`
	AvgSaleValue  float64 `json:"avg_sale_value"`

	// Revenue last 6 months
	RevenueHistory []MonthRevenue `json:"revenue_history"`
}

type SourceCount struct {
	Source string `json:"source"`
	Count  int    `json:"count"`
}

type MonthRevenue struct {
	Month   string  `json:"month"`
	Revenue float64 `json:"revenue"`
	Sales   int     `json:"sales"`
}
