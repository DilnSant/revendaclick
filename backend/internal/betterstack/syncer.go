package betterstack

import (
	"bytes"
	"context"
	"net/http"
	"sync"
	"time"

	"go.uber.org/zap/zapcore"
)

const (
	ingestEndpoint = "https://in.logs.betterstack.com"
	flushInterval  = 3 * time.Second
	maxBatchSize   = 100
)

// Syncer is a zapcore.WriteSyncer that ships JSON log lines to BetterStack.
// Lines are buffered and flushed every 3 s or when the batch reaches 100 entries.
// Errors are silently discarded — logging must never block or crash the application.
type Syncer struct {
	token     string
	client    *http.Client
	mu        sync.Mutex
	buf       [][]byte
	quit      chan struct{}
	closeOnce sync.Once
	wg        sync.WaitGroup
}

// NewSyncer creates a Syncer and starts its background flush goroutine.
func NewSyncer(token string) *Syncer {
	s := &Syncer{
		token:  token,
		client: &http.Client{Timeout: 10 * time.Second},
		quit:   make(chan struct{}),
	}
	s.wg.Add(1)
	go s.run()
	return s
}

// EncoderConfig returns the zapcore.EncoderConfig with BetterStack field names.
func EncoderConfig() zapcore.EncoderConfig {
	return zapcore.EncoderConfig{
		TimeKey:        "dt",
		LevelKey:       "level",
		NameKey:        zapcore.OmitKey,
		CallerKey:      "caller",
		FunctionKey:    zapcore.OmitKey,
		MessageKey:     "message",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.LowercaseLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.MillisDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}
}

// Write buffers a single JSON log line from Zap's JSON encoder.
func (s *Syncer) Write(p []byte) (int, error) {
	line := bytes.TrimRight(p, "\n")
	if len(line) == 0 {
		return len(p), nil
	}
	cp := make([]byte, len(line))
	copy(cp, line)

	s.mu.Lock()
	s.buf = append(s.buf, cp)
	full := len(s.buf) >= maxBatchSize
	s.mu.Unlock()

	if full {
		s.flush()
	}
	return len(p), nil
}

// Sync stops the background goroutine and flushes any remaining buffered logs.
// Safe to call multiple times.
func (s *Syncer) Sync() error {
	s.closeOnce.Do(func() {
		close(s.quit)
		s.wg.Wait()
		s.flush()
	})
	return nil
}

func (s *Syncer) run() {
	defer s.wg.Done()
	ticker := time.NewTicker(flushInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			s.flush()
		case <-s.quit:
			return
		}
	}
}

func (s *Syncer) flush() {
	s.mu.Lock()
	if len(s.buf) == 0 {
		s.mu.Unlock()
		return
	}
	lines := s.buf
	s.buf = nil
	s.mu.Unlock()

	body := buildJSONArray(lines)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ingestEndpoint, bytes.NewReader(body))
	if err != nil {
		return
	}
	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return
	}
	resp.Body.Close()
}

func buildJSONArray(lines [][]byte) []byte {
	var b bytes.Buffer
	b.WriteByte('[')
	for i, line := range lines {
		if i > 0 {
			b.WriteByte(',')
		}
		b.Write(line)
	}
	b.WriteByte(']')
	return b.Bytes()
}
