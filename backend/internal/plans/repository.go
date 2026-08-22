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

	err := r.pool.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM vehicles v WHERE v.tenant_id = $1 AND v.status != 'inactive'),
			(SELECT COUNT(*) FROM users    u WHERE u.tenant_id = $1 AND u.is_active = TRUE),
			(SELECT COUNT(*) FROM leads    l WHERE l.tenant_id = $1),
			pl.max_vehicles,
			-- max_users: base plan + user_extra add-on quantity
			CASE WHEN pl.max_users = -1 THEN -1
			     ELSE pl.max_users + COALESCE((
			         SELECT SUM(sa.quantity) FROM subscription_addons sa
			         WHERE sa.tenant_id = $1 AND sa.addon_type = 'user_extra' AND sa.status = 'active'
			     ), 0)
			END,
			pl.max_leads,
			CASE WHEN pl.max_vehicles = -1 THEN 0::numeric
			     ELSE ROUND(
			         (SELECT COUNT(*) FROM vehicles v WHERE v.tenant_id = $1 AND v.status != 'inactive')::numeric
			         / NULLIF(pl.max_vehicles, 0) * 100, 1)
			END,
			CASE WHEN pl.max_users = -1 THEN 0::numeric
			     ELSE ROUND(
			         (SELECT COUNT(*) FROM users u WHERE u.tenant_id = $1 AND u.is_active = TRUE)::numeric
			         / NULLIF(pl.max_users + COALESCE((
			             SELECT SUM(sa.quantity) FROM subscription_addons sa
			             WHERE sa.tenant_id = $1 AND sa.addon_type = 'user_extra' AND sa.status = 'active'
			         ), 0), 0) * 100, 1)
			END,
			pl.name::text,
			pl.display_name,
			s.status::text,
			-- Merge plan features + tenant_features overrides + active add-on features
			(
				SELECT COALESCE(jsonb_agg(DISTINCT f), '[]'::jsonb)
				FROM (
					SELECT jsonb_array_elements_text(pl.features) AS f
					UNION ALL
					SELECT tf.feature AS f
					FROM tenant_features tf
					WHERE tf.tenant_id = $1
					  AND tf.enabled = true
					  AND (tf.expires_at IS NULL OR tf.expires_at > NOW())
					UNION ALL
					SELECT jsonb_array_elements_text(pa.features) AS f
					FROM subscription_addons sa
					JOIN plan_addons pa ON pa.addon_type = sa.addon_type
					WHERE sa.tenant_id = $1
					  AND (
					    sa.status = 'active'
					    OR (sa.status = 'past_due'
					        AND (sa.grace_until IS NULL OR sa.grace_until > NOW()))
					  )
					  AND jsonb_array_length(pa.features) > 0
				) merged
			)
		FROM subscriptions s
		JOIN plans pl ON pl.id = s.plan_id
		WHERE s.tenant_id = $1
		ORDER BY s.updated_at DESC
		LIMIT 1`, tenantID,
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
