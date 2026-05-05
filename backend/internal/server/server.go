package server

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"revendaclick/backend/internal/ai"
	"revendaclick/backend/internal/billing"
	"revendaclick/backend/internal/config"
	"revendaclick/backend/internal/customers"
	"revendaclick/backend/internal/evolution"
	"revendaclick/backend/internal/financial"
	"revendaclick/backend/internal/leads"
	appMiddleware "revendaclick/backend/internal/middleware"
	"revendaclick/backend/internal/onboarding"
	"revendaclick/backend/internal/plans"
	"revendaclick/backend/internal/tenant"
	"revendaclick/backend/internal/users"
	"revendaclick/backend/internal/vehicles"
)

func New(cfg *config.Config, pool *pgxpool.Pool, logger *zap.Logger) http.Handler {
	if cfg.IsProd() {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// ── Global middleware ─────────────────────────────────────────────────────
	r.Use(gin.Recovery())
	r.Use(appMiddleware.ZapLogger(logger))
	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300 * time.Second,
	}))

	// ── Module initialization ─────────────────────────────────────────────────
	tenantH     := tenant.NewHandler(tenant.NewService(tenant.NewRepository(pool)))
	vehicleH    := vehicles.NewHandler(vehicles.NewService(vehicles.NewRepository(pool)))
	leadH       := leads.NewHandler(leads.NewService(leads.NewRepository(pool)))
	customerH   := customers.NewHandler(customers.NewService(customers.NewRepository(pool)))
	userH       := users.NewHandler(users.NewService(users.NewRepository(pool)))
	planH       := plans.NewHandler(plans.NewService(plans.NewRepository(pool)))
	financialH  := financial.NewHandler(financial.NewService(financial.NewRepository(pool)))
	onboardingH := onboarding.NewHandler(pool)
	evolutionH  := evolution.NewHandler(
		evolution.NewService(pool, logger, cfg.EvolutionAPIURL, cfg.EvolutionAPIKey),
		cfg.EvolutionAPIKey,
		logger,
	)
	aiH      := ai.NewHandler(ai.NewService(cfg.OpenRouterAPIKey, cfg.OpenRouterModel))
	billingH := billing.NewHandler(
		billing.NewService(billing.NewRepository(pool), cfg.AsaasAPIKey, cfg.AsaasEnv),
		cfg.AsaasAPIKey,
	)

	jwtAuth       := appMiddleware.JWTAuth(cfg.SupabaseJWTSecret)
	resolveTenant := appMiddleware.TenantResolver(pool)
	subGate       := appMiddleware.SubscriptionGate(pool)
	ownerAdmin    := appMiddleware.RequireRole("owner", "admin")

	// ── Health ───────────────────────────────────────────────────────────────
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	r.GET("/api/v1/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "version": "1"})
	})

	// ── Public routes (no JWT) ────────────────────────────────────────────────
	public := r.Group("/api/public/:slug")
	public.Use(appMiddleware.SlugTenantResolver(pool))
	{
		public.GET("/", tenantH.GetPublic)
		public.GET("/vehicles", vehicleH.ListPublic)
		public.GET("/vehicles/:vehicleSlug", vehicleH.GetPublic)
		public.POST("/leads", leadH.Create)
	}

	// Plans are public (pricing page)
	r.GET("/api/plans", planH.ListPlans)

	// ── Webhooks (public — validated by token headers) ───────────────────────
	r.POST("/api/webhooks/evolution", evolutionH.Webhook)
	r.POST("/api/webhooks/asaas", billingH.Webhook)

	// ── Onboarding setup — JWT auth only, no tenant required ─────────────────
	setup := r.Group("/api")
	setup.Use(jwtAuth)
	{
		setup.POST("/onboarding/setup", onboardingH.Setup)
	}

	// ── Protected routes ──────────────────────────────────────────────────────
	api := r.Group("/api")
	api.Use(jwtAuth, resolveTenant, subGate)
	{
		// Tenant
		api.GET("/tenants/me", tenantH.GetMe)
		api.PUT("/tenants/me", ownerAdmin, tenantH.UpdateMe)

		// Vehicles
		api.GET("/vehicles", vehicleH.List)
		api.POST("/vehicles", vehicleH.Create)
		api.GET("/vehicles/:id", vehicleH.Get)
		api.PUT("/vehicles/:id", vehicleH.Update)
		api.DELETE("/vehicles/:id", ownerAdmin, vehicleH.Delete)

		// Leads
		api.GET("/leads", leadH.List)
		api.POST("/leads", leadH.Create)
		api.GET("/leads/:id", leadH.Get)
		api.PUT("/leads/:id", leadH.Update)
		api.DELETE("/leads/:id", ownerAdmin, leadH.Delete)
		api.GET("/leads/:id/activities", leadH.ListActivities)
		api.POST("/leads/:id/activities", leadH.AddActivity)

		// Users
		api.GET("/users/sellers", userH.ListSellers)
		api.GET("/users", ownerAdmin, userH.List)
		api.POST("/users", ownerAdmin, userH.Create)
		api.GET("/users/:id", userH.Get)
		api.PUT("/users/:id", userH.Update)
		api.DELETE("/users/:id", ownerAdmin, userH.Delete)

		// Usage / Plans
		api.GET("/usage", planH.GetUsage)

		// Customers
		api.GET("/customers", customerH.List)
		api.POST("/customers", customerH.Create)
		api.GET("/customers/:id", customerH.Get)
		api.PUT("/customers/:id", customerH.Update)
		api.DELETE("/customers/:id", ownerAdmin, customerH.Delete)

		// Onboarding
		api.GET("/onboarding", onboardingH.Get)
		api.PUT("/onboarding", onboardingH.Update)

		// Financial entries
		api.GET("/financial/entries", financialH.ListEntries)
		api.POST("/financial/entries", financialH.CreateEntry)
		api.GET("/financial/cash-flow", financialH.GetCashFlow)

		// Sales
		api.GET("/sales", financialH.ListSales)
		api.POST("/sales", financialH.CreateSale)
		api.GET("/sales/:id", financialH.GetSale)
		api.POST("/sales/:id/complete", ownerAdmin, financialH.CompleteSale)
		api.POST("/sales/:id/cancel", ownerAdmin, financialH.CancelSale)

		// Commissions
		api.GET("/commissions", financialH.ListCommissions)

		// AI (OpenRouter)
		api.POST("/ai/suggest-reply", aiH.SuggestReply)
		api.POST("/ai/classify-lead", aiH.ClassifyLead)

		// Billing
		api.GET("/billing/subscription", billingH.GetSubscription)
		api.POST("/billing/subscribe", ownerAdmin, billingH.Subscribe)
	}

	return r
}
