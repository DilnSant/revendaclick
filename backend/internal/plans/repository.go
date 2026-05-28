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
		SELECT id, name, display_name, COALESCE(tagline,''), max_vehicles, max_users, max_leads,
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
			&p.ID, &p.Name, &p.DisplayName, &p.Tagline,
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
	var featuresJSON []byte

	// Join with plans.features so the usage response includes feature flags
	err := r.pool.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM vehicles  v WHERE v.tenant_id = $1 AND v.status != 'inactive'),
			(SELECT COUNT(*) FROM users     u WHERE u.tenant_id = $1 AND u.is_active = TRUE),
			(SELECT COUNT(*) FROM leads     l WHERE l.tenant_id = $1),
			pl.max_vehicles,
			pl.max_users,
			pl.max_leads,
			CASE WHEN pl.max_vehicles = -1 THEN 0::numeric
			     ELSE ROUND(
			         (SELECT COUNT(*) FROM vehicles v WHERE v.tenant_id = $1 AND v.status != 'inactive')::numeric
			         / NULLIF(pl.max_vehicles, 0) * 100, 1)
			END,
			CASE WHEN pl.max_users = -1 THEN 0::numeric
			     ELSE ROUND(
			         (SELECT COUNT(*) FROM users u WHERE u.tenant_id = $1 AND u.is_active = TRUE)::numeric
			         / NULLIF(pl.max_users, 0) * 100, 1)
			END,
			pl.name::text,
			pl.display_name,
			s.status::text,
			pl.features
		FROM subscriptions s
		JOIN plans pl ON pl.id = s.plan_id
		WHERE s.tenant_id = $1`, tenantID,
	).Scan(
		&u.VehiclesCount, &u.UsersCount, &u.LeadsCount,
		&u.MaxVehicles, &u.MaxUsers, &u.MaxLeads,
		&u.VehiclesPct, &u.UsersPct,
		&u.PlanName, &u.PlanDisplay, &u.SubStatus,
		&featuresJSON,
	)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(featuresJSON, &u.Features)
	u.ComputeAlerts()
	u.ComputeFeatureFlags()
	return u, nil
}
