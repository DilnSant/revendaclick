package observability

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

// StartBusinessCollector polls business metrics from the database every minute.
// Call as: go observability.StartBusinessCollector(pool, logger)
func StartBusinessCollector(pool *pgxpool.Pool, logger *zap.Logger) {
	collectOnce(pool, logger)
	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()
	for range ticker.C {
		collectOnce(pool, logger)
	}
}

func collectOnce(pool *pgxpool.Pool, logger *zap.Logger) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Total tenants
	var tenantCount int64
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM tenants`).Scan(&tenantCount); err != nil {
		logger.Warn("observability: tenant count query failed", zap.Error(err))
	} else {
		TenantCount.Set(tenantCount)
	}

	// Subscriptions by status
	rows, err := pool.Query(ctx,
		`SELECT status, COUNT(*) FROM subscriptions GROUP BY status`,
	)
	if err != nil {
		logger.Warn("observability: subscriptions query failed", zap.Error(err))
		return
	}
	defer rows.Close()
	for rows.Next() {
		var status string
		var count int64
		if err := rows.Scan(&status, &count); err == nil {
			SetSubscriptionStatus(status, count)
		}
	}
}
