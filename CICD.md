# CI/CD — RevendaClick

> Extraído exclusivamente de `.github/workflows/ci.yml`.

---

## Visão Geral

```
push ou PR → main
     │
     ▼
[Job 1] test-backend (ubuntu-latest)
     │  go mod tidy + go vet + go test -race
     │
     ▼ (somente push para main)
[Job 2] build-push (ubuntu-latest)
     │  docker buildx → GHCR
     │  tags: :latest e :${{ github.sha }}
     │
     ▼
[Job 3] deploy (self-hosted runner — VPS Hostinger)
     │  git pull + nginx reload + docker compose pull/up
     │  wait for healthy + smoke-test.sh
```

---

## Triggers

| Evento | Branch | Jobs executados |
|---|---|---|
| `push` | `main` | test-backend → build-push → deploy |
| `pull_request` | `main` | test-backend apenas |

---

## Job 1: `test-backend`

**Runner:** `ubuntu-latest`

| Step | Comando |
|---|---|
| Checkout | `actions/checkout@v4` |
| Setup Go | `actions/setup-go@v5` com `go-version-file: backend/go.mod` |
| Tidy | `cd backend && go mod tidy` |
| Vet | `cd backend && go vet ./...` |
| Test | `cd backend && go test ./... -count=1 -race -timeout 60s` |

**Cache:** `go.sum` via `cache-dependency-path`

---

## Job 2: `build-push`

**Runner:** `ubuntu-latest`
**Condição:** `github.ref == 'refs/heads/main' && github.event_name == 'push'`
**Permissões:** `contents: read`, `packages: write`

| Step | Ação |
|---|---|
| Checkout | `actions/checkout@v4` |
| Setup Buildx | `docker/setup-buildx-action@v3` |
| Login GHCR | `docker/login-action@v3` → `ghcr.io` com `GITHUB_TOKEN` |
| Build & Push | `docker/build-push-action@v6` |

**Imagem produzida:**
```
ghcr.io/dilnsant/revendaclick-backend:latest
ghcr.io/dilnsant/revendaclick-backend:<github.sha>
```

**Cache Docker:** `type=gha,scope=backend` (GitHub Actions cache)

**Context:** `./backend`

---

## Job 3: `deploy`

**Runner:** `self-hosted` (VPS Hostinger com runner GitHub instalado)
**Environment:** `production`
**Depende de:** `build-push`

### Step: Deploy

```bash
set -euo pipefail
cd /opt/revendaclick

# 1. Atualiza código no VPS
git pull origin main

# 2. Atualiza e valida nginx
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo nginx -t && sudo nginx -s reload

# 3. Pull da nova imagem backend
BACKEND_IMAGE=ghcr.io/dilnsant/revendaclick-backend \
IMAGE_TAG=<github.sha> \
docker compose -f docker-compose.production.yml --env-file .env pull backend

# 4. Sobe com zero-downtime (--remove-orphans limpa containers velhos)
BACKEND_IMAGE=ghcr.io/dilnsant/revendaclick-backend \
IMAGE_TAG=<github.sha> \
docker compose -f docker-compose.production.yml --env-file .env up -d --remove-orphans

# 5. Limpa imagens antigas (> 24h)
docker image prune -f --filter "until=24h"
```

### Step: Wait for healthy

- Tenta 24 vezes com intervalo de 5s (máximo 120s)
- Verifica: `curl https://api.revendaclick.com.br/health` → `"status":"ok"`
- Falha silenciosa (não interrompe — o smoke-test faz a verificação formal)

### Step: Smoke Test

```bash
bash /opt/revendaclick/scripts/smoke-test.sh https://api.revendaclick.com.br
```

O smoke-test (`scripts/smoke-test.sh`) verifica:
1. TLS válido (> 14 dias) — api + evolution
2. GET /health → status=ok + db=ok
3. GET /api/v1/health → status=ok
4. Security headers (HSTS, X-Content-Type-Options, X-Frame-Options)
5. GET /api/plans → 200
6. GET /api/public/nonexistent → 404
7. Auth enforcement: /api/leads, /api/vehicles, /api/billing/subscription, /api/audit → 401
8. Rate limiting: X-Request-ID presente (nginx no path)
9. Webhook: POST /api/webhooks/asaas sem token → 401 ou 400
10. Métricas: GET /metrics → 401 ou 403/000 (protegido)
11. Cache nginx: X-Cache-Status presente em /api/public/*
12. Evolution API: reachable (2xx ou 3xx)

---

## Repositório de Imagens

| Imagem | Registry | Nomenclatura |
|---|---|---|
| Backend Go | `ghcr.io/dilnsant/revendaclick-backend` | `:latest` e `:<sha>` |

**Nota:** GHCR requer username em lowercase (`dilnsant`, não `DilnSant`).

---

## Rollback Manual

O CI não tem rollback automático. Para reverter:

```bash
# No VPS
cd /opt/revendaclick
BACKEND_IMAGE=ghcr.io/dilnsant/revendaclick-backend \
IMAGE_TAG=<sha-anterior> \
docker compose -f docker-compose.production.yml --env-file .env up -d backend
```

O SHA anterior está disponível nas tags da imagem no GHCR.

---

## Arquivos de Compose por Ambiente

| Arquivo | Ambiente | Runner |
|---|---|---|
| `docker-compose.yml` | Local dev | Manual |
| `docker-compose.prod.yml` | Produção (referência) | Manual |
| `docker-compose.production.yml` | Produção (usado pelo CI) | Self-hosted runner |
| `docker-compose.staging.yml` | Staging | Manual / scripts |

---

## Riscos ao Alterar CI/CD

| Mudança | Risco |
|---|---|
| Remover `set -euo pipefail` no deploy | Erros silenciosos — deploy continua mesmo com falhas |
| Alterar `--env-file .env` | As vars de produção não são carregadas |
| Remover `--remove-orphans` | Containers obsoletos continuam rodando |
| Mudar `runs-on: self-hosted` para `ubuntu-latest` | Runner não tem acesso ao VPS — deploy falha |
| Push de imagem sem tag SHA | Impossível fazer rollback preciso |
