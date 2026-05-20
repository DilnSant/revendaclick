package observability

import (
	"bytes"
	"strings"
	"testing"
)

func TestCounter(t *testing.T) {
	t.Run("Inc twice gives Load==2", func(t *testing.T) {
		var c Counter
		c.Inc()
		c.Inc()
		if got := c.Load(); got != 2 {
			t.Errorf("expected 2, got %d", got)
		}
	})
}

func TestGauge(t *testing.T) {
	t.Run("Set then Dec gives expected value", func(t *testing.T) {
		var g Gauge
		g.Set(10)
		g.Dec()
		if got := g.Load(); got != 9 {
			t.Errorf("expected 9, got %d", got)
		}
	})
}

func TestHistogram(t *testing.T) {
	t.Run("Observe then snapshot has correct sum and total", func(t *testing.T) {
		h := newHistogram([]float64{25, 50, 100})
		h.Observe(50.0)
		_, _, sum, total := h.snapshot()
		if sum != 50.0 {
			t.Errorf("expected sum=50.0, got %f", sum)
		}
		if total != 1 {
			t.Errorf("expected total=1, got %d", total)
		}
	})
}

func TestRegistryWriteTo(t *testing.T) {
	t.Run("WriteTo output contains counter name", func(t *testing.T) {
		reg := &Registry{
			counters:   make(map[string]*labeledCounter),
			gauges:     make(map[string]*labeledGauge),
			histograms: make(map[string]*labeledHistogram),
		}
		c := reg.Counter("test_requests_total", "total test requests")
		c.Inc()

		var buf bytes.Buffer
		reg.WriteTo(&buf)
		out := buf.String()

		if !strings.Contains(out, "test_requests_total") {
			t.Errorf("expected output to contain metric name, got:\n%s", out)
		}
	})
}

func TestLabelsKey(t *testing.T) {
	t.Run("two label pairs produce correct key", func(t *testing.T) {
		// Test indirectly via Registry.WriteTo output
		reg := &Registry{
			counters:   make(map[string]*labeledCounter),
			gauges:     make(map[string]*labeledGauge),
			histograms: make(map[string]*labeledHistogram),
		}
		c := reg.Counter("http_requests", "http requests", "method", "GET", "status", "200")
		c.Inc()

		var buf bytes.Buffer
		reg.WriteTo(&buf)
		out := buf.String()

		// The output line should be: http_requests{method="GET",status="200"} 1
		if !strings.Contains(out, `http_requests{method="GET",status="200"}`) {
			t.Errorf("expected label key in output, got:\n%s", out)
		}
	})

	t.Run("labelsKey direct: two pairs", func(t *testing.T) {
		got := labelsKey([]string{"method", "GET", "status", "200"})
		want := `{method="GET",status="200"}`
		if got != want {
			t.Errorf("expected %q, got %q", want, got)
		}
	})

	t.Run("labelsKey direct: empty slice", func(t *testing.T) {
		got := labelsKey([]string{})
		if got != "" {
			t.Errorf("expected empty string, got %q", got)
		}
	})
}

func TestAppendLeLabel(t *testing.T) {
	t.Run("empty existing produces le-only label", func(t *testing.T) {
		got := appendLeLabel("", "5")
		want := `{le="5"}`
		if got != want {
			t.Errorf("expected %q, got %q", want, got)
		}
	})

	t.Run("existing label set gets le appended", func(t *testing.T) {
		got := appendLeLabel(`{method="GET"}`, "+Inf")
		want := `{method="GET",le="+Inf"}`
		if got != want {
			t.Errorf("expected %q, got %q", want, got)
		}
	})
}
