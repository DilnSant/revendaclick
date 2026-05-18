package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// ZapLogger logs every request with method, path, status, latency,
// tenant_id, user_id and request_id for full trace correlation.
func ZapLogger(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path  := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		if query != "" {
			path = path + "?" + query
		}

		// Skip health probes to reduce log noise
		if path == "/health" || path == "/api/v1/health" {
			return
		}

		logger.Info("http",
			zap.String("request_id", c.GetString(CtxRequestID)),
			zap.String("method",     c.Request.Method),
			zap.String("path",       path),
			zap.Int("status",        c.Writer.Status()),
			zap.Int64("latency_ms",  time.Since(start).Milliseconds()),
			zap.String("ip",         c.ClientIP()),
			zap.String("tenant_id",  c.GetString(CtxTenantID)),
			zap.String("user_id",    c.GetString(CtxUserID)),
			zap.String("errors",     c.Errors.ByType(gin.ErrorTypePrivate).String()),
		)
	}
}
