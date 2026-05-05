package billing

import (
	"context"
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

// GetAsaasCustomerID returns the Asaas customer ID for a tenant, if any.
func (r *Repository) GetAsaasCustomerID(ctx context.Context, tenantID string) (string, string, string, error) {
	var name, email, asaasID string
	err := r.pool.QueryRow(ctx,
		`SELECT name, email, COALESCE(asaas_customer_id, '') FROM tenants WHERE id = $1`,
		tenantID,
	).Scan(&name, &email, &asaasID)
	return name, email, asaasID, err
}

// SaveAsaasCustomerID persists the Asaas customer ID on the tenant.
func (r *Repository) SaveAsaasCustomerID(ctx context.Context, tenantID, customerID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE tenants SET asaas_customer_id = $2 WHERE id = $1`,
		tenantID, customerID,
	)
	return err
}

// UpdateSubscriptionAsaas saves the Asaas subscription ID, plan, status, and payment link.
func (r *Repository) UpdateSubscriptionAsaas(ctx context.Context, tenantID, asaasSubID, paymentLink, cycle string, planID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE subscriptions SET
			plan_id                = $3,
			asaas_subscription_id  = $4,
			asaas_payment_link     = $5,
			billing_cycle          = $6,
			status                 = 'trialing',
			current_period_end     = NOW() + INTERVAL '1 day'
		WHERE tenant_id = $1`,
		tenantID, tenantID, planID, asaasSubID, paymentLink, cycle,
	)
	return err
}

// ActivateByAsaasSubID activates the subscription when a payment is received.
func (r *Repository) ActivateByAsaasSubID(ctx context.Context, asaasSubID string, periodEnd time.Time) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE subscriptions SET
			status                 = 'active',
			current_period_start   = NOW(),
			current_period_end     = $2,
			trial_ends_at          = NULL,
			grace_until            = NULL
		WHERE asaas_subscription_id = $1`,
		asaasSubID, periodEnd,
	)
	return err
}

// MarkPastDueByAsaasSubID sets subscription to past_due.
func (r *Repository) MarkPastDueByAsaasSubID(ctx context.Context, asaasSubID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE subscriptions SET status = 'past_due' WHERE asaas_subscription_id = $1`,
		asaasSubID,
	)
	return err
}

// CancelByAsaasSubID cancels a subscription.
func (r *Repository) CancelByAsaasSubID(ctx context.Context, asaasSubID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE subscriptions SET status = 'canceled', canceled_at = NOW() WHERE asaas_subscription_id = $1`,
		asaasSubID,
	)
	return err
}

// GetPlanByName returns the plan ID and prices by plan name.
func (r *Repository) GetPlanByName(ctx context.Context, name string) (id string, monthly, yearly float64, err error) {
	err = r.pool.QueryRow(ctx,
		`SELECT id::text, price_monthly, price_yearly FROM plans WHERE name = $1`,
		name,
	).Scan(&id, &monthly, &yearly)
	return
}

// CheckSubscriptionStatus returns the subscription status for a tenant (fast path for gate middleware).
func (r *Repository) CheckSubscriptionStatus(ctx context.Context, tenantID string) (status string, graceUntil *time.Time, err error) {
	err = r.pool.QueryRow(ctx,
		`SELECT status, grace_until FROM subscriptions WHERE tenant_id = $1`,
		tenantID,
	).Scan(&status, &graceUntil)
	return
}
