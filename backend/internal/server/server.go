package server

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"revendaclick/backend/internal/config"
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
	userH       := users.NewHandler(users.NewService(users.NewRepository(pool)))
	planH       := plans.NewHandler(plans.NewService(plans.NewRepository(pool)))
	onboardingH := onboarding.NewHandler(pool)

	jwtAuth       := appMiddleware.JWTAuth(cfg.SupabaseJWTSecret)
	resolveTenant := appMiddleware.TenantResolver(pool)
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

	// ── Protected routes ──────────────────────────────────────────────────────
	api := r.Group("/api")
	api.Use(jwtAuth, resolveTenant)
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

		// Onboarding
		api.GET("/onboarding", onboardingH.Get)
		api.PUT("/onboarding", onboardingH.Update)
	}

	return r
}
