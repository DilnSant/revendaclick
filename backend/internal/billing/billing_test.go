package billing

import (
	"testing"
	"time"
)

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
