package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type bucket struct {
	tokens   float64
	lastSeen time.Time
	mu       sync.Mutex
}

type rateLimiter struct {
	mu      sync.Mutex
	buckets map[string]*bucket
	rate    float64 // tokens per second
	max     float64 // burst cap
}

func newRateLimiter(rps, burst float64) *rateLimiter {
	rl := &rateLimiter{
		buckets: make(map[string]*bucket),
		rate:    rps,
		max:     burst,
	}
	// Purge stale buckets every minute
	go func() {
		t := time.NewTicker(time.Minute)
		for range t.C {
			rl.mu.Lock()
			for k, b := range rl.buckets {
				b.mu.Lock()
				if time.Since(b.lastSeen) > 5*time.Minute {
					delete(rl.buckets, k)
				}
				b.mu.Unlock()
			}
			rl.mu.Unlock()
		}
	}()
	return rl
}

func (rl *rateLimiter) allow(key string) bool {
	rl.mu.Lock()
	b, ok := rl.buckets[key]
	if !ok {
		b = &bucket{tokens: rl.max, lastSeen: time.Now()}
		rl.buckets[key] = b
	}
	rl.mu.Unlock()

	b.mu.Lock()
	defer b.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(b.lastSeen).Seconds()
	b.lastSeen = now
	b.tokens += elapsed * rl.rate
	if b.tokens > rl.max {
		b.tokens = rl.max
	}
	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

// RateLimit returns a middleware with token-bucket rate limiting per client IP.
// rps = sustained requests per second, burst = max burst size.
func RateLimit(rps, burst float64) gin.HandlerFunc {
	rl := newRateLimiter(rps, burst)
	return func(c *gin.Context) {
		if !rl.allow(c.ClientIP()) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": gin.H{
					"code":    "rate_limited",
					"message": "Muitas requisições. Aguarde um momento.",
				},
			})
			return
		}
		c.Next()
	}
}
