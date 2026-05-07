package billing

import "time"

// ── Internal subscription record ──────────────────────────────────────────────

type Subscription struct {
	ID                  string     `json:"id"`
	TenantID            string     `json:"tenant_id"`
	PlanID              string     `json:"plan_id"`
	PlanName            string     `json:"plan_name"`
	PlanDisplay         string     `json:"plan_display"`
	Status              string     `json:"status"`
	BillingCycle        string     `json:"billing_cycle"`
	CurrentPeriodEnd    time.Time  `json:"current_period_end"`
	TrialEndsAt         *time.Time `json:"trial_ends_at,omitempty"`
	GraceUntil          *time.Time `json:"grace_until,omitempty"`
	AsaasSubscriptionID string     `json:"asaas_subscription_id,omitempty"`
	AsaasPaymentLink    string     `json:"asaas_payment_link,omitempty"`
	PriceMonthly        float64    `json:"price_monthly"`
	PriceYearly         float64    `json:"price_yearly"`
	// Computed helpers
	TrialDaysLeft int    `json:"trial_days_left,omitempty"`
	IsTrialing    bool   `json:"is_trialing"`
	IsActive      bool   `json:"is_active"`
	IsPastDue     bool   `json:"is_past_due"`
	IsCanceled    bool   `json:"is_canceled"`
	IsBlocked     bool   `json:"is_blocked"`
}

func (s *Subscription) ComputeFlags() {
	s.IsTrialing = s.Status == "trialing"
	s.IsActive   = s.Status == "active"
	s.IsPastDue  = s.Status == "past_due"
	s.IsCanceled = s.Status == "canceled" || s.Status == "paused"
	s.IsBlocked  = s.IsCanceled || (s.IsPastDue && (s.GraceUntil == nil || time.Now().After(*s.GraceUntil)))

	if s.TrialEndsAt != nil && s.IsTrialing {
		d := time.Until(*s.TrialEndsAt)
		if d > 0 {
			s.TrialDaysLeft = int(d.Hours()/24) + 1
		}
	}
}

type SubscribeRequest struct {
	PlanName     string `json:"plan_name"`    // "starter"|"pro"|"premium"|"enterprise"
	BillingCycle string `json:"billing_cycle"` // "monthly"|"yearly"
	BillingType  string `json:"billing_type"`  // "BOLETO"|"PIX"|"CREDIT_CARD" (default BOLETO)
	CPFOrCNPJ    string `json:"cpf_or_cnpj,omitempty"`
}

// ── Invoice ───────────────────────────────────────────────────────────────────

type Invoice struct {
	ID              string    `json:"id"`
	AsaasPaymentID  string    `json:"asaas_payment_id"`
	Value           float64   `json:"value"`
	Status          string    `json:"status"`
	BillingType     string    `json:"billing_type,omitempty"`
	DueDate         string    `json:"due_date,omitempty"`
	PaidAt          *time.Time `json:"paid_at,omitempty"`
	InvoiceURL      string    `json:"invoice_url,omitempty"`
	Description     string    `json:"description,omitempty"`
}

// ── Asaas API types ───────────────────────────────────────────────────────────

type asaasCustomerReq struct {
	Name        string `json:"name"`
	Email       string `json:"email"`
	Phone       string `json:"phone,omitempty"`
	CPFOrCNPJ   string `json:"cpfCnpj,omitempty"`
	ExternalRef string `json:"externalReference,omitempty"`
}

type asaasCustomerResp struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type asaasSubscriptionReq struct {
	Customer    string  `json:"customer"`
	BillingType string  `json:"billingType"` // "BOLETO"|"PIX"|"CREDIT_CARD"
	Value       float64 `json:"value"`
	NextDueDate string  `json:"nextDueDate"` // "YYYY-MM-DD"
	Cycle       string  `json:"cycle"`       // "MONTHLY"|"YEARLY"
	Description string  `json:"description"`
	ExternalRef string  `json:"externalReference,omitempty"`
	MaxPayments *int    `json:"maxPayments,omitempty"`
}

type asaasSubscriptionResp struct {
	ID          string  `json:"id"`
	Status      string  `json:"status"`
	Value       float64 `json:"value"`
	Cycle       string  `json:"cycle"`
	PaymentLink string  `json:"paymentLink,omitempty"`
}

// ── Asaas webhook payload ─────────────────────────────────────────────────────

type AsaasWebhook struct {
	Event        string            `json:"event"`
	Payment      *AsaasPayment     `json:"payment,omitempty"`
	Subscription *AsaasSubEvent    `json:"subscription,omitempty"`
}

type AsaasPayment struct {
	ID              string  `json:"id"`
	Customer        string  `json:"customer"`
	Subscription    string  `json:"subscription"`
	Value           float64 `json:"value"`
	Status          string  `json:"status"`
	DueDate         string  `json:"dueDate"`
	BillingType     string  `json:"billingType"`
	InvoiceURL      string  `json:"invoiceUrl,omitempty"`
	BankSlipURL     string  `json:"bankSlipUrl,omitempty"`
	PixQRCode       string  `json:"pixQrCodeImage,omitempty"`
	PixCopyPaste    string  `json:"pixCopiaECola,omitempty"`
	Description     string  `json:"description,omitempty"`
}

type AsaasSubEvent struct {
	ID     string `json:"id"`
	Status string `json:"status"`
	Cycle  string `json:"cycle"`
}

// Asaas webhook events
const (
	EventPaymentReceived  = "PAYMENT_RECEIVED"
	EventPaymentConfirmed = "PAYMENT_CONFIRMED"
	EventPaymentOverdue   = "PAYMENT_OVERDUE"
	EventPaymentDeleted   = "PAYMENT_DELETED"
	EventSubCreated       = "SUBSCRIPTION_CREATED"
	EventSubUpdated       = "SUBSCRIPTION_UPDATED"
	EventSubDeleted       = "SUBSCRIPTION_DELETED"
	EventSubCanceled      = "SUBSCRIPTION_CANCELED"
)
