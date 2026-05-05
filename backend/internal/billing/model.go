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
}

type SubscribeRequest struct {
	PlanName     string `json:"plan_name"` // "starter"|"pro"|"premium"
	BillingCycle string `json:"billing_cycle"` // "monthly"|"yearly"
	CPFOrCNPJ    string `json:"cpf_or_cnpj,omitempty"`
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
	Customer        string  `json:"customer"`
	BillingType     string  `json:"billingType"` // "BOLETO"|"PIX"|"CREDIT_CARD"
	Value           float64 `json:"value"`
	NextDueDate     string  `json:"nextDueDate"` // "YYYY-MM-DD"
	Cycle           string  `json:"cycle"`       // "MONTHLY"|"YEARLY"
	Description     string  `json:"description"`
	ExternalRef     string  `json:"externalReference,omitempty"`
	MaxPayments     *int    `json:"maxPayments,omitempty"`
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
	Event   string         `json:"event"`
	Payment *AsaasPayment  `json:"payment,omitempty"`
}

type AsaasPayment struct {
	ID           string  `json:"id"`
	Customer     string  `json:"customer"`
	Subscription string  `json:"subscription"`
	Value        float64 `json:"value"`
	Status       string  `json:"status"`
	DueDate      string  `json:"dueDate"`
}

// Asaas payment statuses
const (
	AsaasStatusReceived  = "RECEIVED"
	AsaasStatusConfirmed = "CONFIRMED"
	AsaasStatusOverdue   = "OVERDUE"
	AsaasStatusDeleted   = "DELETED"
	AsaasStatusRefunded  = "REFUNDED"
)

// Asaas webhook events
const (
	EventPaymentReceived  = "PAYMENT_RECEIVED"
	EventPaymentConfirmed = "PAYMENT_CONFIRMED"
	EventPaymentOverdue   = "PAYMENT_OVERDUE"
	EventPaymentDeleted   = "PAYMENT_DELETED"
	EventSubCanceled      = "SUBSCRIPTION_CANCELED"
)
