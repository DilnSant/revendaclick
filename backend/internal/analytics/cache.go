package analytics

import (
	"sync"
	"time"
)

const cacheTTL = 60 * time.Second

type cacheEntry struct {
	summary   *Summary
	expiresAt time.Time
}

// summaryCache is a simple in-process TTL cache keyed by tenant_id.
// It avoids hitting the DB on every analytics dashboard refresh.
type summaryCache struct {
	mu      sync.RWMutex
	entries map[string]cacheEntry
}

var globalCache = &summaryCache{entries: make(map[string]cacheEntry)}

func (c *summaryCache) get(tenantID string) (*Summary, bool) {
	c.mu.RLock()
	e, ok := c.entries[tenantID]
	c.mu.RUnlock()
	if !ok || time.Now().After(e.expiresAt) {
		return nil, false
	}
	return e.summary, true
}

func (c *summaryCache) set(tenantID string, s *Summary) {
	c.mu.Lock()
	c.entries[tenantID] = cacheEntry{summary: s, expiresAt: time.Now().Add(cacheTTL)}
	c.mu.Unlock()
}

// Invalidate removes a tenant's cached summary (e.g. after a new lead/sale).
func (c *summaryCache) invalidate(tenantID string) {
	c.mu.Lock()
	delete(c.entries, tenantID)
	c.mu.Unlock()
}

// Purge removes all expired entries. Call periodically to prevent unbounded growth.
func (c *summaryCache) purge() {
	now := time.Now()
	c.mu.Lock()
	for k, e := range c.entries {
		if now.After(e.expiresAt) {
			delete(c.entries, k)
		}
	}
	c.mu.Unlock()
}

func init() {
	go func() {
		t := time.NewTicker(5 * time.Minute)
		for range t.C {
			globalCache.purge()
		}
	}()
}
