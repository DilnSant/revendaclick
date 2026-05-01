package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	Env                string
	DatabaseURL        string
	SupabaseURL        string
	SupabaseJWTSecret  string
	SupabaseServiceKey string
	AllowedOrigins     []string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		Port:               getEnv("PORT", "8080"),
		Env:                getEnv("ENV", "development"),
		DatabaseURL:        requireEnv("DATABASE_URL"),
		SupabaseURL:        requireEnv("SUPABASE_URL"),
		SupabaseJWTSecret:  requireEnv("SUPABASE_JWT_SECRET"),
		SupabaseServiceKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
		AllowedOrigins:     strings.Split(getEnv("ALLOWED_ORIGINS", "http://localhost:3000"), ","),
	}

	return cfg, nil
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
