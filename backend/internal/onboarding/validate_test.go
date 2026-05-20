package onboarding

import (
	"strings"
	"testing"
)

func TestSetupRequestValidate(t *testing.T) {
	// Helper to build a fully valid request, then override fields for each sub-test.
	validReq := func() *SetupRequest {
		return &SetupRequest{
			TenantSlug:    "a-valid-slug",
			TenantName:    "Minha Revenda",
			TenantEmail:   "user@example.com",
			PhoneWhatsApp: "11999999999",
			UserName:      "João Silva",
		}
	}

	t.Run("empty slug returns error", func(t *testing.T) {
		r := validReq()
		r.TenantSlug = ""
		if err := r.validate(); err == nil {
			t.Fatal("expected error for empty slug, got nil")
		}
	})

	t.Run("slug UPPERCASE fails regex", func(t *testing.T) {
		r := validReq()
		r.TenantSlug = "UPPERCASE"
		if err := r.validate(); err == nil {
			t.Fatal("expected error for uppercase slug, got nil")
		}
	})

	t.Run("slug with only 2 chars fails regex (min 3 required)", func(t *testing.T) {
		r := validReq()
		r.TenantSlug = "ab"
		if err := r.validate(); err == nil {
			t.Fatal("expected error for slug of length 2, got nil")
		}
	})

	t.Run("slug with 3 chars passes regex", func(t *testing.T) {
		r := validReq()
		r.TenantSlug = "abc"
		if err := r.validate(); err != nil {
			// The regex is ^[a-z0-9][a-z0-9\-]{1,48}[a-z0-9]$ which requires
			// at least 3 characters total. "abc" has 3 chars and should match.
			t.Fatalf("expected no slug error for 'abc', got %v", err)
		}
	})

	t.Run("a-valid-slug passes slug check", func(t *testing.T) {
		r := validReq()
		r.TenantSlug = "a-valid-slug"
		if err := r.validate(); err != nil {
			t.Fatalf("expected no error for valid slug, got %v", err)
		}
	})

	t.Run("invalid email returns error", func(t *testing.T) {
		r := validReq()
		r.TenantEmail = "notanemail"
		if err := r.validate(); err == nil {
			t.Fatal("expected error for invalid email, got nil")
		}
	})

	t.Run("valid email passes", func(t *testing.T) {
		r := validReq()
		r.TenantEmail = "user@example.com"
		if err := r.validate(); err != nil {
			t.Fatalf("expected no email error, got %v", err)
		}
	})

	t.Run("tenant_name longer than 120 chars returns error", func(t *testing.T) {
		r := validReq()
		r.TenantName = strings.Repeat("a", 121)
		if err := r.validate(); err == nil {
			t.Fatal("expected error for tenant_name > 120 chars, got nil")
		}
	})

	t.Run("fully valid request returns nil", func(t *testing.T) {
		r := validReq()
		if err := r.validate(); err != nil {
			t.Fatalf("expected nil error for valid request, got %v", err)
		}
	})

	t.Run("empty tenant_name returns error", func(t *testing.T) {
		r := validReq()
		r.TenantName = ""
		if err := r.validate(); err == nil {
			t.Fatal("expected error for empty tenant_name, got nil")
		}
	})

	t.Run("empty phone_whatsapp returns error", func(t *testing.T) {
		r := validReq()
		r.PhoneWhatsApp = ""
		if err := r.validate(); err == nil {
			t.Fatal("expected error for empty phone_whatsapp, got nil")
		}
	})

	t.Run("empty user_name returns error", func(t *testing.T) {
		r := validReq()
		r.UserName = ""
		if err := r.validate(); err == nil {
			t.Fatal("expected error for empty user_name, got nil")
		}
	})
}
