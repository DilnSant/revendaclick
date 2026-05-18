package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PlanGate returns a middleware that blocks access if the tenant's current plan
// does not include the specified feature flag (from plans.features JSONB array).
//
// Features defined in seed data:
//   marketplace, whatsapp_button, lead_capture, crm, kanban,
//   custom_domain, analytics, priority_support, api_access, white_label
//
// Usage: planGate("analytics"), planGate("api_access")
func PlanGate(pool *pgxpool.Pool, feature string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantID := c.GetString(CtxTenantID)
		if tenantID == "" {
			c.Next()
			return
		}

		var hasFeature bool
		err := pool.QueryRow(c.Request.Context(), `
			SELECT EXISTS (
				SELECT 1
				FROM subscriptions s
				JOIN plans p ON p.id = s.plan_id
				WHERE s.tenant_id      = $1
				  AND s.status         IN ('active', 'trialing')
				  AND p.features       @> to_jsonb($2::text)
			)`, tenantID, feature,
		).Scan(&hasFeature)

		if err != nil || !hasFeature {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": gin.H{
					"code":    "feature_not_available",
					"feature": feature,
					"message": "Este recurso não está disponível no seu plano. Faça upgrade para continuar.",
				},
			})
			return
		}
		c.Next()
	}
}
