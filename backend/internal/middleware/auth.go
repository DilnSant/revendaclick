package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Context keys stored in gin.Context
const (
	CtxUserID   = "user_id"
	CtxTenantID = "tenant_id"
	CtxUserRole = "user_role"
)

// SupabaseClaims mirrors the JWT structure Supabase signs.
type SupabaseClaims struct {
	jwt.RegisteredClaims
	Email        string         `json:"email"`
	Role         string         `json:"role"`
	AppMetadata  map[string]any `json:"app_metadata"`
	UserMetadata map[string]any `json:"user_metadata"`
}

func (c *SupabaseClaims) AppMetaString(key string) string {
	if c.AppMetadata == nil {
		return ""
	}
	v, _ := c.AppMetadata[key].(string)
	return v
}

// JWTAuth validates the Supabase-signed Bearer token and injects claims into gin context.
func JWTAuth(secret string) gin.HandlerFunc {
	keyFunc := func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	}

	return func(c *gin.Context) {
		raw := extractBearer(c)
		if raw == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, errJSON("unauthorized", "Authentication required"))
			return
		}

		claims := &SupabaseClaims{}
		token, err := jwt.ParseWithClaims(raw, claims, keyFunc,
			jwt.WithAudience("authenticated"),
			jwt.WithExpirationRequired(),
		)
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, errJSON("unauthorized", "Invalid or expired token"))
			return
		}

		userID, _ := claims.GetSubject()
		c.Set(CtxUserID, userID)

		if tid := claims.AppMetaString("tenant_id"); tid != "" {
			c.Set(CtxTenantID, tid)
		}
		if role := claims.AppMetaString("user_role"); role != "" {
			c.Set(CtxUserRole, role)
		}

		c.Next()
	}
}

// RequireRole aborts with 403 if the caller's role is not in the allowed set.
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}
	return func(c *gin.Context) {
		if !allowed[c.GetString(CtxUserRole)] {
			c.AbortWithStatusJSON(http.StatusForbidden, errJSON("forbidden", "Insufficient permissions"))
			return
		}
		c.Next()
	}
}

// ── Context helpers ───────────────────────────────────────────────────────────

func UserIDFromGin(c *gin.Context) string   { return c.GetString(CtxUserID) }
func TenantIDFromGin(c *gin.Context) string { return c.GetString(CtxTenantID) }
func UserRoleFromGin(c *gin.Context) string { return c.GetString(CtxUserRole) }

// ── Internal helpers ──────────────────────────────────────────────────────────

func extractBearer(c *gin.Context) string {
	h := c.GetHeader("Authorization")
	if !strings.HasPrefix(h, "Bearer ") {
		return ""
	}
	return strings.TrimPrefix(h, "Bearer ")
}

func errJSON(code, message string) gin.H {
	return gin.H{"error": gin.H{"code": code, "message": message}}
}
