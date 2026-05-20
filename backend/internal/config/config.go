package config

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	Env                string
	DatabaseURL        string
	SupabaseURL        string
	SupabaseJWTSecret  string
	SupabaseServiceKey string
	SupabaseECKey      *ecdsa.PublicKey // populated when Supabase project uses ES256
	AllowedOrigins     []string
	EvolutionAPIURL    string
	EvolutionAPIKey    string
	OpenRouterAPIKey   string
	OpenRouterModel    string
	AsaasAPIKey          string
	AsaasEnv             string
	AsaasWebhookToken    string
	MetricsToken         string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		Port:               getEnv("PORT", "8080"),
		Env:                getEnv("ENV", "development"),
		DatabaseURL:        requireEnv("DATABASE_URL"),
		SupabaseURL:        requireEnv("SUPABASE_URL"),
		SupabaseJWTSecret:  getEnv("SUPABASE_JWT_SECRET", ""),
		SupabaseServiceKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
		AllowedOrigins:     strings.Split(getEnv("ALLOWED_ORIGINS", "http://localhost:3000"), ","),
		EvolutionAPIKey:    getEnv("EVOLUTION_API_KEY", ""),
		OpenRouterAPIKey:   getEnv("OPENROUTER_API_KEY", ""),
		OpenRouterModel:    getEnv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
		AsaasAPIKey:       getEnv("ASAAS_API_KEY", ""),
		AsaasEnv:          getEnv("ASAAS_ENV", "sandbox"),
		AsaasWebhookToken: getEnv("ASAAS_WEBHOOK_TOKEN", ""),
		MetricsToken:      getEnv("METRICS_TOKEN", ""),
	}

	// Support both EVOLUTION_API_URL and legacy EVOLUTION_BASE_URL
	if v := os.Getenv("EVOLUTION_API_URL"); v != "" {
		cfg.EvolutionAPIURL = v
	} else if v := os.Getenv("EVOLUTION_BASE_URL"); v != "" {
		cfg.EvolutionAPIURL = v
	}

	// Try to fetch EC public key from Supabase JWKS (ES256 projects)
	if key, err := fetchSupabaseECKey(cfg.SupabaseURL); err == nil {
		cfg.SupabaseECKey = key
	}

	return cfg, nil
}

// fetchSupabaseECKey fetches the first EC public key from the Supabase JWKS endpoint.
// Returns nil (no error) if the project uses HMAC (HS256) instead.
func fetchSupabaseECKey(supabaseURL string) (*ecdsa.PublicKey, error) {
	jwksURL := strings.TrimRight(supabaseURL, "/") + "/auth/v1/.well-known/jwks.json"

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, jwksURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var jwks struct {
		Keys []struct {
			Kty string `json:"kty"`
			Crv string `json:"crv"`
			X   string `json:"x"`
			Y   string `json:"y"`
		} `json:"keys"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return nil, err
	}

	for _, k := range jwks.Keys {
		if k.Kty == "EC" && k.Crv == "P-256" {
			xBytes, err := base64.RawURLEncoding.DecodeString(k.X)
			if err != nil {
				continue
			}
			yBytes, err := base64.RawURLEncoding.DecodeString(k.Y)
			if err != nil {
				continue
			}
			return &ecdsa.PublicKey{
				Curve: elliptic.P256(),
				X:     new(big.Int).SetBytes(xBytes),
				Y:     new(big.Int).SetBytes(yBytes),
			}, nil
		}
	}
	return nil, fmt.Errorf("no EC P-256 key found in JWKS")
}

func (c *Config) IsProd() bool { return c.Env == "production" }

func requireEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic(fmt.Sprintf("required env var %q is not set", key))
	}
	return v
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
