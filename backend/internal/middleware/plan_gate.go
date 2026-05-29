package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PlanGate returns a middleware that blocks access if the tenant's current plan
// does not include the specified feature flag.
//
// Access is granted when EITHER:
//   (a) the tenant's active/trialing subscription plan includes the feature, OR
//   (b) a tenant_features override grants the feature explicitly (admin-granted).
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
				-- Plan-level feature (subscription must be active or trialing)
				SELECT 1
				FROM subscriptions s
				JOIN plans p ON p.id = s.plan_id
				WHERE s.tenant_id = $1
				  AND s.status    IN ('active', 'trialing')
				  AND p.features  @> to_jsonb($2::text)
				UNION ALL
				-- Admin-granted tenant-level override
				SELECT 1
				FROM tenant_features tf
				WHERE tf.tenant_id = $1
				  AND tf.feature   = $2
				  AND tf.enabled   = true
				  AND (tf.expires_at IS NULL OR tf.expires_at > NOW())
				UNION ALL
				-- Active add-on grants the feature
				SELECT 1
				FROM subscription_addons sa
				JOIN plan_addons pa ON pa.addon_type = sa.addon_type
				WHERE sa.tenant_id = $1
				  AND sa.status    = 'active'
				  AND pa.features  @> to_jsonb($2::text)
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
