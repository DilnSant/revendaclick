package observability

import (
	"fmt"
	"io"
	"math"
	"sort"
	"sync"
	"sync/atomic"
)

// Counter is a monotonically increasing uint64.
type Counter struct{ v uint64 }

func (c *Counter) Inc()           { atomic.AddUint64(&c.v, 1) }
func (c *Counter) Add(n uint64)   { atomic.AddUint64(&c.v, n) }
func (c *Counter) Load() uint64   { return atomic.LoadUint64(&c.v) }

// Gauge is a signed int64 that can go up or down.
type Gauge struct{ v int64 }

func (g *Gauge) Set(n int64)    { atomic.StoreInt64(&g.v, n) }
func (g *Gauge) Inc()           { atomic.AddInt64(&g.v, 1) }
func (g *Gauge) Dec()           { atomic.AddInt64(&g.v, -1) }
func (g *Gauge) Load() int64    { return atomic.LoadInt64(&g.v) }

// Histogram records observations in fixed buckets (milliseconds).
type Histogram struct {
	mu      sync.Mutex
	buckets []float64 // upper bounds
	counts  []uint64  // count per bucket (cumulative)
	sum     float64
	total   uint64
}

func newHistogram(buckets []float64) *Histogram {
	sorted := make([]float64, len(buckets))
	copy(sorted, buckets)
	sort.Float64s(sorted)
	return &Histogram{
		buckets: sorted,
		counts:  make([]uint64, len(sorted)),
	}
}

func (h *Histogram) Observe(v float64) {
	h.mu.Lock()
	h.sum += v
	h.total++
	for i, b := range h.buckets {
		if v <= b {
			h.counts[i]++
		}
	}
	h.mu.Unlock()
}

// snapshot returns a consistent read of the histogram.
func (h *Histogram) snapshot() (buckets []float64, counts []uint64, sum float64, total uint64) {
	h.mu.Lock()
	buckets = make([]float64, len(h.buckets))
	copy(buckets, h.buckets)
	counts = make([]uint64, len(h.counts))
	copy(counts, h.counts)
	sum = h.sum
	total = h.total
	h.mu.Unlock()
	return
}

// Registry holds all metrics and writes them in Prometheus exposition format.
type Registry struct {
	mu         sync.RWMutex
	counters   map[string]*labeledCounter
	gauges     map[string]*labeledGauge
	histograms map[string]*labeledHistogram
}

type labeledCounter struct {
	help   string
	values sync.Map // key → *Counter
}

type labeledGauge struct {
	help   string
	values sync.Map // key → *Gauge
}

type labeledHistogram struct {
	help    string
	buckets []float64
	values  sync.Map // key → *Histogram
}

var global = &Registry{
	counters:   make(map[string]*labeledCounter),
	gauges:     make(map[string]*labeledGauge),
	histograms: make(map[string]*labeledHistogram),
}

// Global returns the default registry.
func Global() *Registry { return global }

func (r *Registry) registerCounter(name, help string) *labeledCounter {
	r.mu.Lock()
	defer r.mu.Unlock()
	if lc, ok := r.counters[name]; ok {
		return lc
	}
	lc := &labeledCounter{help: help}
	r.counters[name] = lc
	return lc
}

func (r *Registry) registerGauge(name, help string) *labeledGauge {
	r.mu.Lock()
	defer r.mu.Unlock()
	if lg, ok := r.gauges[name]; ok {
		return lg
	}
	lg := &labeledGauge{help: help}
	r.gauges[name] = lg
	return lg
}

func (r *Registry) registerHistogram(name, help string, buckets []float64) *labeledHistogram {
	r.mu.Lock()
	defer r.mu.Unlock()
	if lh, ok := r.histograms[name]; ok {
		return lh
	}
	lh := &labeledHistogram{help: help, buckets: buckets}
	r.histograms[name] = lh
	return lh
}

// Counter returns (or creates) the counter for the given name+labels.
// labels must be a flat key/value slice: ["status", "200", "method", "GET"].
func (r *Registry) Counter(name, help string, labels ...string) *Counter {
	lc := r.registerCounter(name, help)
	key := labelsKey(labels)
	v, _ := lc.values.LoadOrStore(key, &Counter{})
	return v.(*Counter)
}

// Gauge returns (or creates) the gauge for the given name+labels.
func (r *Registry) Gauge(name, help string, labels ...string) *Gauge {
	lg := r.registerGauge(name, help)
	key := labelsKey(labels)
	v, _ := lg.values.LoadOrStore(key, &Gauge{})
	return v.(*Gauge)
}

// Histogram returns (or creates) the histogram for name+labels.
func (r *Registry) Histogram(name, help string, buckets []float64, labels ...string) *Histogram {
	lh := r.registerHistogram(name, help, buckets)
	key := labelsKey(labels)
	v, _ := lh.values.LoadOrStore(key, newHistogram(lh.buckets))
	return v.(*Histogram)
}

// WriteTo writes the Prometheus text exposition format to w.
func (r *Registry) WriteTo(w io.Writer) {
	r.mu.RLock()
	cNames := sortedKeys(r.counters)
	gNames := sortedKeys(r.gauges)
	hNames := sortedKeys(r.histograms)
	r.mu.RUnlock()

	for _, name := range cNames {
		r.mu.RLock()
		lc := r.counters[name]
		r.mu.RUnlock()
		fmt.Fprintf(w, "# HELP %s %s\n# TYPE %s counter\n", name, lc.help, name)
		lc.values.Range(func(k, val any) bool {
			c := val.(*Counter)
			fmt.Fprintf(w, "%s%s %d\n", name, k, c.Load())
			return true
		})
	}

	for _, name := range gNames {
		r.mu.RLock()
		lg := r.gauges[name]
		r.mu.RUnlock()
		fmt.Fprintf(w, "# HELP %s %s\n# TYPE %s gauge\n", name, lg.help, name)
		lg.values.Range(func(k, val any) bool {
			g := val.(*Gauge)
			fmt.Fprintf(w, "%s%s %d\n", name, k, g.Load())
			return true
		})
	}

	for _, name := range hNames {
		r.mu.RLock()
		lh := r.histograms[name]
		r.mu.RUnlock()
		fmt.Fprintf(w, "# HELP %s %s\n# TYPE %s histogram\n", name, lh.help, name)
		lh.values.Range(func(k, val any) bool {
			h := val.(*Histogram)
			buckets, counts, sum, total := h.snapshot()
			lbls := k.(string)
			for i, b := range buckets {
				if math.IsInf(b, 1) {
					continue // written below as +Inf = total
				}
				buckLbl := appendLeLabel(lbls, fmt.Sprintf("%.0f", b))
				fmt.Fprintf(w, "%s_bucket%s %d\n", name, buckLbl, counts[i])
			}
			infLbl := appendLeLabel(lbls, "+Inf")
			fmt.Fprintf(w, "%s_bucket%s %d\n", name, infLbl, total)
			fmt.Fprintf(w, "%s_sum%s %.6f\n", name, lbls, sum)
			fmt.Fprintf(w, "%s_count%s %d\n", name, lbls, total)
			return true
		})
	}
}

// labelsKey turns ["k1","v1","k2","v2"] into {k1="v1",k2="v2"} or empty string.
func labelsKey(labels []string) string {
	if len(labels) == 0 {
		return ""
	}
	out := "{"
	for i := 0; i+1 < len(labels); i += 2 {
		if i > 0 {
			out += ","
		}
		out += labels[i] + `="` + labels[i+1] + `"`
	}
	return out + "}"
}

func appendLeLabel(existing, le string) string {
	if existing == "" || existing == "{}" {
		return `{le="` + le + `"}`
	}
	// existing is like {k="v"} — insert before closing brace
	return existing[:len(existing)-1] + `,le="` + le + `"}`
}

func sortedKeys[V any](m map[string]V) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}
