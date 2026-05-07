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
	r.Use(appMiddleware.RateLimit(20, 60)) // 20 rps sustained, 60 burst per IP
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

	jwtAuth       := appMiddleware.JWTAuth(cfg.SupabaseJWTSecret, cfg.SupabaseECKey)
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

	// ── Protected routes — billing/tenant/usage always accessible ────────────
	free := r.Group("/api")
	free.Use(jwtAuth, resolveTenant)
	{
		// Tenant info (needed to render dashboard header)
		free.GET("/tenants/me", tenantH.GetMe)
		free.PUT("/tenants/me", ownerAdmin, tenantH.UpdateMe)

		// Usage always readable (powers dashboard KPIs + PlanAlertBanner)
		free.GET("/usage", planH.GetUsage)

		// Onboarding checklist always readable/writable
		free.GET("/onboarding", onboardingH.Get)
		free.PUT("/onboarding", onboardingH.Update)

		// Billing routes always accessible so tenant can pay
		free.GET("/billing/subscription", billingH.GetSubscription)
		free.POST("/billing/subscribe", ownerAdmin, billingH.Subscribe)
		free.DELETE("/billing/subscription", ownerAdmin, billingH.Cancel)
		free.POST("/billing/reactivate", ownerAdmin, billingH.Reactivate)
		free.GET("/billing/invoices", billingH.ListInvoices)
	}

	// ── Gated routes — blocked when subscription past_due/canceled ───────────
	gated := r.Group("/api")
	gated.Use(jwtAuth, resolveTenant, subGate)
	{
		// Vehicles
		gated.GET("/vehicles", vehicleH.List)
		gated.POST("/vehicles", vehicleH.Create)
		gated.GET("/vehicles/:id", vehicleH.Get)
		gated.PUT("/vehicles/:id", vehicleH.Update)
		gated.DELETE("/vehicles/:id", ownerAdmin, vehicleH.Delete)

		// Leads
		gated.GET("/leads", leadH.List)
		gated.POST("/leads", leadH.Create)
		gated.GET("/leads/:id", leadH.Get)
		gated.PUT("/leads/:id", leadH.Update)
		gated.DELETE("/leads/:id", ownerAdmin, leadH.Delete)
		gated.GET("/leads/:id/activities", leadH.ListActivities)
		gated.POST("/leads/:id/activities", leadH.AddActivity)

		// Users
		gated.GET("/users/sellers", userH.ListSellers)
		gated.GET("/users", ownerAdmin, userH.List)
		gated.POST("/users", ownerAdmin, userH.Create)
		gated.GET("/users/:id", userH.Get)
		gated.PUT("/users/:id", userH.Update)
		gated.DELETE("/users/:id", ownerAdmin, userH.Delete)

		// Customers
		gated.GET("/customers", customerH.List)
		gated.POST("/customers", customerH.Create)
		gated.GET("/customers/:id", customerH.Get)
		gated.PUT("/customers/:id", customerH.Update)
		gated.DELETE("/customers/:id", ownerAdmin, customerH.Delete)

		// Financial entries
		gated.GET("/financial/entries", financialH.ListEntries)
		gated.POST("/financial/entries", financialH.CreateEntry)
		gated.GET("/financial/cash-flow", financialH.GetCashFlow)

		// Sales (blocked when past_due/canceled — protects revenue)
		gated.GET("/sales", financialH.ListSales)
		gated.POST("/sales", financialH.CreateSale)
		gated.GET("/sales/:id", financialH.GetSale)
		gated.POST("/sales/:id/complete", ownerAdmin, financialH.CompleteSale)
		gated.POST("/sales/:id/cancel", ownerAdmin, financialH.CancelSale)

		// Commissions
		gated.GET("/commissions", financialH.ListCommissions)

		// AI (OpenRouter)
		gated.POST("/ai/suggest-reply", aiH.SuggestReply)
		gated.POST("/ai/classify-lead", aiH.ClassifyLead)

		// Evolution WhatsApp (blocked when subscription inactive)
		gated.GET("/evolution/status", evolutionH.GetStatus)
		gated.GET("/evolution/qr", evolutionH.GetQR)
		gated.POST("/evolution/connect", ownerAdmin, evolutionH.Connect)
		gated.DELETE("/evolution/disconnect", ownerAdmin, evolutionH.Disconnect)
	}

	return r
}
