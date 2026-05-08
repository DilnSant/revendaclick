package analytics

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) GetSummary(ctx context.Context, tenantID string) (*Summary, error) {
	s := &Summary{}

	// ── Follow-up counts ──────────────────────────────────────────────────────
	err := r.pool.QueryRow(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE follow_up_at < NOW()),
			COUNT(*) FILTER (WHERE follow_up_at::date = CURRENT_DATE)
		FROM leads
		WHERE tenant_id = $1
		  AND follow_up_at IS NOT NULL
		  AND status NOT IN ('closed_won','closed_lost')`,
		tenantID,
	).Scan(&s.OverdueFollowUps, &s.DueTodayFollowUps)
	if err != nil {
		return nil, err
	}

	// ── Lead funnel ────────────────────────────────────────────────────────────
	rows, err := r.pool.Query(ctx, `
		SELECT status, COUNT(*) FROM leads
		WHERE tenant_id = $1
		GROUP BY status`, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		s.TotalLeads += count
		switch status {
		case "new":
			s.NewLeads = count
		case "in_progress":
			s.InProgressLeads = count
		case "proposal":
			s.ProposalLeads = count
		case "closed_won":
			s.WonLeads = count
		case "closed_lost":
			s.LostLeads = count
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if s.TotalLeads > 0 {
		s.ConversionRate = float64(s.WonLeads) / float64(s.TotalLeads) * 100
	}

	// ── Leads by source ────────────────────────────────────────────────────────
	srcRows, err := r.pool.Query(ctx, `
		SELECT source, COUNT(*) FROM leads
		WHERE tenant_id = $1
		GROUP BY source ORDER BY 2 DESC`, tenantID)
	if err != nil {
		return nil, err
	}
	defer srcRows.Close()

	for srcRows.Next() {
		var sc SourceCount
		if err := srcRows.Scan(&sc.Source, &sc.Count); err != nil {
			return nil, err
		}
		s.LeadsBySource = append(s.LeadsBySource, sc)
	}
	if err := srcRows.Err(); err != nil {
		return nil, err
	}

	// ── Vehicle stock ──────────────────────────────────────────────────────────
	vRows, err := r.pool.Query(ctx, `
		SELECT status, COUNT(*) FROM vehicles
		WHERE tenant_id = $1
		GROUP BY status`, tenantID)
	if err != nil {
		return nil, err
	}
	defer vRows.Close()

	for vRows.Next() {
		var status string
		var count int
		if err := vRows.Scan(&status, &count); err != nil {
			return nil, err
		}
		s.TotalVehicles += count
		switch status {
		case "available":
			s.AvailableVehicles = count
		case "reserved":
			s.ReservedVehicles = count
		case "sold":
			s.SoldVehicles = count
		case "inactive":
			s.InactiveVehicles = count
		}
	}
	if err := vRows.Err(); err != nil {
		return nil, err
	}

	// ── Financial — current month ──────────────────────────────────────────────
	err = r.pool.QueryRow(ctx, `
		SELECT
			COALESCE(SUM(final_value), 0),
			COUNT(*)
		FROM sales
		WHERE tenant_id = $1
		  AND status = 'completed'
		  AND DATE_TRUNC('month', completed_at) = DATE_TRUNC('month', NOW())`,
		tenantID,
	).Scan(&s.MonthRevenue, &s.MonthSales)
	if err != nil {
		return nil, err
	}
	if s.MonthSales > 0 {
		s.AvgSaleValue = s.MonthRevenue / float64(s.MonthSales)
	}

	// ── Revenue history — last 6 months ───────────────────────────────────────
	hRows, err := r.pool.Query(ctx, `
		SELECT
			TO_CHAR(DATE_TRUNC('month', completed_at), 'YYYY-MM') AS month,
			COALESCE(SUM(final_value), 0),
			COUNT(*)
		FROM sales
		WHERE tenant_id = $1
		  AND status = 'completed'
		  AND completed_at >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
		GROUP BY 1 ORDER BY 1`, tenantID)
	if err != nil {
		return nil, err
	}
	defer hRows.Close()

	for hRows.Next() {
		var mr MonthRevenue
		if err := hRows.Scan(&mr.Month, &mr.Revenue, &mr.Sales); err != nil {
			return nil, err
		}
		s.RevenueHistory = append(s.RevenueHistory, mr)
	}
	if s.RevenueHistory == nil {
		s.RevenueHistory = []MonthRevenue{}
	}

	return s, hRows.Err()
}
