package observability

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Middleware records HTTP metrics for every request.
// Place after RequestID, before business handlers.
func Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.URL.Path == "/health" {
			c.Next()
			return
		}

		HTTPRequestsInFlight.Inc()
		start := time.Now()

		c.Next()

		HTTPRequestsInFlight.Dec()
		path := c.FullPath()
		if path == "" {
			path = "unknown"
		}
		ObserveRequest(
			c.Request.Method,
			path,
			c.Writer.Status(),
			float64(time.Since(start).Milliseconds()),
		)
	}
}

// StartDBCollector exports pgxpool stats into gauges every 15 s.
// Call as: go observability.StartDBCollector(pool)
func StartDBCollector(pool *pgxpool.Pool) {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()
	for range ticker.C {
		s := pool.Stat()
		DBPoolAcquired.Set(int64(s.AcquiredConns()))
		DBPoolIdle.Set(int64(s.IdleConns()))
		DBPoolMax.Set(int64(s.MaxConns()))
		DBPoolWaitCount.Set(s.EmptyAcquireCount())
	}
}
