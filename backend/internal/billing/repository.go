package billing

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

func (r *Repository) GetAsaasCustomerID(ctx context.Context, tenantID string) (name, email, asaasID string, err error) {
	err = r.pool.QueryRow(ctx,
		`SELECT name, email, COALESCE(asaas_customer_id, '') FROM tenants WHERE id = $1`,
		tenantID,
	).Scan(&name, &email, &asaasID)
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
			plan_id               = $3,
			asaas_subscription_id = $4,
			asaas_payment_link    = $5,
			billing_cycle         = $6,
			status                = 'trialing',
			current_period_end    = NOW() + INTERVAL '7 days',
			trial_ends_at         = NOW() + INTERVAL '7 days'
		WHERE tenant_id = $1`,
		tenantID, tenantID, planID, asaasSubID, paymentLink, cycle,
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
			grace_until           = NULL
		WHERE asaas_subscription_id = $1`,
		asaasSubID, periodEnd,
	)
	return err
}

func (r *Repository) MarkPastDueByAsaasSubID(ctx context.Context, asaasSubID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE subscriptions SET status = 'past_due' WHERE asaas_subscription_id = $1`,
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
			current_period_end = NOW() + INTERVAL '7 days',
			trial_ends_at  = NOW() + INTERVAL '7 days'
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
		SELECT $1, $2,
		       (SELECT id FROM subscriptions WHERE asaas_subscription_id = $4 LIMIT 1),
		       $3::jsonb
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
	return fmt.Sprintf("pending") // safe fallback
}
