.PHONY: up down down-v build logs logs-backend logs-frontend ps \
        restart restart-backend restart-frontend \
        up-prod down-prod logs-prod \
        backend frontend nginx \
        migrate seed \
        dev-backend dev-frontend \
        health lint test build-backend

COMPOSE      = docker compose
COMPOSE_PROD = docker compose -f docker-compose.prod.yml

# ── Local development ─────────────────────────────────────────────────────────

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

down-v:
	$(COMPOSE) down -v

build:
	$(COMPOSE) build --no-cache

logs:
	$(COMPOSE) logs -f

logs-backend:
	$(COMPOSE) logs -f backend

logs-frontend:
	$(COMPOSE) logs -f frontend

ps:
	$(COMPOSE) ps

restart:
	$(COMPOSE) restart

restart-backend:
	$(COMPOSE) restart backend

restart-frontend:
	$(COMPOSE) restart frontend

# ── Production ────────────────────────────────────────────────────────────────

up-prod:
	$(COMPOSE_PROD) pull && $(COMPOSE_PROD) up -d

down-prod:
	$(COMPOSE_PROD) down

logs-prod:
	$(COMPOSE_PROD) logs -f

# ── Individual services ───────────────────────────────────────────────────────

backend:
	$(COMPOSE) up -d backend

frontend:
	$(COMPOSE) up -d frontend

nginx:
	$(COMPOSE) up -d nginx

# ── Database ──────────────────────────────────────────────────────────────────

migrate:
	$(MAKE) -C backend migrate

seed:
	$(MAKE) -C backend seed

# ── Development (local, no Docker) ───────────────────────────────────────────

dev-backend:
	$(MAKE) -C backend dev

dev-frontend:
	cd frontend && npm run dev

# ── Quality ───────────────────────────────────────────────────────────────────

lint:
	cd backend && go vet ./...

test:
	cd backend && go test ./... -v -count=1

build-backend:
	cd backend && go build -o bin/api ./cmd/api

# ── Health checks ─────────────────────────────────────────────────────────────

health:
	@curl -sf http://localhost/health        && echo " backend /health OK"     || echo " backend /health FAIL"
	@curl -sf http://localhost/api/v1/health && echo " backend /api/v1 OK"     || echo " backend /api/v1 FAIL"
	@curl -sf http://localhost/              > /dev/null \
	  && echo " frontend OK" || echo " frontend FAIL"
