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

// cancelTenantAddons cancels all active add-ons in Asaas (best-effort) then bulk-cancels in DB.
// FC033 — Option A: no active subscription = no active add-ons.
func (s *Service) cancelTenantAddons(ctx context.Context, tenantID string) {
	addons, err := s.repo.ListActiveAddonIDs(ctx, tenantID)
	if err != nil || len(addons) == 0 {
		return
	}
	for _, addon := range addons {
		if addon.AsaasAddonID != "" {
			_ = s.asaas.cancelSubscription(addon.AsaasAddonID) // best-effort
		}
	}
	_ = s.repo.CancelAllAddonsByTenantID(ctx, tenantID)
}

// CancelSubscription cancels a tenant's active subscription in Asaas and DB.
// FC033: also cancels all active add-ons (Option A — no plan = no add-ons).
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
	s.cancelTenantAddons(ctx, tenantID)
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

// ActivateAddon creates an Asaas subscription for an add-on and saves it as 'pending_payment'.
// Features are NOT granted until PAYMENT_CONFIRMED fires (D1).
func (s *Service) ActivateAddon(ctx context.Context, tenantID, addonType string) (*AddonActivateResponse, error) {
	// Guard: require active or trialing main subscription
	sub, err := s.repo.GetSubscription(ctx, tenantID)
	if err != nil || sub == nil {
		return nil, fmt.Errorf("assinatura ativa não encontrada")
	}
	sub.ComputeFlags()
	if !sub.IsActive && !sub.IsTrialing {
		return nil, fmt.Errorf("assinatura deve estar ativa para contratar add-ons")
	}

	// Guard: idempotency — don't create duplicate
	existing, _ := s.repo.GetAddonByTenantAndType(ctx, tenantID, addonType)
	if existing != nil {
		return nil, fmt.Errorf("add-on já ativo ou aguardando pagamento")
	}

	// Fetch addon price
	addonPrice, err := s.repo.GetAddonPrice(ctx, addonType)
	if err != nil || addonPrice == 0 {
		return nil, fmt.Errorf("add-on não encontrado: %s", addonType)
	}

	// Fetch Asaas customer ID (created during Subscribe)
	_, _, asaasCustomerID, err := s.repo.GetAsaasCustomerID(ctx, tenantID)
	if err != nil || asaasCustomerID == "" {
		return nil, fmt.Errorf("cliente Asaas não encontrado — finalize a assinatura do plano primeiro")
	}

	// Create Asaas subscription (D2: reuse existing createSubscription)
	desc := fmt.Sprintf("RevendaClick — Add-on %s", addonType)
	externalRef := fmt.Sprintf("%s:%s", tenantID, addonType)
	asaasSub, err := s.asaas.createSubscription(asaasCustomerID, addonPrice, "MONTHLY", "BOLETO", desc, externalRef)
	if err != nil {
		return nil, fmt.Errorf("%s", asaasUserErr(err.Error()))
	}

	// Fetch payment link (D2: non-fatal if absent — Asaas sends invoice by email)
	paymentLink := asaasSub.PaymentLink
	if paymentLink == "" {
		paymentLink, _ = s.asaas.getSubscriptionPayments(asaasSub.ID)
	}

	// Save addon with status='pending_payment' (D1: activate only after PAYMENT_CONFIRMED)
	if err := s.repo.ActivateAddon(ctx, tenantID, sub.ID, addonType, asaasSub.ID, paymentLink); err != nil {
		_ = s.asaas.cancelSubscription(asaasSub.ID) // best-effort cleanup
		return nil, fmt.Errorf("erro ao salvar add-on: %w", err)
	}

	return &AddonActivateResponse{
		AddonType:   addonType,
		Status:      "pending_payment",
		PaymentLink: paymentLink,
	}, nil
}

// CancelAddon cancels an add-on in Asaas (best-effort) and marks it canceled in DB.
func (s *Service) CancelAddon(ctx context.Context, tenantID, addonType string) error {
	rec, err := s.repo.GetAddonByTenantAndType(ctx, tenantID, addonType)
	if err != nil {
		return fmt.Errorf("get addon: %w", err)
	}
	if rec == nil {
		return fmt.Errorf("add-on não encontrado ou já cancelado")
	}
	if rec.AsaasAddonID != "" {
		_ = s.asaas.cancelSubscription(rec.AsaasAddonID) // best-effort
	}
	return s.repo.CancelAddon(ctx, tenantID, addonType)
}

// HandleWebhook processes an Asaas webhook event with idempotency.
func (s *Service) HandleWebhook(ctx context.Context, wh *AsaasWebhook, rawPayload []byte) error {
	asaasID := webhookAsaasID(wh)
	if asaasID == "" {
		return nil // nothing to key on, ignore
	}

	eventKey := fmt.Sprintf("%s:%s", wh.Event, asaasID)

	tenantID := ""
	isAddon := false
	addonSubID := ""

	if wh.Payment != nil && wh.Payment.Subscription != "" {
		subID := wh.Payment.Subscription
		// Main subscription lookup first (existing behavior unchanged)
		tenantID, _ = s.repo.FindTenantByAsaasSubID(ctx, subID)
		if tenantID == "" {
			// Addon subscription lookup
			var addonType string
			tenantID, addonType, _ = s.repo.FindTenantByAsaasAddonID(ctx, subID)
			if addonType != "" {
				isAddon = true
				addonSubID = subID
			}
		}
	} else if wh.Subscription != nil && wh.Subscription.ID != "" {
		subID := wh.Subscription.ID
		tenantID, _ = s.repo.FindTenantByAsaasSubID(ctx, subID)
		if tenantID == "" {
			var addonType string
			tenantID, addonType, _ = s.repo.FindTenantByAsaasAddonID(ctx, subID)
			if addonType != "" {
				isAddon = true
				addonSubID = subID
			}
		}
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

	if isAddon {
		return s.dispatchAddonWebhookEvent(ctx, wh, addonSubID)
	}
	return s.dispatchWebhookEvent(ctx, wh, tenantID)
}

// dispatchAddonWebhookEvent routes webhook events that belong to an add-on subscription.
func (s *Service) dispatchAddonWebhookEvent(ctx context.Context, wh *AsaasWebhook, addonSubID string) error {
	switch wh.Event {
	case EventPaymentReceived, EventPaymentConfirmed:
		// D1: only grant features after payment confirmed
		return s.repo.ActivateAddonByAsaasID(ctx, addonSubID)

	case EventPaymentOverdue:
		return s.repo.MarkAddonPastDueByAsaasID(ctx, addonSubID)

	case EventPaymentRefunded:
		// Same as overdue: Asaas subscription remains active; give grace period for resolution
		return s.repo.MarkAddonPastDueByAsaasID(ctx, addonSubID)

	case EventSubCanceled, EventSubDeleted:
		subID := addonSubID
		if subID == "" && wh.Subscription != nil {
			subID = wh.Subscription.ID
		}
		return s.repo.CancelAddonByAsaasID(ctx, subID)

	case EventPaymentDeleted, EventSubCreated, EventSubUpdated:
		return nil // informational — already logged in billing_events
	}
	return nil
}

func (s *Service) dispatchWebhookEvent(ctx context.Context, wh *AsaasWebhook, tenantID string) error {
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
		if err := s.repo.CancelByAsaasSubID(ctx, subID); err != nil {
			return err
		}
		// FC033 Option A: cancel all add-ons when main subscription is canceled.
		if tenantID != "" {
			s.cancelTenantAddons(ctx, tenantID)
		}
		return nil

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

