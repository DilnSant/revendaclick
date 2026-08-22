package billing

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestWebhookFailsClosedWhenTokenNotConfigured(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &Handler{asaasToken: ""}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/billing/webhook", strings.NewReader(`{}`))

	h.Webhook(c)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500 when ASAAS_WEBHOOK_TOKEN is unset (fail closed), got %d", w.Code)
	}
}

func TestWebhookRejectsInvalidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &Handler{asaasToken: "correct-token"}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/billing/webhook", strings.NewReader(`{}`))
	c.Request.Header.Set("asaas-access-token", "wrong-token")

	h.Webhook(c)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for invalid token, got %d", w.Code)
	}
}

func TestComputeFlags(t *testing.T) {
	t.Run("active subscription", func(t *testing.T) {
		s := &Subscription{Status: "active"}
		s.ComputeFlags()
		if !s.IsActive {
			t.Error("expected IsActive=true")
		}
		if s.IsBlocked {
			t.Error("expected IsBlocked=false")
		}
		if s.IsTrialing {
			t.Error("expected IsTrialing=false")
		}
		if s.IsPastDue {
			t.Error("expected IsPastDue=false")
		}
		if s.IsCanceled {
			t.Error("expected IsCanceled=false")
		}
	})

	t.Run("trialing with future TrialEndsAt", func(t *testing.T) {
		future := time.Now().Add(5 * 24 * time.Hour)
		s := &Subscription{Status: "trialing", TrialEndsAt: &future}
		s.ComputeFlags()
		if !s.IsTrialing {
			t.Error("expected IsTrialing=true")
		}
		if s.TrialDaysLeft <= 0 {
			t.Errorf("expected TrialDaysLeft>0, got %d", s.TrialDaysLeft)
		}
		if s.IsBlocked {
			t.Error("expected IsBlocked=false")
		}
	})

	t.Run("trialing expired", func(t *testing.T) {
		past := time.Now().Add(-1 * time.Hour)
		s := &Subscription{Status: "trialing", TrialEndsAt: &past}
		s.ComputeFlags()
		if !s.IsTrialing {
			t.Error("expected IsTrialing=true")
		}
		if s.TrialDaysLeft != 0 {
			t.Errorf("expected TrialDaysLeft=0, got %d", s.TrialDaysLeft)
		}
	})

	t.Run("past_due within grace period", func(t *testing.T) {
		grace := time.Now().Add(24 * time.Hour)
		s := &Subscription{Status: "past_due", GraceUntil: &grace}
		s.ComputeFlags()
		if !s.IsPastDue {
			t.Error("expected IsPastDue=true")
		}
		if s.IsBlocked {
			t.Error("expected IsBlocked=false (within grace period)")
		}
	})

	t.Run("past_due with expired grace", func(t *testing.T) {
		expired := time.Now().Add(-24 * time.Hour)
		s := &Subscription{Status: "past_due", GraceUntil: &expired}
		s.ComputeFlags()
		if !s.IsPastDue {
			t.Error("expected IsPastDue=true")
		}
		if !s.IsBlocked {
			t.Error("expected IsBlocked=true (grace expired)")
		}
	})

	t.Run("past_due with nil grace", func(t *testing.T) {
		s := &Subscription{Status: "past_due"}
		s.ComputeFlags()
		if !s.IsPastDue {
			t.Error("expected IsPastDue=true")
		}
		if !s.IsBlocked {
			t.Error("expected IsBlocked=true (no grace set)")
		}
	})

	t.Run("canceled", func(t *testing.T) {
		s := &Subscription{Status: "canceled"}
		s.ComputeFlags()
		if !s.IsCanceled {
			t.Error("expected IsCanceled=true")
		}
		if !s.IsBlocked {
			t.Error("expected IsBlocked=true")
		}
	})

	t.Run("paused counts as canceled", func(t *testing.T) {
		s := &Subscription{Status: "paused"}
		s.ComputeFlags()
		if !s.IsCanceled {
			t.Error("expected IsCanceled=true for paused status")
		}
		if !s.IsBlocked {
			t.Error("expected IsBlocked=true for paused status")
		}
	})
}

func TestWebhookAsaasID(t *testing.T) {
	cases := []struct {
		name string
		wh   AsaasWebhook
		want string
	}{
		{
			name: "payment ID present",
			wh:   AsaasWebhook{Payment: &AsaasPayment{ID: "pay_123"}},
			want: "pay_123",
		},
		{
			name: "subscription ID present, no payment",
			wh:   AsaasWebhook{Subscription: &AsaasSubEvent{ID: "sub_456"}},
			want: "sub_456",
		},
		{
			name: "both present — payment wins",
			wh:   AsaasWebhook{Payment: &AsaasPayment{ID: "pay_789"}, Subscription: &AsaasSubEvent{ID: "sub_000"}},
			want: "pay_789",
		},
		{
			name: "neither present",
			wh:   AsaasWebhook{},
			want: "",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := webhookAsaasID(&tc.wh)
			if got != tc.want {
				t.Errorf("got %q, want %q", got, tc.want)
			}
		})
	}
}

func TestAsaasUserErr(t *testing.T) {
	cases := []struct {
		name string
		raw  string
		want string
	}{
		{
			name: "IP whitelist error",
			raw:  "Error: not_allowed_ip",
			want: "IP do servidor não autorizado no Asaas. Acesse o painel Asaas → API → Whitelist de IPs e adicione o IP do servidor.",
		},
		{
			name: "generic error passes through",
			raw:  "some other asaas error",
			want: "some other asaas error",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := asaasUserErr(tc.raw)
			if got != tc.want {
				t.Errorf("got %q, want %q", got, tc.want)
			}
		})
	}
}

func TestCapitalize(t *testing.T) {
	cases := []struct {
		name string
		in   string
		want string
	}{
		{name: "normal string", in: "hello", want: "Hello"},
		{name: "already capitalized", in: "World", want: "World"},
		{name: "single char", in: "a", want: "A"},
		{name: "empty string", in: "", want: ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := capitalize(tc.in)
			if got != tc.want {
				t.Errorf("got %q, want %q", got, tc.want)
			}
		})
	}
}

func TestWebhookEventKey(t *testing.T) {
	wh := &AsaasWebhook{
		Event:   "PAYMENT_RECEIVED",
		Payment: &AsaasPayment{ID: "pay_abc"},
	}
	asaasID := webhookAsaasID(wh)
	key := fmt.Sprintf("%s:%s", wh.Event, asaasID)
	want := "PAYMENT_RECEIVED:pay_abc"
	if key != want {
		t.Errorf("got %q, want %q", key, want)
	}
}

func TestNextPeriodEnd(t *testing.T) {
	t.Run("valid date adds 1 month", func(t *testing.T) {
		result := nextPeriodEnd("2025-06-15", 1)
		want := time.Date(2025, 7, 15, 0, 0, 0, 0, time.UTC)
		if !result.Equal(want) {
			t.Errorf("expected %v, got %v", want, result)
		}
	})

	t.Run("empty date returns future time around 1 month from now", func(t *testing.T) {
		before := time.Now().Add(29 * 24 * time.Hour)
		result := nextPeriodEnd("", 1)
		after := time.Now().Add(32 * 24 * time.Hour)
		if result.Before(before) || result.After(after) {
			t.Errorf("expected result ~1 month from now, got %v", result)
		}
	})

	t.Run("invalid date returns future time around 1 month from now", func(t *testing.T) {
		before := time.Now().Add(29 * 24 * time.Hour)
		result := nextPeriodEnd("not-a-date", 1)
		after := time.Now().Add(32 * 24 * time.Hour)
		if result.Before(before) || result.After(after) {
			t.Errorf("expected result ~1 month from now, got %v", result)
		}
	})
}
