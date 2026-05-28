package billing

import (
	"context"
	"fmt"
	"strings"
	"time"
	"unicode"
)

// asaasUserErr translates raw Asaas API error strings into user-friendly messages.
func asaasUserErr(raw string) string {
	if strings.Contains(raw, "not_allowed_ip") {
		return "IP do servidor não autorizado no Asaas. Acesse o painel Asaas → API → Whitelist de IPs e adicione o IP do servidor."
	}
	return raw
}

type Service struct {
	repo  *Repository
	asaas *asaasClient
}

func NewService(repo *Repository, asaasKey, asaasEnv string) *Service {
	return &Service{
		repo:  repo,
		asaas: newAsaasClient(asaasKey, asaasEnv),
	}
}

func (s *Service) GetSubscription(ctx context.Context, tenantID string) (*Subscription, error) {
	sub, err := s.repo.GetSubscription(ctx, tenantID)
	if err != nil || sub == nil {
		return sub, err
	}
	sub.ComputeFlags()
	return sub, nil
}

// Subscribe creates or updates an Asaas subscription for a tenant.
func (s *Service) Subscribe(ctx context.Context, tenantID string, req *SubscribeRequest) (*Subscription, error) {
	req.PlanName = strings.ToLower(strings.TrimSpace(req.PlanName))
	req.BillingCycle = strings.ToLower(strings.TrimSpace(req.BillingCycle))
	if req.BillingCycle != "yearly" {
		req.BillingCycle = "monthly"
	}

	billingType := strings.ToUpper(strings.TrimSpace(req.BillingType))
	if billingType == "" || (billingType != "PIX" && billingType != "CREDIT_CARD" && billingType != "BOLETO") {
		billingType = "BOLETO"
	}

	planID, priceMonthly, priceYearly, err := s.repo.GetPlanByName(ctx, req.PlanName)
	if err != nil || planID == "" {
		return nil, fmt.Errorf("plano não encontrado: %s", req.PlanName)
	}
	value := priceMonthly
	cycle := "MONTHLY"
	if req.BillingCycle == "yearly" {
		value = priceYearly
		cycle = "YEARLY"
	}

	// Guard: if tenant already has an active or trialing Asaas subscription, return it as-is.
	// Prevents duplicate subscriptions and accidental status reset on repeated POST /subscribe.
	if existing, gerr := s.repo.GetSubscription(ctx, tenantID); gerr == nil &&
		existing != nil && existing.AsaasSubscriptionID != "" &&
		(existing.Status == "active" || existing.Status == "trialing") {
		existing.ComputeFlags()
		return existing, nil
	}

	name, email, asaasCustomerID, err := s.repo.GetAsaasCustomerID(ctx, tenantID)
	if err != nil {
		return nil, fmt.Errorf("tenant não encontrado: %w", err)
	}

	if asaasCustomerID == "" {
		customer, cerr := s.asaas.createCustomer(name, email, "", req.CPFOrCNPJ, tenantID)
		if cerr != nil {
			return nil, fmt.Errorf("%s", asaasUserErr(cerr.Error()))
		}
		asaasCustomerID = customer.ID
		if err = s.repo.SaveAsaasCustomerID(ctx, tenantID, asaasCustomerID); err != nil {
			return nil, fmt.Errorf("save customer id: %w", err)
		}
		// Persist to billing_customers
		_ = s.repo.UpsertBillingCustomer(ctx, tenantID, customer.ID, name, email, req.CPFOrCNPJ, "")
	}

	desc := fmt.Sprintf("RevendaClick — Plano %s (%s)", capitalize(req.PlanName), capitalize(req.BillingCycle))
	sub, err := s.asaas.createSubscription(asaasCustomerID, value, cycle, billingType, desc, tenantID)
	if err != nil {
		return nil, fmt.Errorf("%s", asaasUserErr(err.Error()))
	}

	paymentLink := sub.PaymentLink
	if paymentLink == "" {
		paymentLink, _ = s.asaas.getSubscriptionPayments(sub.ID)
	}

	if err = s.repo.UpdateSubscriptionAsaas(ctx, tenantID, sub.ID, paymentLink, req.BillingCycle, planID); err != nil {
		return nil, fmt.Errorf("update subscription: %w", err)
	}

	_ = priceMonthly
	_ = priceYearly

	return s.GetSubscription(ctx, tenantID)
}

// UpgradeSubscription changes the plan of an already-active Asaas subscription.
// Updates Asaas (new value/cycle) and local DB (plan_id/billing_cycle).
// Status is not changed — user keeps access immediately.
func (s *Service) UpgradeSubscription(ctx context.Context, tenantID string, req *UpgradeRequest) (*Subscription, error) {
	req.PlanName = strings.ToLower(strings.TrimSpace(req.PlanName))
	req.BillingCycle = strings.ToLower(strings.TrimSpace(req.BillingCycle))

	current, err := s.repo.GetSubscription(ctx, tenantID)
	if err != nil {
		return nil, fmt.Errorf("get subscription: %w", err)
	}
	if current == nil {
		return nil, fmt.Errorf("assinatura não encontrada")
	}
	current.ComputeFlags()
	if !current.IsActive {
		return nil, fmt.Errorf("upgrade requer assinatura ativa (status atual: %s)", current.Status)
	}
	if current.AsaasSubscriptionID == "" {
		return nil, fmt.Errorf("assinatura sem ID Asaas — use o fluxo de assinatura inicial")
	}

	if req.BillingCycle != "monthly" && req.BillingCycle != "yearly" {
		req.BillingCycle = current.BillingCycle
	}

	if strings.EqualFold(req.PlanName, current.PlanName) && req.BillingCycle == current.BillingCycle {
		return current, nil // no-op
	}

	planID, priceMonthly, priceYearly, err := s.repo.GetPlanByName(ctx, req.PlanName)
	if err != nil || planID == "" {
		return nil, fmt.Errorf("plano não encontrado: %s", req.PlanName)
	}

	value := priceMonthly
	cycle := "MONTHLY"
	if req.BillingCycle == "yearly" {
		value = priceYearly
		cycle = "YEARLY"
	}

	desc := fmt.Sprintf("RevendaClick — Plano %s (%s)", capitalize(req.PlanName), capitalize(req.BillingCycle))
	if err := s.asaas.updateSubscription(current.AsaasSubscriptionID, value, cycle, desc); err != nil {
		return nil, fmt.Errorf("%s", asaasUserErr(err.Error()))
	}

	if err := s.repo.UpdateSubscriptionPlan(ctx, tenantID, planID, req.BillingCycle); err != nil {
		return nil, fmt.Errorf("update plan: %w", err)
	}

	return s.GetSubscription(ctx, tenantID)
}

// CancelSubscription cancels a tenant's active subscription in Asaas and DB.
func (s *Service) CancelSubscription(ctx context.Context, tenantID string) error {
	sub, err := s.repo.GetSubscription(ctx, tenantID)
	if err != nil {
		return fmt.Errorf("get subscription: %w", err)
	}
	if sub == nil {
		return fmt.Errorf("assinatura não encontrada")
	}
	if sub.AsaasSubscriptionID != "" {
		_ = s.asaas.cancelSubscription(sub.AsaasSubscriptionID) // best-effort
	}
	return s.repo.CancelByTenantID(ctx, tenantID)
}

// ReactivateSubscription restores a canceled subscription with a new trial period.
func (s *Service) ReactivateSubscription(ctx context.Context, tenantID string) error {
	return s.repo.ReactivateByTenantID(ctx, tenantID)
}

// DevActivate bypasses Asaas and immediately activates a subscription.
// Only call from routes that are registered exclusively in non-production environments.
func (s *Service) DevActivate(ctx context.Context, tenantID, planName string) (*Subscription, error) {
	if err := s.repo.DevActivateSubscription(ctx, tenantID, planName); err != nil {
		return nil, err
	}
	return s.GetSubscription(ctx, tenantID)
}

// ListInvoices returns the billing invoice history for a tenant.
func (s *Service) ListInvoices(ctx context.Context, tenantID string) ([]*Invoice, error) {
	return s.repo.ListInvoices(ctx, tenantID, 30)
}

// HandleWebhook processes an Asaas webhook event with idempotency.
func (s *Service) HandleWebhook(ctx context.Context, wh *AsaasWebhook, rawPayload []byte) error {
	asaasID := webhookAsaasID(wh)
	if asaasID == "" {
		return nil // nothing to key on, ignore
	}

	eventKey := fmt.Sprintf("%s:%s", wh.Event, asaasID)

	tenantID := ""
	if wh.Payment != nil && wh.Payment.Subscription != "" {
		tenantID, _ = s.repo.FindTenantByAsaasSubID(ctx, wh.Payment.Subscription)
	} else if tenantID == "" && wh.Subscription != nil && wh.Subscription.ID != "" {
		tenantID, _ = s.repo.FindTenantByAsaasSubID(ctx, wh.Subscription.ID)
	}

	// Idempotency check — insert event_key; skip if already processed
	locked, err := s.repo.TryLockEvent(ctx, eventKey, wh.Event, tenantID, rawPayload)
	if err != nil {
		return fmt.Errorf("event lock: %w", err)
	}
	if !locked {
		return nil // duplicate event, already handled
	}

	// Persist invoice record for payment events
	if wh.Payment != nil {
		_ = s.repo.UpsertInvoice(ctx, tenantID, wh.Payment)
	}

	return s.dispatchWebhookEvent(ctx, wh)
}

func (s *Service) dispatchWebhookEvent(ctx context.Context, wh *AsaasWebhook) error {
	switch wh.Event {
	case EventPaymentReceived, EventPaymentConfirmed:
		if wh.Payment == nil || wh.Payment.Subscription == "" {
			return nil
		}
		periodEnd := nextPeriodEnd(wh.Payment.DueDate, 1)
		return s.repo.ActivateByAsaasSubID(ctx, wh.Payment.Subscription, periodEnd)

	case EventPaymentOverdue, EventPaymentRefunded:
		if wh.Payment == nil || wh.Payment.Subscription == "" {
			return nil
		}
		return s.repo.MarkPastDueByAsaasSubID(ctx, wh.Payment.Subscription)

	case EventSubCanceled, EventSubDeleted:
		subID := ""
		if wh.Subscription != nil {
			subID = wh.Subscription.ID
		} else if wh.Payment != nil {
			subID = wh.Payment.Subscription
		}
		if subID == "" {
			return nil
		}
		return s.repo.CancelByAsaasSubID(ctx, subID)

	case EventSubCreated, EventSubUpdated, EventPaymentDeleted:
		// Informational — already logged in billing_events
		return nil
	}
	return nil
}

// ── helpers ───────────────────────────────────────────────────────────────────

func webhookAsaasID(wh *AsaasWebhook) string {
	if wh.Payment != nil && wh.Payment.ID != "" {
		return wh.Payment.ID
	}
	if wh.Subscription != nil && wh.Subscription.ID != "" {
		return wh.Subscription.ID
	}
	return ""
}

func nextPeriodEnd(dueDate string, months int) time.Time {
	if dueDate != "" {
		if d, err := time.Parse("2006-01-02", dueDate); err == nil {
			return d.AddDate(0, months, 0)
		}
	}
	return time.Now().AddDate(0, months, 0)
}

func capitalize(s string) string {
	if s == "" {
		return s
	}
	r := []rune(s)
	r[0] = unicode.ToUpper(r[0])
	return string(r)
}

