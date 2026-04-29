package server

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"

	"revendaclick/backend/internal/config"
	"revendaclick/backend/internal/leads"
	appMiddleware "revendaclick/backend/internal/middleware"
	"revendaclick/backend/internal/onboarding"
	"revendaclick/backend/internal/plans"
	"revendaclick/backend/internal/tenant"
	"revendaclick/backend/internal/users"
	"revendaclick/backend/internal/vehicles"
)

func New(cfg *config.Config, pool *pgxpool.Pool, logger *slog.Logger) http.Handler {
	r := chi.NewRouter()

	// ─── Global middleware ────────────────────────────────────────────────────
	r.Use(chiMiddleware.RealIP)
	r.Use(appMiddleware.Recover(logger))
	r.Use(appMiddleware.Logger(logger))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	r.Use(chiMiddleware.Compress(5))

	// ─── Module initialization ────────────────────────────────────────────────
	tenantH    := tenant.NewHandler(tenant.NewService(tenant.NewRepository(pool)))
	vehicleH   := vehicles.NewHandler(vehicles.NewService(vehicles.NewRepository(pool)))
	leadH      := leads.NewHandler(leads.NewService(leads.NewRepository(pool)))
	userH      := users.NewHandler(users.NewService(users.NewRepository(pool)))
	planH      := plans.NewHandler(plans.NewService(plans.NewRepository(pool)))
	onboardingH := onboarding.NewHandler(pool)

	ownerAdmin := appMiddleware.RequireRole("owner", "admin")
	jwtAuth    := appMiddleware.JWTAuth(cfg.SupabaseJWTSecret)
	resolveTenant := appMiddleware.TenantResolver(pool)

	// ─── Health ───────────────────────────────────────────────────────────────
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	// ─── Public routes (no JWT) ───────────────────────────────────────────────
	r.Route("/api/public/{slug}", func(r chi.Router) {
		r.Use(appMiddleware.SlugTenantResolver(pool))
		r.Get("/", tenantH.GetPublic)
		r.Get("/vehicles", vehicleH.ListPublic)
		r.Get("/vehicles/{vehicleSlug}", vehicleH.GetPublic)
		r.Post("/leads", leadH.Create)
	})

	// Plans are public (pricing page)
	r.Get("/api/plans", planH.ListPlans)

	// ─── Protected routes ─────────────────────────────────────────────────────
	r.Group(func(r chi.Router) {
		r.Use(jwtAuth, resolveTenant)

		// Tenant
		r.Get("/api/tenants/me", tenantH.GetMe)
		r.With(ownerAdmin).Put("/api/tenants/me", tenantH.UpdateMe)

		// Vehicles
		r.Route("/api/vehicles", func(r chi.Router) {
			r.Get("/", vehicleH.List)
			r.Post("/", vehicleH.Create)
			r.Get("/{id}", vehicleH.Get)
			r.Put("/{id}", vehicleH.Update)
			r.With(ownerAdmin).Delete("/{id}", vehicleH.Delete)
		})

		// Leads
		r.Route("/api/leads", func(r chi.Router) {
			r.Get("/", leadH.List)
			r.Post("/", leadH.Create)
			r.Get("/{id}", leadH.Get)
			r.Put("/{id}", leadH.Update)
			r.With(ownerAdmin).Delete("/{id}", leadH.Delete)
			r.Get("/{id}/activities", leadH.ListActivities)
			r.Post("/{id}/activities", leadH.AddActivity)
		})

		// Users
		r.Route("/api/users", func(r chi.Router) {
			r.Get("/sellers", userH.ListSellers)
			r.With(ownerAdmin).Get("/", userH.List)
			r.With(ownerAdmin).Post("/", userH.Create)
			r.Get("/{id}", userH.Get)
			r.Put("/{id}", userH.Update)
			r.With(ownerAdmin).Delete("/{id}", userH.Delete)
		})

		// Usage / Plans
		r.Get("/api/usage", planH.GetUsage)

		// Onboarding
		r.Get("/api/onboarding", onboardingH.Get)
		r.Put("/api/onboarding", onboardingH.Update)
	})

	return r
}
