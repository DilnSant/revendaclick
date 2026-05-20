package leads

import (
	"strings"
	"testing"
)

func TestCreateRequestValidate(t *testing.T) {
	t.Run("empty name returns error", func(t *testing.T) {
		r := &CreateRequest{Name: "", Phone: "11999999999"}
		if err := r.Validate(); err == nil {
			t.Fatal("expected error for empty name, got nil")
		}
	})

	t.Run("name longer than 120 chars returns error", func(t *testing.T) {
		r := &CreateRequest{
			Name:  strings.Repeat("a", 121),
			Phone: "11999999999",
		}
		if err := r.Validate(); err == nil {
			t.Fatal("expected error for name > 120 chars, got nil")
		}
	})

	t.Run("empty phone returns error", func(t *testing.T) {
		r := &CreateRequest{Name: "John Doe", Phone: ""}
		if err := r.Validate(); err == nil {
			t.Fatal("expected error for empty phone, got nil")
		}
	})

	t.Run("phone longer than 30 chars returns error", func(t *testing.T) {
		r := &CreateRequest{
			Name:  "John Doe",
			Phone: strings.Repeat("1", 31),
		}
		if err := r.Validate(); err == nil {
			t.Fatal("expected error for phone > 30 chars, got nil")
		}
	})

	t.Run("message longer than 2000 chars returns error", func(t *testing.T) {
		msg := strings.Repeat("x", 2001)
		r := &CreateRequest{
			Name:    "John Doe",
			Phone:   "11999999999",
			Message: &msg,
		}
		if err := r.Validate(); err == nil {
			t.Fatal("expected error for message > 2000 chars, got nil")
		}
	})

	t.Run("valid request returns nil error", func(t *testing.T) {
		msg := "Hello, I am interested."
		r := &CreateRequest{
			Name:    "John Doe",
			Phone:   "11999999999",
			Message: &msg,
		}
		if err := r.Validate(); err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
	})

	t.Run("valid request without optional fields returns nil error", func(t *testing.T) {
		r := &CreateRequest{
			Name:  "Jane Doe",
			Phone: "11888888888",
		}
		if err := r.Validate(); err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
	})

	t.Run("name exactly 120 chars is valid", func(t *testing.T) {
		r := &CreateRequest{
			Name:  strings.Repeat("a", 120),
			Phone: "11999999999",
		}
		if err := r.Validate(); err != nil {
			t.Fatalf("expected nil error for name=120 chars, got %v", err)
		}
	})

	t.Run("message exactly 2000 chars is valid", func(t *testing.T) {
		msg := strings.Repeat("x", 2000)
		r := &CreateRequest{
			Name:    "John Doe",
			Phone:   "11999999999",
			Message: &msg,
		}
		if err := r.Validate(); err != nil {
			t.Fatalf("expected nil error for message=2000 chars, got %v", err)
		}
	})
}
