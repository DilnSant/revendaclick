package middleware

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SubscriptionGate blocks tenants whose subscription is not in a usable state.
// Active / trialing → pass through.
// Past_due within grace period → pass through with warning header.
// Canceled / paused / past_due beyond grace → 402 Payment Required.
func SubscriptionGate(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantID := c.GetString(CtxTenantID)
		if tenantID == "" {
			c.Next()
			return
		}

		var status string
		var graceUntil *time.Time
		err := pool.QueryRow(c.Request.Context(),
			`SELECT status, grace_until FROM subscriptions WHERE tenant_id = $1`,
			tenantID,
		).Scan(&status, &graceUntil)
		if err != nil {
			// No subscription row — let pass (might be mid-onboarding)
			c.Next()
			return
		}

		switch status {
		case "active", "trialing":
			c.Next()
			return

		case "past_due":
			// Within grace period → allow with warning
			if graceUntil != nil && time.Now().Before(*graceUntil) {
				c.Header("X-Subscription-Warning", "payment_overdue")
				c.Next()
				return
			}
			// Grace expired
			c.AbortWithStatusJSON(http.StatusPaymentRequired, gin.H{
				"error": gin.H{
					"code":    "subscription_past_due",
					"message": "Assinatura em atraso. Regularize o pagamento para continuar.",
				},
			})
			return

		default: // canceled, paused
			c.AbortWithStatusJSON(http.StatusPaymentRequired, gin.H{
				"error": gin.H{
					"code":    "subscription_inactive",
					"message": "Assinatura inativa. Renove seu plano para continuar.",
				},
			})
		}
	}
}
