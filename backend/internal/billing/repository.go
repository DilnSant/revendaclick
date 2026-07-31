package billing

import (
	"context"
	"encoding/json"
	"errors"
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

func (r *Repository) GetSubscription(ctx context.Context, tenantID string) (*Subscription, error) {
	s := &Subscription{}
	err := r.pool.QueryRow(ctx, `
		SELECT s.id, s.tenant_id, s.plan_id,
		       p.name, p.display_name,
		       s.status, s.billing_cycle,
		       s.current_period_end,
		       s.trial_ends_at,
		       s.grace_until,
		       COALESCE(s.asaas_subscription_id, ''),
		       COALESCE(s.asaas_payment_link, ''),
		       p.price_monthly, p.price_yearly
		FROM subscriptions s
		JOIN plans p ON p.id = s.plan_id
		WHERE s.tenant_id = $1`, tenantID,
	).Scan(
		&s.ID, &s.TenantID, &s.PlanID,
		&s.PlanName, &s.PlanDisplay,
		&s.Status, &s.BillingCycle,
		&s.CurrentPeriodEnd,
		&s.TrialEndsAt,
		&s.GraceUntil,
		&s.AsaasSubscriptionID,
		&s.AsaasPaymentLink,
		&s.PriceMonthly, &s.PriceYearly,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return s, err
}

func (r *Repository) GetAsaasCustomerID(ctx context.Context, tenantID string) (name, email, asaasID, cpfCnpj string, err error) {
	err = r.pool.QueryRow(ctx,
		`SELECT name, email, COALESCE(asaas_customer_id, ''), COALESCE(cpf_cnpj, '') FROM tenants WHERE id = $1`,
		tenantID,
	).Scan(&name, &email, &asaasID, &cpfCnpj)
	return
}

func (r *Repository) SaveAsaasCustomerID(ctx context.Context, tenantID, customerID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE tenants SET asaas_customer_id = $2 WHERE id = $1`,
		tenantID, customerID,
	)
	return err
}

func (r *Repository) UpsertBillingCustomer(ctx context.Context, tenantID, asaasID, name, email, cpfCnpj, phone string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO billing_customers (tenant_id, asaas_id, name, email, cpf_cnpj, phone)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (tenant_id)
		DO UPDATE SET asaas_id = EXCLUDED.asaas_id, name = EXCLUDED.name,
		              email = EXCLUDED.email, cpf_cnpj = EXCLUDED.cpf_cnpj,
		              phone = EXCLUDED.phone, updated_at = NOW()`,
		tenantID, asaasID, name, email, cpfCnpj, phone,
	)
	return err
}

func (r *Repository) UpdateSubscriptionAsaas(ctx context.Context, tenantID, asaasSubID, paymentLink, cycle, planID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE subscriptions SET
			plan_id               = $2,
			asaas_subscription_id = $3,
			asaas_payment_link    = $4,
			billing_cycle         = $5,
			status                = 'trialing',
			current_period_end    = NOW() + INTERVAL '7 days',
			trial_ends_at         = NOW() + INTERVAL '7 days'
		WHERE tenant_id = $1`,
		tenantID, planID, asaasSubID, paymentLink, cycle,
	)
	return err
}

func (r *Repository) ActivateByAsaasSubID(ctx context.Context, asaasSubID string, periodEnd time.Time) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE subscriptions SET
			status                = 'active',
			current_period_start  = NOW(),
			current_period_end    = $2,
			trial_ends_at         = NULL,
			grace_until           = NULL,
			canceled_at           = NULL
		WHERE asaas_subscription_id = $1`,
		asaasSubID, periodEnd,
	)
	return err
}

func (r *Repository) MarkPastDueByAsaasSubID(ctx context.Context, asaasSubID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE subscriptions SET status = 'past_due', grace_until = NOW() + INTERVAL '7 days'
		 WHERE asaas_subscription_id = $1`,
		asaasSubID,
	)
	return err
}

func (r *Repository) CancelByAsaasSubID(ctx context.Context, asaasSubID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE subscriptions SET status = 'canceled', canceled_at = NOW() WHERE asaas_subscription_id = $1`,
		asaasSubID,
	)
	return err
}

func (r *Repository) CancelByTenantID(ctx context.Context, tenantID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE subscriptions SET status = 'canceled', canceled_at = NOW() WHERE tenant_id = $1`,
		tenantID,
	)
	return err
}

func (r *Repository) ReactivateByTenantID(ctx context.Context, tenantID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE subscriptions SET
			status         = 'trialing',
			canceled_at    = NULL,
			grace_until    = NULL,
			current_period_end = NOW() + INTERVAL '30 days',
			trial_ends_at  = NOW() + INTERVAL '30 days'
		WHERE tenant_id = $1`,
		tenantID,
	)
	return err
}

func (r *Repository) GetPlanByName(ctx context.Context, name string) (id string, monthly, yearly float64, err error) {
	err = r.pool.QueryRow(ctx,
		`SELECT id::text, price_monthly, price_yearly FROM plans WHERE name = $1`,
		name,
	).Scan(&id, &monthly, &yearly)
	return
}

// UpdateSubscriptionPlan updates plan and cycle without touching status or Asaas IDs.
// Used for upgrades/downgrades of already-active subscriptions.
func (r *Repository) UpdateSubscriptionPlan(ctx context.Context, tenantID, planID, cycle string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE subscriptions SET
			plan_id       = $2,
			billing_cycle = $3
		WHERE tenant_id = $1`,
		tenantID, planID, cycle,
	)
	return err
}

// DevActivateSubscription bypasses Asaas and directly activates a subscription.
// For use in non-production environments only. Call site must enforce ENV check.
func (r *Repository) DevActivateSubscription(ctx context.Context, tenantID, planName string) error {
	planID, _, _, err := r.GetPlanByName(ctx, planName)
	if err != nil || planID == "" {
		return errors.New("plan not found: " + planName)
	}
	result, err := r.pool.Exec(ctx, `
		UPDATE subscriptions SET
			plan_id               = $2,
			status                = 'active',
			billing_cycle         = 'monthly',
			asaas_subscription_id = 'dev_test_' || $1::text,
			asaas_payment_link    = '',
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
		return errors.New("subscription not found for tenant")
	}
	return nil
}

func (r *Repository) CheckSubscriptionStatus(ctx context.Context, tenantID string) (status string, graceUntil *time.Time, err error) {
	err = r.pool.QueryRow(ctx,
		`SELECT status, grace_until FROM subscriptions WHERE tenant_id = $1`,
		tenantID,
	).Scan(&status, &graceUntil)
	return
}

// ── Idempotency ───────────────────────────────────────────────────────────────

// TryLockEvent inserts an event_key to prevent duplicate webhook processing.
// Returns false if the key already exists (already processed).
func (r *Repository) TryLockEvent(ctx context.Context, eventKey, eventType, tenantID string, payload []byte) (bool, error) {
	result, err := r.pool.Exec(ctx, `
		INSERT INTO billing_events (event_key, event_type, tenant_id, payload)
		VALUES ($1, $2, NULLIF($4, '')::UUID, $3::jsonb)
		ON CONFLICT (event_key) DO NOTHING`,
		eventKey, eventType, string(payload), tenantID,
	)
	if err != nil {
		return false, err
	}
	return result.RowsAffected() > 0, nil
}

// UpsertInvoice stores an Asaas payment record.
func (r *Repository) UpsertInvoice(ctx context.Context, tenantID string, p *AsaasPayment) error {
	status := mapPaymentStatus(p.Status)
	var paidAt *time.Time
	if p.Status == "RECEIVED" || p.Status == "CONFIRMED" {
		now := time.Now()
		paidAt = &now
	}

	_, err := r.pool.Exec(ctx, `
		INSERT INTO billing_invoices
		    (tenant_id, asaas_payment_id, asaas_subscription, value, status,
		     billing_type, due_date, paid_at, invoice_url, bank_slip_url,
		     pix_qr_code, pix_copy_paste, description)
		VALUES ($1,$2,$3,$4,$5::invoice_status,$6,
		        NULLIF($7,'')::DATE,$8,$9,$10,$11,$12,$13)
		ON CONFLICT (asaas_payment_id) DO UPDATE SET
		    status        = EXCLUDED.status,
		    paid_at       = COALESCE(EXCLUDED.paid_at, billing_invoices.paid_at),
		    invoice_url   = COALESCE(NULLIF(EXCLUDED.invoice_url,''), billing_invoices.invoice_url),
		    updated_at    = NOW()`,
		tenantID, p.ID, nullStr(p.Subscription), p.Value, status,
		nullStr(p.BillingType), p.DueDate, paidAt,
		nullStr(p.InvoiceURL), nullStr(p.BankSlipURL),
		nullStr(p.PixQRCode), nullStr(p.PixCopyPaste), nullStr(p.Description),
	)
	return err
}

// ListInvoices returns the most recent invoices for a tenant.
func (r *Repository) ListInvoices(ctx context.Context, tenantID string, limit int) ([]*Invoice, error) {
	if limit <= 0 {
		limit = 20
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id, asaas_payment_id, value, status::text, COALESCE(billing_type,''),
		       COALESCE(due_date::text,''), paid_at,
		       COALESCE(invoice_url,''), COALESCE(description,'')
		FROM billing_invoices
		WHERE tenant_id = $1
		ORDER BY due_date DESC NULLS LAST
		LIMIT $2`, tenantID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*Invoice
	for rows.Next() {
		inv := &Invoice{}
		if err := rows.Scan(
			&inv.ID, &inv.AsaasPaymentID, &inv.Value, &inv.Status,
			&inv.BillingType, &inv.DueDate, &inv.PaidAt,
			&inv.InvoiceURL, &inv.Description,
		); err != nil {
			return nil, err
		}
		list = append(list, inv)
	}
	return list, rows.Err()
}

// FindTenantByAsaasSubID looks up the tenant ID via asaas_subscription_id.
func (r *Repository) FindTenantByAsaasSubID(ctx context.Context, asaasSubID string) (string, error) {
	var tid string
	err := r.pool.QueryRow(ctx,
		`SELECT tenant_id::text FROM subscriptions WHERE asaas_subscription_id = $1`,
		asaasSubID,
	).Scan(&tid)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}
	return tid, err
}

// ── Add-ons ───────────────────────────────────────────────────────────────────

func (r *Repository) ListAvailableAddons(ctx context.Context) ([]*PlanAddon, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT addon_type, display_name, COALESCE(description,''), price_monthly, features
		FROM plan_addons
		WHERE is_active = TRUE
		ORDER BY price_monthly ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*PlanAddon
	for rows.Next() {
		a := &PlanAddon{}
		var featJSON []byte
		if err := rows.Scan(&a.AddonType, &a.DisplayName, &a.Description, &a.PriceMonthly, &featJSON); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(featJSON, &a.Features)
		list = append(list, a)
	}
	return list, rows.Err()
}

func (r *Repository) ListActiveAddons(ctx context.Context, tenantID string) ([]*ActiveAddon, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT sa.id, sa.addon_type, pa.display_name, COALESCE(pa.description,''),
		       pa.price_monthly, sa.quantity, sa.status, sa.started_at::text, pa.features,
		       COALESCE(sa.asaas_payment_link, '')
		FROM subscription_addons sa
		JOIN plan_addons pa ON pa.addon_type = sa.addon_type
		WHERE sa.tenant_id = $1
		  AND sa.status IN ('active', 'pending_payment', 'past_due')
		ORDER BY sa.started_at ASC`, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*ActiveAddon
	for rows.Next() {
		a := &ActiveAddon{}
		var featJSON []byte
		if err := rows.Scan(
			&a.ID, &a.AddonType, &a.DisplayName, &a.Description,
			&a.PriceMonthly, &a.Quantity, &a.Status, &a.StartedAt, &featJSON,
			&a.PaymentLink,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(featJSON, &a.Features)
		list = append(list, a)
	}
	return list, rows.Err()
}

func (r *Repository) ActivateAddon(ctx context.Context, tenantID, subscriptionID, addonType, asaasAddonID, paymentLink string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO subscription_addons
			(tenant_id, subscription_id, addon_type, quantity, price_monthly,
			 status, asaas_addon_id, asaas_payment_link)
		SELECT $1, $2::uuid, pa.addon_type, 1, pa.price_monthly,
		       'pending_payment', $4, $5
		FROM plan_addons pa
		WHERE pa.addon_type = $3 AND pa.is_active = TRUE
		ON CONFLICT (tenant_id, addon_type) DO UPDATE SET
			status             = 'pending_payment',
			asaas_addon_id     = $4,
			asaas_payment_link = $5,
			canceled_at        = NULL,
			grace_until        = NULL,
			updated_at         = NOW()`,
		tenantID, nullStr(subscriptionID), addonType,
		nullStr(asaasAddonID), nullStr(paymentLink),
	)
	return err
}

func (r *Repository) CancelAddon(ctx context.Context, tenantID, addonType string) error {
	result, err := r.pool.Exec(ctx, `
		UPDATE subscription_addons
		SET status = 'canceled', canceled_at = NOW(), updated_at = NOW()
		WHERE tenant_id = $1 AND addon_type = $2
		  AND status IN ('active', 'pending_payment', 'past_due')`,
		tenantID, addonType,
	)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return errors.New("add-on não encontrado ou já cancelado")
	}
	return nil
}

// ── Add-on billing methods (Etapa 5) ─────────────────────────────────────────

// FindTenantByAsaasAddonID looks up the tenant + addon type via asaas_addon_id.
// Used for webhook routing to distinguish addon subscriptions from main subscriptions.
func (r *Repository) FindTenantByAsaasAddonID(ctx context.Context, asaasAddonID string) (tenantID, addonType string, err error) {
	err = r.pool.QueryRow(ctx,
		`SELECT tenant_id::text, addon_type FROM subscription_addons WHERE asaas_addon_id = $1`,
		asaasAddonID,
	).Scan(&tenantID, &addonType)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", "", nil
	}
	return
}

// ActivateAddonByAsaasID sets status='active' after PAYMENT_CONFIRMED.
func (r *Repository) ActivateAddonByAsaasID(ctx context.Context, asaasAddonID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE subscription_addons SET
			status      = 'active',
			grace_until = NULL,
			updated_at  = NOW()
		WHERE asaas_addon_id = $1`,
		asaasAddonID,
	)
	return err
}

// MarkAddonPastDueByAsaasID sets status='past_due' + 7-day grace after PAYMENT_OVERDUE or PAYMENT_REFUNDED.
func (r *Repository) MarkAddonPastDueByAsaasID(ctx context.Context, asaasAddonID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE subscription_addons SET
			status      = 'past_due',
			grace_until = NOW() + INTERVAL '7 days',
			updated_at  = NOW()
		WHERE asaas_addon_id = $1 AND status = 'active'`,
		asaasAddonID,
	)
	return err
}

// CancelAddonByAsaasID sets status='canceled' after SUBSCRIPTION_CANCELED or SUBSCRIPTION_DELETED.
func (r *Repository) CancelAddonByAsaasID(ctx context.Context, asaasAddonID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE subscription_addons SET
			status      = 'canceled',
			canceled_at = NOW(),
			updated_at  = NOW()
		WHERE asaas_addon_id = $1`,
		asaasAddonID,
	)
	return err
}

// GetAddonByTenantAndType returns the active/pending/past_due record for a tenant+addon combo.
// Used by CancelAddon service to fetch the asaas_addon_id before calling Asaas.
func (r *Repository) GetAddonByTenantAndType(ctx context.Context, tenantID, addonType string) (*AddonRecord, error) {
	rec := &AddonRecord{}
	err := r.pool.QueryRow(ctx,
		`SELECT id::text, COALESCE(asaas_addon_id, '')
		 FROM subscription_addons
		 WHERE tenant_id = $1 AND addon_type = $2
		   AND status IN ('active', 'pending_payment', 'past_due')`,
		tenantID, addonType,
	).Scan(&rec.ID, &rec.AsaasAddonID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return rec, err
}

// GetAddonPrice returns the monthly price for an addon type.
func (r *Repository) GetAddonPrice(ctx context.Context, addonType string) (float64, error) {
	var price float64
	err := r.pool.QueryRow(ctx,
		`SELECT price_monthly FROM plan_addons WHERE addon_type = $1 AND is_active = TRUE`,
		addonType,
	).Scan(&price)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, nil
	}
	return price, err
}

// ListActiveAddonIDs returns id + asaas_addon_id for all non-canceled add-ons of a tenant.
// Used by cancelTenantAddons to cancel each add-on in Asaas before bulk-canceling in DB.
func (r *Repository) ListActiveAddonIDs(ctx context.Context, tenantID string) ([]*AddonRecord, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id::text, COALESCE(asaas_addon_id, '')
		 FROM subscription_addons
		 WHERE tenant_id = $1
		   AND status IN ('active', 'pending_payment', 'past_due')`,
		tenantID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*AddonRecord
	for rows.Next() {
		rec := &AddonRecord{}
		if err := rows.Scan(&rec.ID, &rec.AsaasAddonID); err != nil {
			return nil, err
		}
		list = append(list, rec)
	}
	return list, rows.Err()
}

// CancelAllAddonsByTenantID bulk-cancels all non-canceled add-ons for a tenant.
// Called after Asaas cancellations are attempted (best-effort) via cancelTenantAddons.
func (r *Repository) CancelAllAddonsByTenantID(ctx context.Context, tenantID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE subscription_addons
		SET status      = 'canceled',
		    canceled_at = NOW(),
		    updated_at  = NOW()
		WHERE tenant_id = $1
		  AND status IN ('active', 'pending_payment', 'past_due')`,
		tenantID,
	)
	return err
}

// GetPlanFeaturesByTenant returns the plan's own features (without addon overlay).
// Used to compute is_redundant for active add-ons.
func (r *Repository) GetPlanFeaturesByTenant(ctx context.Context, tenantID string) ([]string, error) {
	var featJSON []byte
	err := r.pool.QueryRow(ctx,
		`SELECT pl.features FROM plans pl
		 JOIN subscriptions s ON s.plan_id = pl.id
		 WHERE s.tenant_id = $1
		   AND s.status IN ('active', 'trialing', 'past_due')`,
		tenantID,
	).Scan(&featJSON)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var features []string
	_ = json.Unmarshal(featJSON, &features)
	return features, nil
}

// ── helpers ───────────────────────────────────────────────────────────────────

func nullStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func mapPaymentStatus(s string) string {
	m := map[string]string{
		"PENDING":    "pending",
		"CONFIRMED":  "confirmed",
		"RECEIVED":   "received",
		"OVERDUE":    "overdue",
		"REFUNDED":   "refunded",
		"REFUND_REQUESTED": "refunded",
		"CHARGEBACK_REQUESTED": "canceled",
		"CANCELED":   "canceled",
	}
	if v, ok := m[s]; ok {
		return v
	}
	return "pending" // safe fallback
}
