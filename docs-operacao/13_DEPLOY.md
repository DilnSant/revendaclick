# 13 — DEPLOY

> Baseado em: `scripts/deploy-production.sh`, `scripts/smoke-test.sh`, `.github/workflows/ci.yml`.

---

## Visão Geral

Existem dois caminhos de deploy:

| Via | Quando usar |
|---|---|
| **CI/CD automático** (GitHub Actions) | Todo push para `main` — caminho normal |
| **Script manual** (`deploy-production.sh`) | Emergências, rollback, deploy fora do CI |

---

## Deploy Automático (CI/CD)

Ver `12_CICD.md` para detalhes completos.

Resumo:
```
git push origin main
→ test-backend (ubuntu-latest)
→ build-push (GHCR tag :latest + :sha)
→ deploy (self-hosted runner no VPS)
→ wait healthy (120s)
→ smoke-test.sh
```

---

## Deploy Manual (VPS)

**Script:** `scripts/deploy-production.sh`
**Executar como:** root no VPS
**Localização no VPS:** `/opt/revendaclick/scripts/deploy-production.sh`

### Uso

```bash
# Deploy com tag :latest
bash /opt/revendaclick/scripts/deploy-production.sh

# Deploy com SHA específico (rollback)
bash /opt/revendaclick/scripts/deploy-production.sh abc1234def
```

### Passos executados

```
1. git pull origin main
2. Backup do nginx.conf atual → nginx.conf.bak.<timestamp>
3. Copia nginx.conf do repo → /etc/nginx/nginx.conf
4. nginx -t && systemctl reload nginx
5. Login no GHCR (se GHCR_TOKEN definido)
6. docker compose pull backend (nova imagem)
7. docker compose up -d --remove-orphans --force-recreate backend
8. Aguarda rc_backend ficar healthy (máx 24 tentativas × 5s = 120s)
9. curl https://api.revendaclick.com.br/health → valida "status":"ok"
10. docker image prune -f --filter "until=24h"
11. docker compose ps (status final)
```

### Variáveis usadas pelo script

```bash
APP_DIR="/opt/revendaclick"
COMPOSE_FILE="$APP_DIR/docker-compose.production.yml"
ENV_FILE="$APP_DIR/.env"
IMAGE_TAG="${1:-latest}"   # primeiro argumento, padrão latest
BACKEND_IMAGE              # lido do .env
GHCR_TOKEN                 # opcional — login no GHCR
```

---

## Rollback Manual

```bash
# Na VPS — substituir <sha-anterior> pelo SHA desejado
cd /opt/revendaclick

BACKEND_IMAGE=ghcr.io/dilnsant/revendaclick-backend \
IMAGE_TAG=<sha-anterior> \
docker compose -f docker-compose.production.yml --env-file .env up -d --force-recreate backend
```

SHAs disponíveis: GitHub → repositório → Packages → revendaclick-backend → tags

---

## Smoke Test

**Script:** `scripts/smoke-test.sh`
**Uso no CI:** `bash /opt/revendaclick/scripts/smoke-test.sh https://api.revendaclick.com.br`

### 10 verificações

| # | Categoria | O que valida |
|---|---|---|
| 1 | TLS válido | Certificado com > 14 dias de validade (api + evolution) |
| 2 | Backend health | `/health` retorna `"status":"ok"` + `/api/v1/health` |
| 3 | Security headers | HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection |
| 4 | Public API | `/api/plans` retorna 200 + `/api/public/invalido/` retorna 404 |
| 5 | Auth enforcement | `/api/leads` sem token retorna 401 |
| 6 | Rate limiting | Header `X-Request-ID` presente nas respostas |
| 7 | Webhook rejection | `/api/webhooks/evolution` sem token retorna 401 |
| 8 | Metrics protegido | `/metrics` sem token retorna 401 ou 403 |
| 9 | Nginx cache | `/api/public/*` tem header `X-Cache-Status` |
| 10 | Evolution reachável | `https://evolution.revendaclick.com.br/` responde |

Saída: `Exit 0` = tudo passou. `Exit 1` = alguma verificação falhou.

---

## SSL

**Script:** `scripts/deploy-ssl.sh`

Provisionamento inicial via Certbot:
```bash
sudo certbot --nginx -d api.revendaclick.com.br -d evolution.revendaclick.com.br
```

Renovação automática: certbot timer systemd (verificação diária).

Renovação manual:
```bash
sudo certbot renew --nginx
```

---

## Outros Scripts

| Script | Propósito |
|---|---|
| `scripts/smoke-test.sh` | Validação pós-deploy (10 categorias) |
| `scripts/deploy-ssl.sh` | Provisionar SSL via Certbot |
| `scripts/validate-production.sh` | Verificação geral de produção |
| `scripts/validate-billing.sh` | Validação de endpoints billing |
| `scripts/staging-deploy.sh` | Deploy para ambiente staging |
| `scripts/create-staging-admin.sh` | Cria usuário admin no staging |
| `scripts/resume-step7.sh` | Script de setup parcial |

---

## Verificações Pós-Deploy

```bash
# Health da API
curl https://api.revendaclick.com.br/health

# Status dos containers
docker compose -f /opt/revendaclick/docker-compose.production.yml ps

# Logs recentes do backend
docker compose -f /opt/revendaclick/docker-compose.production.yml logs backend --tail=50

# Smoke test completo
bash /opt/revendaclick/scripts/smoke-test.sh https://api.revendaclick.com.br
```

---

## Quando o Deploy Falha

| Sintoma | Diagnóstico |
|---|---|
| Backend não fica healthy | `docker compose logs backend --tail=50` |
| nginx -t falha | Verificar nginx.conf — rollback com bak: `cp /etc/nginx/nginx.conf.bak.* /etc/nginx/nginx.conf` |
| docker pull falha | Verificar se build-push terminou no CI + login GHCR |
| smoke-test falha | Ver output detalhado do smoke-test no CI |
| TLS inválido | `sudo certbot renew --nginx --force-renewal` |
