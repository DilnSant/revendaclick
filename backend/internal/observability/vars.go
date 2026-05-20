package observability

import (
	"fmt"
	"math"
)

// HTTP request duration buckets in milliseconds.
var httpBuckets = []float64{5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, math.Inf(1)}

// Pre-registered metrics — wired up at package init.
var (
	HTTPRequestsInFlight *Gauge
	DBPoolAcquired       *Gauge
	DBPoolIdle           *Gauge
	DBPoolMax            *Gauge
	DBPoolWaitCount      *Gauge
	TenantCount          *Gauge
	SubsByStatus         *labeledGauge

	httpRequestsTotal   *labeledCounter
	httpRequestDuration *labeledHistogram
)

func init() {
	r := Global()

	httpRequestsTotal = r.registerCounter(
		"http_requests_total",
		"Total HTTP requests partitioned by method, path and status code.",
	)
	httpRequestDuration = r.registerHistogram(
		"http_request_duration_ms",
		"HTTP request latency in milliseconds.",
		httpBuckets,
	)
	HTTPRequestsInFlight = r.Gauge(
		"http_requests_in_flight",
		"Number of HTTP requests currently being processed.",
	)
	DBPoolAcquired  = r.Gauge("db_pool_acquired_conns", "Database pool: acquired connections.")
	DBPoolIdle      = r.Gauge("db_pool_idle_conns", "Database pool: idle connections.")
	DBPoolMax       = r.Gauge("db_pool_max_conns", "Database pool: max connections configured.")
	DBPoolWaitCount = r.Gauge("db_pool_wait_count", "Database pool: cumulative wait count.")
	TenantCount     = r.Gauge("business_tenants_total", "Total number of tenant workspaces.")
	SubsByStatus    = r.registerGauge(
		"business_subscriptions_by_status",
		"Active subscriptions grouped by status.",
	)
}

// ObserveRequest records HTTP request metrics. Called by the metrics middleware.
func ObserveRequest(method, path string, statusCode int, durationMs float64) {
	cKey := labelsKey([]string{"method", method, "path", path, "status", fmt.Sprintf("%d", statusCode)})
	cv, _ := httpRequestsTotal.values.LoadOrStore(cKey, &Counter{})
	cv.(*Counter).Inc()

	hKey := labelsKey([]string{"method", method, "path", path})
	hv, _ := httpRequestDuration.values.LoadOrStore(hKey, newHistogram(httpBuckets))
	hv.(*Histogram).Observe(durationMs)
}

// SetSubscriptionStatus sets the gauge for a subscription status label.
func SetSubscriptionStatus(status string, count int64) {
	key := labelsKey([]string{"status", status})
	v, _ := SubsByStatus.values.LoadOrStore(key, &Gauge{})
	v.(*Gauge).Set(count)
}
