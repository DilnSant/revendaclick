package plans

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) ListPlans(ctx context.Context) ([]*Plan, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, display_name, max_vehicles, max_users, max_leads,
		       price_monthly, price_yearly, features, is_active, created_at
		FROM plans WHERE is_active = TRUE ORDER BY price_monthly ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*Plan
	for rows.Next() {
		p := &Plan{}
		var featuresJSON []byte
		if err := rows.Scan(
			&p.ID, &p.Name, &p.DisplayName,
			&p.MaxVehicles, &p.MaxUsers, &p.MaxLeads,
			&p.PriceMonthly, &p.PriceYearly,
			&featuresJSON, &p.IsActive, &p.CreatedAt,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(featuresJSON, &p.Features)
		list = append(list, p)
	}
	return list, rows.Err()
}

func (r *Repository) GetUsage(ctx context.Context, tenantID string) (*Usage, error) {
	u := &Usage{}
	err := r.pool.QueryRow(ctx,
		`SELECT vehicles_count, users_count, leads_count,
		        max_vehicles, max_users, max_leads,
		        vehicles_pct, users_pct,
		        plan_name, plan_display, sub_status
		 FROM get_tenant_usage($1)`, tenantID,
	).Scan(
		&u.VehiclesCount, &u.UsersCount, &u.LeadsCount,
		&u.MaxVehicles, &u.MaxUsers, &u.MaxLeads,
		&u.VehiclesPct, &u.UsersPct,
		&u.PlanName, &u.PlanDisplay, &u.SubStatus,
	)
	if err != nil {
		return nil, err
	}
	u.ComputeAlerts()
	return u, nil
}
