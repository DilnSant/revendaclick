package admin

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) ListTenants(ctx context.Context) ([]*TenantSummary, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT
		  t.id::text, t.slug, t.name, t.email, t.is_active, t.created_at,
		  COALESCE(s.status, 'none')            AS sub_status,
		  COALESCE(p.name, '')                  AS plan_name,
		  COALESCE(p.display_name, '')          AS plan_display,
		  s.trial_ends_at,
		  s.current_period_end,
		  (SELECT COUNT(*) FROM vehicles v WHERE v.tenant_id = t.id)::int,
		  (SELECT COUNT(*) FROM users u   WHERE u.tenant_id = t.id AND u.is_active = true)::int,
		  (SELECT COUNT(*) FROM leads l   WHERE l.tenant_id = t.id)::int
		FROM tenants t
		LEFT JOIN subscriptions s ON s.tenant_id = t.id
		LEFT JOIN plans p         ON p.id = s.plan_id
		ORDER BY t.created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*TenantSummary
	for rows.Next() {
		ts := &TenantSummary{}
		if err := rows.Scan(
			&ts.ID, &ts.Slug, &ts.Name, &ts.Email, &ts.IsActive, &ts.CreatedAt,
			&ts.SubStatus, &ts.PlanName, &ts.PlanDisplay,
			&ts.TrialEndsAt, &ts.PeriodEnd,
			&ts.VehicleCount, &ts.UserCount, &ts.LeadCount,
		); err != nil {
			return nil, err
		}
		list = append(list, ts)
	}
	return list, rows.Err()
}

func (r *Repository) GetPlanByName(ctx context.Context, name string) (id string, err error) {
	err = r.pool.QueryRow(ctx,
		`SELECT id::text FROM plans WHERE name = $1`, name,
	).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", fmt.Errorf("plan not found: %s", name)
	}
	return id, err
}

func (r *Repository) ActivateTenant(ctx context.Context, tenantID, planID string) error {
	result, err := r.pool.Exec(ctx, `
		UPDATE subscriptions SET
			plan_id               = $2,
			status                = 'active',
			asaas_subscription_id = COALESCE(NULLIF(asaas_subscription_id,''), 'admin_activated_'||$1::text),
			current_period_start  = NOW(),
			current_period_end    = NOW() + INTERVAL '30 days',
			trial_ends_at         = NULL,
			grace_until           = NULL,
			canceled_at           = NULL
		WHERE tenant_id = $1`,
		tenantID, planID,
	)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return errors.New("subscription not found")
	}
	return nil
}

func (r *Repository) ExtendTrial(ctx context.Context, tenantID string, days int) error {
	result, err := r.pool.Exec(ctx, `
		UPDATE subscriptions SET
			status                = 'trialing',
			trial_ends_at         = GREATEST(COALESCE(trial_ends_at, NOW()), NOW()) + ($2 * INTERVAL '1 day'),
			current_period_end    = GREATEST(COALESCE(current_period_end, NOW()), NOW()) + ($2 * INTERVAL '1 day'),
			canceled_at           = NULL
		WHERE tenant_id = $1`,
		tenantID, days,
	)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return errors.New("subscription not found")
	}
	return nil
}

func (r *Repository) BlockTenant(ctx context.Context, tenantID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE tenants SET is_active = false WHERE id = $1`, tenantID)
	return err
}

func (r *Repository) UnblockTenant(ctx context.Context, tenantID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE tenants SET is_active = true WHERE id = $1`, tenantID)
	return err
}

func (r *Repository) GrantFeature(ctx context.Context, tenantID, feature, note string, expiresAt *time.Time) (*TenantFeatureGrant, error) {
	g := &TenantFeatureGrant{}
	err := r.pool.QueryRow(ctx, `
		INSERT INTO tenant_features (tenant_id, feature, enabled, note, expires_at)
		VALUES ($1, $2, true, $3, $4)
		ON CONFLICT (tenant_id, feature)
		DO UPDATE SET enabled = true, note = EXCLUDED.note, expires_at = EXCLUDED.expires_at, updated_at = NOW()
		RETURNING id::text, tenant_id::text, feature, enabled, expires_at, note, created_at`,
		tenantID, feature, note, expiresAt,
	).Scan(&g.ID, &g.TenantID, &g.Feature, &g.Enabled, &g.ExpiresAt, &g.Note, &g.CreatedAt)
	return g, err
}

func (r *Repository) RevokeFeature(ctx context.Context, tenantID, feature string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE tenant_features SET enabled = false, updated_at = NOW()
		 WHERE tenant_id = $1 AND feature = $2`,
		tenantID, feature,
	)
	return err
}

func (r *Repository) ListGrantedFeatures(ctx context.Context, tenantID string) ([]*TenantFeatureGrant, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id::text, tenant_id::text, feature, enabled, expires_at, COALESCE(note,''), created_at
		FROM tenant_features
		WHERE tenant_id = $1
		ORDER BY feature`, tenantID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*TenantFeatureGrant
	for rows.Next() {
		g := &TenantFeatureGrant{}
		if err := rows.Scan(&g.ID, &g.TenantID, &g.Feature, &g.Enabled, &g.ExpiresAt, &g.Note, &g.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, g)
	}
	return list, rows.Err()
}
