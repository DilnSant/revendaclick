package admin

import (
	"context"
	"encoding/json"
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
		  t.quarantined_at, COALESCE(t.quarantine_reason, ''),
		  COALESCE(s.status::text, 'none')  AS sub_status,
		  COALESCE(p.name, '')              AS plan_name,
		  COALESCE(p.display_name, '')      AS plan_display,
		  s.trial_ends_at,
		  s.current_period_end,
		  (SELECT COUNT(*) FROM vehicles v WHERE v.tenant_id = t.id)::int,
		  (SELECT COUNT(*) FROM users u   WHERE u.tenant_id = t.id AND u.is_active = true)::int,
		  (SELECT COUNT(*) FROM leads l   WHERE l.tenant_id = t.id)::int
		FROM tenants t
		LEFT JOIN subscriptions s ON s.tenant_id = t.id
		LEFT JOIN plans p         ON p.id = s.plan_id
		WHERE t.deleted_at IS NULL
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
			&ts.QuarantinedAt, &ts.QuarantineReason,
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

func (r *Repository) QuarantineTenant(ctx context.Context, tenantID, reason string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE tenants SET is_active = false, quarantined_at = NOW(), quarantine_reason = $2
		 WHERE id = $1 AND deleted_at IS NULL`,
		tenantID, reason)
	return err
}

func (r *Repository) UnquarantineTenant(ctx context.Context, tenantID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE tenants SET is_active = true, quarantined_at = NULL, quarantine_reason = NULL
		 WHERE id = $1`,
		tenantID)
	return err
}

func (r *Repository) SoftDeleteTenant(ctx context.Context, tenantID, reason string) error {
	result, err := r.pool.Exec(ctx,
		`UPDATE tenants SET deleted_at = NOW(), deleted_reason = $2, is_active = false
		 WHERE id = $1 AND deleted_at IS NULL`,
		tenantID, reason)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return errors.New("tenant not found or already deleted")
	}
	return nil
}

func (r *Repository) HardDeleteTenant(ctx context.Context, tenantID string) error {
	// All child FKs are ON DELETE CASCADE — single DELETE is sufficient.
	result, err := r.pool.Exec(ctx,
		`DELETE FROM tenants WHERE id = $1`, tenantID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return errors.New("tenant not found")
	}
	return nil
}

func (r *Repository) GetTenantDeleteSummary(ctx context.Context, tenantID string) (map[string]any, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT
		  t.name, t.slug, t.email,
		  COALESCE(p.display_name, 'Nenhum') AS plan_display,
		  COALESCE(s.status::text, 'none')   AS sub_status,
		  (SELECT COUNT(*) FROM users     u WHERE u.tenant_id = t.id)::int,
		  (SELECT COUNT(*) FROM vehicles  v WHERE v.tenant_id = t.id)::int,
		  (SELECT COUNT(*) FROM leads     l WHERE l.tenant_id = t.id)::int,
		  (SELECT COUNT(*) FROM customers c WHERE c.tenant_id = t.id)::int
		FROM tenants t
		LEFT JOIN subscriptions s ON s.tenant_id = t.id
		LEFT JOIN plans p ON p.id = s.plan_id
		WHERE t.id = $1`, tenantID)

	var name, slug, email, planDisplay, subStatus string
	var userCount, vehicleCount, leadCount, customerCount int
	if err := row.Scan(&name, &slug, &email, &planDisplay, &subStatus,
		&userCount, &vehicleCount, &leadCount, &customerCount); err != nil {
		return nil, err
	}
	return map[string]any{
		"name":           name,
		"slug":           slug,
		"email":          email,
		"plan_display":   planDisplay,
		"sub_status":     subStatus,
		"user_count":     userCount,
		"vehicle_count":  vehicleCount,
		"lead_count":     leadCount,
		"customer_count": customerCount,
	}, nil
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

// ── Tenant edit ────────────────────────────────────────────────────────────────

func (r *Repository) UpdateTenantAdmin(ctx context.Context, id string, req *UpdateTenantAdminRequest) error {
	if req.Name == nil && req.Email == nil && req.Slug == nil {
		return errors.New("nothing to update")
	}
	_, err := r.pool.Exec(ctx, `
		UPDATE tenants SET
			name  = COALESCE($2, name),
			email = COALESCE($3, email),
			slug  = COALESCE($4, slug),
			updated_at = NOW()
		WHERE id = $1`,
		id, req.Name, req.Email, req.Slug,
	)
	return err
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

func (r *Repository) ListSubscriptions(ctx context.Context) ([]*SubscriptionAdmin, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT
		  s.id::text, s.tenant_id::text, t.slug, t.name,
		  s.plan_id::text, p.name, COALESCE(p.display_name,''),
		  s.status::text, COALESCE(s.billing_cycle,'monthly'),
		  s.trial_ends_at, s.current_period_start, s.current_period_end,
		  s.grace_until, s.canceled_at,
		  COALESCE(s.asaas_subscription_id,''), s.created_at
		FROM subscriptions s
		JOIN tenants t ON t.id = s.tenant_id
		LEFT JOIN plans p ON p.id = s.plan_id
		ORDER BY s.created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*SubscriptionAdmin
	for rows.Next() {
		sub := &SubscriptionAdmin{}
		if err := rows.Scan(
			&sub.ID, &sub.TenantID, &sub.TenantSlug, &sub.TenantName,
			&sub.PlanID, &sub.PlanName, &sub.PlanDisplay,
			&sub.Status, &sub.BillingCycle,
			&sub.TrialEndsAt, &sub.CurrentPeriodStart, &sub.CurrentPeriodEnd,
			&sub.GraceUntil, &sub.CanceledAt,
			&sub.AsaasSubscriptionID, &sub.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, sub)
	}
	return list, rows.Err()
}

func (r *Repository) UpdateSubscription(ctx context.Context, tenantID string, req *UpdateSubscriptionRequest) error {
	var planID *string
	if req.PlanName != nil {
		id, err := r.GetPlanByName(ctx, *req.PlanName)
		if err != nil {
			return fmt.Errorf("plan not found: %s", *req.PlanName)
		}
		planID = &id
	}

	trialEnd := req.TrialEndsAt
	if req.ClearTrialEnd {
		trialEnd = nil
	}
	graceUntil := req.GraceUntil
	if req.ClearGraceUntil {
		graceUntil = nil
	}
	canceledAt := req.CanceledAt
	if req.ClearCanceledAt {
		canceledAt = nil
	}

	result, err := r.pool.Exec(ctx, `
		UPDATE subscriptions SET
			plan_id            = COALESCE($2, plan_id),
			status             = COALESCE($3::subscription_status, status),
			trial_ends_at      = CASE WHEN $7 THEN NULL WHEN $4 IS NOT NULL THEN $4 ELSE trial_ends_at END,
			current_period_end = COALESCE($5, current_period_end),
			grace_until        = CASE WHEN $8 THEN NULL WHEN $6 IS NOT NULL THEN $6 ELSE grace_until END,
			canceled_at        = CASE WHEN $9 THEN NULL WHEN $10 IS NOT NULL THEN $10 ELSE canceled_at END
		WHERE tenant_id = $1`,
		tenantID, planID, req.Status,
		trialEnd, req.CurrentPeriodEnd, graceUntil,
		req.ClearTrialEnd, req.ClearGraceUntil, req.ClearCanceledAt, canceledAt,
	)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return errors.New("subscription not found")
	}
	return nil
}

// ── Users (admin global) ──────────────────────────────────────────────────────

func (r *Repository) ListUsersAdmin(ctx context.Context) ([]*UserAdmin, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT
		  u.id::text, u.tenant_id::text, t.slug, t.name,
		  u.role, u.name, u.email, u.is_active,
		  u.last_seen_at, u.created_at
		FROM users u
		LEFT JOIN tenants t ON t.id = u.tenant_id
		ORDER BY u.created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*UserAdmin
	for rows.Next() {
		u := &UserAdmin{}
		if err := rows.Scan(
			&u.ID, &u.TenantID, &u.TenantSlug, &u.TenantName,
			&u.Role, &u.Name, &u.Email, &u.IsActive,
			&u.LastSeenAt, &u.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, u)
	}
	return list, rows.Err()
}

func (r *Repository) UpdateUserAdmin(ctx context.Context, id string, req *UpdateUserAdminRequest) (*UserAdmin, error) {
	if req.Name == nil && req.Role == nil && req.IsActive == nil {
		return nil, errors.New("nothing to update")
	}
	u := &UserAdmin{}
	err := r.pool.QueryRow(ctx, `
		UPDATE users SET
			name      = COALESCE($2, name),
			role      = COALESCE($3, role),
			is_active = COALESCE($4, is_active),
			updated_at = NOW()
		WHERE id = $1
		RETURNING id::text, tenant_id::text, role, name, email, is_active, last_seen_at, created_at`,
		id, req.Name, req.Role, req.IsActive,
	).Scan(&u.ID, &u.TenantID, &u.Role, &u.Name, &u.Email, &u.IsActive, &u.LastSeenAt, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, errors.New("user not found")
	}
	return u, err
}

// ── Plans (admin) ─────────────────────────────────────────────────────────────

func (r *Repository) ListPlansAdmin(ctx context.Context) ([]*PlanAdmin, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id::text, name, COALESCE(display_name,''), COALESCE(tagline,''),
		  max_vehicles, max_users, COALESCE(max_leads,-1),
		  price_monthly, price_yearly, features, is_active
		FROM plans ORDER BY price_monthly`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*PlanAdmin
	for rows.Next() {
		p := &PlanAdmin{}
		var featJSON []byte
		if err := rows.Scan(
			&p.ID, &p.Name, &p.DisplayName, &p.Tagline,
			&p.MaxVehicles, &p.MaxUsers, &p.MaxLeads,
			&p.PriceMonthly, &p.PriceYearly, &featJSON, &p.IsActive,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(featJSON, &p.Features)
		list = append(list, p)
	}
	return list, rows.Err()
}

func (r *Repository) UpdatePlan(ctx context.Context, id string, req *UpdatePlanRequest) (*PlanAdmin, error) {
	var featStr *string
	if req.Features != nil {
		b, _ := json.Marshal(req.Features)
		s := string(b)
		featStr = &s
	}
	p := &PlanAdmin{}
	var featRaw []byte
	err := r.pool.QueryRow(ctx, `
		UPDATE plans SET
			display_name  = COALESCE($2, display_name),
			tagline       = COALESCE($3, tagline),
			max_vehicles  = COALESCE($4, max_vehicles),
			max_users     = COALESCE($5, max_users),
			max_leads     = COALESCE($6, max_leads),
			price_monthly = COALESCE($7, price_monthly),
			price_yearly  = COALESCE($8, price_yearly),
			features      = COALESCE($9::jsonb, features),
			is_active     = COALESCE($10, is_active)
		WHERE id = $1
		RETURNING id::text, name, COALESCE(display_name,''), COALESCE(tagline,''),
		  max_vehicles, max_users, COALESCE(max_leads,-1),
		  price_monthly, price_yearly, features, is_active`,
		id, req.DisplayName, req.Tagline,
		req.MaxVehicles, req.MaxUsers, req.MaxLeads,
		req.PriceMonthly, req.PriceYearly, featStr, req.IsActive,
	).Scan(
		&p.ID, &p.Name, &p.DisplayName, &p.Tagline,
		&p.MaxVehicles, &p.MaxUsers, &p.MaxLeads,
		&p.PriceMonthly, &p.PriceYearly, &featRaw, &p.IsActive,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, errors.New("plan not found")
	}
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(featRaw, &p.Features)
	return p, nil
}

// ── Audit log (admin — tenant_id may be NULL for cross-tenant ops) ────────────

func (r *Repository) WriteAdminAudit(ctx context.Context, actorID, tenantID, action, entityType, entityID string, oldData, newData map[string]any, ip string) {
	oldJSON, _ := json.Marshal(oldData)
	newJSON, _ := json.Marshal(newData)
	var tid, eid, actor any
	if tenantID != "" {
		tid = tenantID
	}
	if entityID != "" {
		eid = entityID
	}
	if actorID != "" {
		actor = actorID
	}
	_, _ = r.pool.Exec(ctx, `
		INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8::inet)`,
		tid, actor, action, entityType, eid, oldJSON, newJSON, nilOrIP(ip),
	)
}

func nilOrIP(ip string) any {
	if ip == "" {
		return nil
	}
	return ip
}
