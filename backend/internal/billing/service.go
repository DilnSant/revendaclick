package billing

import (
	"context"
	"fmt"
	"strings"
	"time"
)

type Service struct {
	repo   *Repository
	asaas  *asaasClient
}

func NewService(repo *Repository, asaasKey, asaasEnv string) *Service {
	return &Service{
		repo:  repo,
		asaas: newAsaasClient(asaasKey, asaasEnv),
	}
}

func (s *Service) GetSubscription(ctx context.Context, tenantID string) (*Subscription, error) {
	return s.repo.GetSubscription(ctx, tenantID)
}

// Subscribe creates/updates an Asaas subscription for a tenant.
func (s *Service) Subscribe(ctx context.Context, tenantID string, req *SubscribeRequest) (*Subscription, error) {
	req.PlanName = strings.ToLower(strings.TrimSpace(req.PlanName))
	req.BillingCycle = strings.ToLower(strings.TrimSpace(req.BillingCycle))
	if req.BillingCycle != "yearly" {
		req.BillingCycle = "monthly"
	}

	// Resolve plan
	planID, priceMonthly, priceYearly, err := s.repo.GetPlanByName(ctx, req.PlanName)
	if err != nil || planID == "" {
		return nil, fmt.Errorf("plan not found: %s", req.PlanName)
	}
	value := priceMonthly
	cycle := "MONTHLY"
	if req.BillingCycle == "yearly" {
		value = priceYearly
		cycle = "YEARLY"
	}

	// Get or create Asaas customer
	name, email, asaasCustomerID, err := s.repo.GetAsaasCustomerID(ctx, tenantID)
	if err != nil {
		return nil, fmt.Errorf("tenant not found: %w", err)
	}
	if asaasCustomerID == "" {
		customer, cerr := s.asaas.createCustomer(name, email, "", req.CPFOrCNPJ, tenantID)
		if cerr != nil {
			return nil, fmt.Errorf("asaas create customer: %w", cerr)
		}
		asaasCustomerID = customer.ID
		if err = s.repo.SaveAsaasCustomerID(ctx, tenantID, asaasCustomerID); err != nil {
			return nil, fmt.Errorf("save customer id: %w", err)
		}
	}

	// Create Asaas subscription
	desc := fmt.Sprintf("RevendaClick — Plano %s (%s)", strings.Title(req.PlanName), strings.Title(req.BillingCycle))
	sub, err := s.asaas.createSubscription(asaasCustomerID, value, cycle, desc, tenantID)
	if err != nil {
		return nil, fmt.Errorf("asaas create subscription: %w", err)
	}

	// Get payment link
	paymentLink := sub.PaymentLink
	if paymentLink == "" {
		paymentLink, _ = s.asaas.getSubscriptionPayments(sub.ID)
	}

	// Persist
	if err = s.repo.UpdateSubscriptionAsaas(ctx, tenantID, sub.ID, paymentLink, req.BillingCycle, planID); err != nil {
		return nil, fmt.Errorf("update subscription: %w", err)
	}

	_ = priceMonthly
	_ = priceYearly

	return s.repo.GetSubscription(ctx, tenantID)
}

// HandleWebhook processes an Asaas webhook event.
func (s *Service) HandleWebhook(ctx context.Context, wh *AsaasWebhook) error {
	if wh.Payment == nil || wh.Payment.Subscription == "" {
		return nil // not subscription-related, ignore
	}
	subID := wh.Payment.Subscription

	switch wh.Event {
	case EventPaymentReceived, EventPaymentConfirmed:
		// Calculate next period end based on the payment due date
		periodEnd := time.Now().AddDate(0, 1, 0) // default: +1 month
		if wh.Payment.DueDate != "" {
			if d, err := time.Parse("2006-01-02", wh.Payment.DueDate); err == nil {
				periodEnd = d.AddDate(0, 1, 0)
			}
		}
		return s.repo.ActivateByAsaasSubID(ctx, subID, periodEnd)

	case EventPaymentOverdue:
		return s.repo.MarkPastDueByAsaasSubID(ctx, subID)

	case EventSubCanceled:
		return s.repo.CancelByAsaasSubID(ctx, subID)
	}
	return nil
}
