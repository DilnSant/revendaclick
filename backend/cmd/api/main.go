package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"

	"revendaclick/backend/internal/config"
	"revendaclick/backend/internal/db"
	"revendaclick/backend/internal/server"
)

func main() {
	// Bootstrap logger before config so startup errors are structured.
	logger, _ := zap.NewProduction()
	defer logger.Sync() //nolint:errcheck

	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("load config", zap.Error(err))
	}

	if !cfg.IsProd() {
		logger, _ = zap.NewDevelopment()
		defer logger.Sync() //nolint:errcheck
	}

	ctx := context.Background()
	pool, err := db.New(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("connect to database", zap.Error(err))
	}
	defer pool.Close()
	logger.Info("database connected")

	// Startup integration checks (non-fatal — log clearly so ops can diagnose)
	if cfg.AsaasAPIKey == "" {
		logger.Warn("ASAAS_API_KEY not set — billing subscribe/cancel will return 401")
	} else {
		logger.Info("asaas configured", zap.String("env", cfg.AsaasEnv))
	}
	if cfg.EvolutionAPIKey == "" {
		logger.Warn("EVOLUTION_API_KEY not set — WhatsApp integration disabled")
	}
	if cfg.OpenRouterAPIKey == "" {
		logger.Warn("OPENROUTER_API_KEY not set — AI features disabled")
	}

	handler := server.New(cfg, pool, logger)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		logger.Info("server starting",
			zap.String("port", cfg.Port),
			zap.String("env", cfg.Env),
		)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Fatal("server error", zap.Error(err))
		}
	}()

	<-quit
	logger.Info("shutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown error", zap.Error(err))
	}
	logger.Info("server stopped")
}
