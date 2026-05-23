# 12 — CI/CD

> Extraído de: `.github/workflows/ci.yml`.

---

## Visão Geral

Arquivo: `.github/workflows/ci.yml`

```
git push → main
    ↓
[Job 1] test-backend        → ubuntu-latest
    ↓ (só se push, não PR)
[Job 2] build-push          → ubuntu-latest → GHCR
    ↓
[Job 3] deploy              → self-hosted (VPS Hostinger)
```

---

## Triggers

| Evento | Branch | Jobs |
|---|---|---|
| `push` | `main` | test + build + deploy |
| `pull_request` | `main` | test apenas |

---

## Job 1: test-backend

**Runner:** `ubuntu-latest`

```
1. actions/checkout@v4
2. actions/setup-go@v5 (versão do go.mod)
3. cd backend && go mod tidy
4. cd backend && go vet ./...
5. cd backend && go test ./... -count=1 -race -timeout 60s
```

Cache: Go modules via `cache-dependency-path: backend/go.sum`

---

## Job 2: build-push

**Condição:** apenas `push` para `main` (não PR)
**Runner:** `ubuntu-latest`
**Permissões:** `packages: write`

```
1. docker/setup-buildx-action@v3
2. docker/login-action@v3 → ghcr.io (GITHUB_TOKEN automático)
3. docker/build-push-action@v6
   context: ./backend
   tags:
     ghcr.io/dilnsant/revendaclick-backend:latest
     ghcr.io/dilnsant/revendaclick-backend:<github.sha>
   cache: type=gha,scope=backend
```

---

## Job 3: deploy

**Runner:** `self-hosted` (runner no próprio VPS Hostinger)
**Environment:** `production`
**Depende de:** `build-push`

### Passo Deploy

```bash
set -euo pipefail
cd /opt/revendaclick

# Atualiza código
git pull origin main

# Valida e recarrega nginx
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo nginx -t && sudo nginx -s reload

# Pull nova imagem (backend)
BACKEND_IMAGE=ghcr.io/dilnsant/revendaclick-backend \
IMAGE_TAG=<sha> \
docker compose -f docker-compose.production.yml --env-file .env pull backend

# Sobe sem downtime
BACKEND_IMAGE=ghcr.io/dilnsant/revendaclick-backend \
IMAGE_TAG=<sha> \
docker compose -f docker-compose.production.yml --env-file .env up -d --remove-orphans

# Limpa imagens antigas
docker image prune -f --filter "until=24h"
```

### Passo Wait Healthy

Aguarda até 120s (24 tentativas × 5s):
```bash
curl -sf https://api.revendaclick.com.br/health | grep '"status":"ok"'
```

### Passo Smoke Test

```bash
bash /opt/revendaclick/scripts/smoke-test.sh https://api.revendaclick.com.br
```

Verifica 10 categorias:
1. TLS válido (api + evolution)
2. Backend health (/health + /api/v1/health)
3. Security headers
4. Public API (plans + 404)
5. Auth enforcement (401 sem token)
6. Rate limiting (X-Request-ID presente)
7. Webhook rejection (sem token)
8. Metrics protegido
9. Nginx cache (X-Cache-Status)
10. Evolution reachable

---

## Rollback Manual

O CI não tem rollback automático. Para reverter:

```bash
# Na VPS
cd /opt/revendaclick

BACKEND_IMAGE=ghcr.io/dilnsant/revendaclick-backend \
IMAGE_TAG=<sha-anterior> \
docker compose -f docker-compose.production.yml --env-file .env up -d backend
```

SHAs disponíveis: GHCR → repositório → packages → revendaclick-backend → tags

---

## Segredos do CI

| Secret | Configurado em |
|---|---|
| `GITHUB_TOKEN` | Automático pelo GitHub (packages: write) |

Não há outros secrets no CI — o `.env` de produção fica no VPS em `/opt/revendaclick/.env` e é lido localmente pelo runner.

---

## Self-Hosted Runner

O runner fica no próprio VPS Hostinger.

Para verificar:
```bash
systemctl status actions.runner.*
```

Para reiniciar se travar:
```bash
sudo systemctl restart actions.runner.*
```

---

## Fluxo de Desenvolvimento Recomendado

```
1. Criar branch: git checkout -b feature/nome
2. Desenvolver e testar localmente
3. Abrir PR → GitHub Actions roda apenas test-backend
4. Revisar e mergear na main
5. CI dispara automaticamente: test → build → deploy
6. Verificar deploy no GitHub Actions → Jobs → Deploy
7. Confirmar em: https://api.revendaclick.com.br/health
```

---

## Quando o CI Falha

| Passo | Causa comum | Solução |
|---|---|---|
| test-backend | Código quebrado | Corrigir e fazer push |
| build-push | Dockerfile inválido | Testar `docker build ./backend` localmente |
| deploy: git pull | Conflito de merge | Resolver conflito no VPS manualmente |
| deploy: nginx -t | nginx.conf inválido | Testar config localmente com `nginx -t` |
| deploy: docker pull | Imagem não encontrada | Verificar se build-push concluiu |
| wait healthy | Backend não subiu | Ver logs: `docker compose logs backend --tail=50` |
| smoke-test | Algo falhou na produção | Ver output do smoke-test no CI |
