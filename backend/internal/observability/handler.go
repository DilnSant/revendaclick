package observability

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// MetricsHandler returns a gin.HandlerFunc that writes Prometheus text format.
// It validates the bearer token when metricsToken is non-empty.
func MetricsHandler(metricsToken string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if metricsToken != "" {
			auth := c.GetHeader("Authorization")
			if auth != "Bearer "+metricsToken {
				c.Header("WWW-Authenticate", `Bearer realm="metrics"`)
				c.AbortWithStatus(http.StatusUnauthorized)
				return
			}
		}
		c.Header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
		Global().WritePrometheus(c.Writer)
	}
}
