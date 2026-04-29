package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"revendaclick/backend/internal/response"
)

type contextKey string

const (
	CtxUserID   contextKey = "user_id"
	CtxTenantID contextKey = "tenant_id"
	CtxUserRole contextKey = "user_role"
)

type SupabaseClaims struct {
	jwt.RegisteredClaims
	Email        string                 `json:"email"`
	Role         string                 `json:"role"`
	AppMetadata  map[string]any         `json:"app_metadata"`
	UserMetadata map[string]any         `json:"user_metadata"`
}

func (c *SupabaseClaims) AppMetaString(key string) string {
	if c.AppMetadata == nil {
		return ""
	}
	v, _ := c.AppMetadata[key].(string)
	return v
}

func JWTAuth(secret string) func(http.Handler) http.Handler {
	keyFunc := func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			raw := extractBearer(r)
			if raw == "" {
				response.Unauthorized(w)
				return
			}

			claims := &SupabaseClaims{}
			token, err := jwt.ParseWithClaims(raw, claims, keyFunc,
				jwt.WithAudience("authenticated"),
				jwt.WithExpirationRequired(),
			)
			if err != nil || !token.Valid {
				response.Unauthorized(w)
				return
			}

			userID, _ := claims.GetSubject()
			ctx := context.WithValue(r.Context(), CtxUserID, userID)

			// Inject tenant_id + role if already in app_metadata (custom JWT hook)
			if tid := claims.AppMetaString("tenant_id"); tid != "" {
				ctx = context.WithValue(ctx, CtxTenantID, tid)
			}
			if role := claims.AppMetaString("user_role"); role != "" {
				ctx = context.WithValue(ctx, CtxUserRole, role)
			}

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func UserIDFromCtx(ctx context.Context) string {
	v, _ := ctx.Value(CtxUserID).(string)
	return v
}

func TenantIDFromCtx(ctx context.Context) string {
	v, _ := ctx.Value(CtxTenantID).(string)
	return v
}

func UserRoleFromCtx(ctx context.Context) string {
	v, _ := ctx.Value(CtxUserRole).(string)
	return v
}

func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := UserRoleFromCtx(r.Context())
			if !allowed[role] {
				response.Forbidden(w)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func extractBearer(r *http.Request) string {
	header := r.Header.Get("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		return ""
	}
	return strings.TrimPrefix(header, "Bearer ")
}
