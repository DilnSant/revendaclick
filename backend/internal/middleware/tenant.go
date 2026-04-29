package middleware

import (
	"context"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"revendaclick/backend/internal/response"
)

// TenantResolver looks up tenant_id + user_role from the users table
// when they are not already present in the JWT app_metadata.
// This runs after JWTAuth and requires a valid user_id in context.
func TenantResolver(pool *pgxpool.Pool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()

			// Already resolved via JWT custom claims — skip DB lookup
			if TenantIDFromCtx(ctx) != "" && UserRoleFromCtx(ctx) != "" {
				next.ServeHTTP(w, r)
				return
			}

			userID := UserIDFromCtx(ctx)
			if userID == "" {
				response.Unauthorized(w)
				return
			}

			var tenantID, role string
			err := pool.QueryRow(ctx,
				`SELECT tenant_id::text, role::text FROM users WHERE id = $1 AND is_active = TRUE`,
				userID,
			).Scan(&tenantID, &role)
			if err != nil {
				// User exists in auth but not in our users table (not yet onboarded)
				response.Err(w, http.StatusForbidden, "user_not_provisioned",
					"User is not linked to any tenant. Complete onboarding first.")
				return
			}

			ctx = context.WithValue(ctx, CtxTenantID, tenantID)
			ctx = context.WithValue(ctx, CtxUserRole, role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// SlugTenantResolver resolves tenant_id from the URL slug parameter.
// Used for public routes where no JWT is present.
func SlugTenantResolver(pool *pgxpool.Pool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()

			slug := r.PathValue("slug")
			if slug == "" {
				next.ServeHTTP(w, r)
				return
			}

			var tenantID string
			err := pool.QueryRow(ctx,
				`SELECT id::text FROM tenants WHERE slug = $1 AND is_active = TRUE`,
				slug,
			).Scan(&tenantID)
			if err != nil {
				response.NotFound(w)
				return
			}

			ctx = context.WithValue(ctx, CtxTenantID, tenantID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
