package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TenantResolver resolves tenant_id + user_role from the users table when they
// are not already in the JWT app_metadata. Runs after JWTAuth.
func TenantResolver(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Already resolved via JWT custom claims — skip DB lookup
		if c.GetString(CtxTenantID) != "" && c.GetString(CtxUserRole) != "" {
			c.Next()
			return
		}

		userID := c.GetString(CtxUserID)
		if userID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, errJSON("unauthorized", "Authentication required"))
			return
		}

		var tenantID, role, slug string
		err := pool.QueryRow(c.Request.Context(),
			`SELECT u.tenant_id::text, u.role::text, t.slug
			 FROM users u
			 JOIN tenants t ON t.id = u.tenant_id
			 WHERE u.id = $1 AND u.is_active = TRUE`,
			userID,
		).Scan(&tenantID, &role, &slug)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusForbidden, errJSON("user_not_provisioned",
				"User is not linked to any tenant. Complete onboarding first."))
			return
		}

		c.Set(CtxTenantID, tenantID)
		c.Set(CtxUserRole, role)
		c.Set(CtxTenantSlug, slug)
		c.Next()
	}
}

// SlugTenantResolver resolves tenant_id from the :slug URL parameter.
// Used for public routes that carry no JWT.
func SlugTenantResolver(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		slug := c.Param("slug")
		if slug == "" {
			c.Next()
			return
		}

		var tenantID string
		err := pool.QueryRow(c.Request.Context(),
			`SELECT id::text FROM tenants WHERE slug = $1 AND is_active = TRUE`,
			slug,
		).Scan(&tenantID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusNotFound, errJSON("not_found", "Store not found"))
			return
		}

		c.Set(CtxTenantID, tenantID)
		c.Next()
	}
}
