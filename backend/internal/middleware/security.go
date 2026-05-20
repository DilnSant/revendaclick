package middleware

import "github.com/gin-gonic/gin"

// SecurityHeaders adds standard security headers to every API response.
// The frontend (Next.js) adds its own headers via next.config.ts.
// Note: HSTS is also set by nginx, but we add it here as defence-in-depth
// for any path that bypasses the reverse proxy in non-prod environments.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		// API responses never embed content, so a tight CSP is safe.
		c.Header("Content-Security-Policy", "default-src 'none'")
		// HSTS: 6-month max-age for the API subdomain (no includeSubDomains — frontend handles its own).
		c.Header("Strict-Transport-Security", "max-age=15768000")
		c.Next()
	}
}
