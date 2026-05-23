# INFRA — RevendaClick

> Extraído de: `docker-compose.yml`, `docker-compose.prod.yml`, `docker-compose.production.yml`, `docker-compose.staging.yml`, `nginx.conf`, `vps-setup.sh`.

---

## Visão Geral da Infraestrutura

```
Internet
    │
    ▼
VPS Hostinger (Linux)
    │
    ├── Nginx (host, SSL Let's Encrypt)
    │   ├── api.revendaclick.com.br → 127.0.0.1:8080 (backend)
    │   └── evolution.revendaclick.com.br → 127.0.0.1:8081 (evolution)
    │
    └── Docker Compose
        ├── backend (Go, porta 127.0.0.1:8080)
        ├── evolution (WhatsApp, porta 127.0.0.1:8081)
        └── backup (alpine, sem porta — cron interno)
```

**Frontend:** hospedado via Coolify (Next.js standalone). Acessa backend via `INTERNAL_API_URL`.

**Banco de dados:** Supabase Cloud (externo ao VPS). PostgreSQL + PgBouncer gerenciados pelo Supabase.

---

## Docker — Desenvolvimento (`docker-compose.yml`)

### Serviço: `backend`
- **Build:** `./backend/Dockerfile` (multi-stage Go → alpine)
- **Porta:** `8080:8080` (acesso direto)
- **Env file:** `./backend/.env`
- **ENV fixas:** `ENV=development`, `ALLOWED_ORIGINS=http://localhost:3000,http://localhost`
- **Evolution URL:** `http://evolution:8080` (rede interna)
- **Volume:** `backend_logs:/app/logs`
- **Healthcheck:** `wget -qO- http://localhost:8080/health` — interval 10s, timeout 5s, retries 5, start_period 15s
- **Restart:** `unless-stopped`

### Serviço: `evolution`
- **Imagem:** `atendai/evolution-api:latest`
- **Porta:** `8081:8080`
- **Database:** `DATABASE_CONNECTION_URI` → PostgreSQL session pooler (5432)
- **Webhook global:** `http://backend:8080/api/webhooks/evolution`
- **Volume:** `evolution_instances:/evolution/instances`, `evolution_store:/evolution/store`
- **Healthcheck:** `wget -qO- http://127.0.0.1:8080/` — interval 30s, start_period 40s
- **Restart:** `unless-stopped`

### Rede
- `revendaclick` — bridge network isolada

---

## Docker — Produção (`docker-compose.prod.yml`)

### Serviço: `backend`
- **Imagem:** `${BACKEND_IMAGE}:${IMAGE_TAG:-latest}` (GHCR)
- **Porta:** `127.0.0.1:8080:8080` (bind local — Nginx faz proxy)
- **Limites de memória:** max 256m, reservado 64m
- **ENV:** todas via variáveis de ambiente (sem env_file — segurança)
- **Healthcheck:** idêntico ao dev

### Serviço: `evolution`
- **Imagem:** `atendai/evolution-api:latest`
- **Porta:** `127.0.0.1:8081:8080` (bind local)
- **SERVER_URL:** `https://evolution.revendaclick.com.br` (público)
- **DATABASE:** usa session pooler 5432 (Prisma + advisory locks)
- **QRCODE_LIMIT:** 30
- **Limites:** max 512m, reservado 128m

### Serviço: `backup`
- **Imagem:** `alpine:3.20`
- **Função:** `pg_dump` diário às 03:00 UTC
- **Scheduler:** loop shell com `sleep` calculado para próximo 03:00
- **Script:** `/scripts/backup.sh` (montado de `/opt/revendaclick/backup.sh`)
- **Backup local:** `/opt/revendaclick/backups`
- **Backup S3:** opcional — requer `BACKUP_S3_BUCKET`, `AWS_*`
- **Limites:** max 128m

---

## Nginx — Configuração Completa

**Arquivo:** `nginx.conf` → deploy em `/etc/nginx/nginx.conf`

### Configurações Globais

| Parâmetro | Valor | Motivo |
|---|---|---|
| `worker_processes` | `auto` | Um worker por CPU |
| `worker_connections` | `2048` | Alto volume esperado |
| `worker_rlimit_nofile` | `65535` | Evita "too many open files" |
| `use epoll` | ativo | I/O mais eficiente no Linux |
| `multi_accept on` | ativo | Aceita múltiplas conexões por evento |
| `keepalive_timeout` | `65` | Reutiliza conexões |
| `server_tokens off` | ativo | Não expõe versão do nginx |
| `client_max_body_size` | `64m` (api) / `50m` (evolution) | Uploads de mídia |

### Gzip

| Parâmetro | Valor |
|---|---|
| `gzip_comp_level` | 5 |
| `gzip_min_length` | 1024 bytes |
| Tipos comprimidos | text/plain, text/css, text/xml, text/javascript, application/json, application/javascript, application/xml, application/rss+xml, image/svg+xml |

### Rate Limiting

| Zone | Memória | Rate | Aplicação |
|---|---|---|---|
| `api_limit` | 20m | 30r/s | `/api/*` — burst=60 |
| `evo_limit` | 10m | 60r/s | Evolution — burst=120 |
| `webhook_limit` | 5m | 5r/s | `/api/v1/webhooks/*` — burst=10 |
| `conn_limit` | 10m | — | Max conn/IP: 100 (api), 200 (evo) |

### Cache Nginx

```nginx
proxy_cache_path /var/cache/nginx levels=1:2
                 keys_zone=api_cache:10m max_size=100m
                 inactive=60m use_temp_path=off;
```

- Aplicado em: `/api/public/*`
- Válido: 200→60s, 404→10s
- Chave: `$uri$is_args$args`
- `proxy_cache_use_stale`: error, timeout, updating, 500, 502, 503
- `proxy_cache_lock on`: evita thundering herd

### Domínio: `api.revendaclick.com.br`

| Location | Comportamento |
|---|---|
| `= /health` | Proxy sem rate limit, sem log |
| `= /metrics` | Allow 127.0.0.1 e ::1, deny all (acesso apenas local) |
| `~ ^/api/public/` | Proxy com cache 60s |
| `~ ^/api/v1/webhooks/` | Proxy com rate limit webhook_limit |
| `OPTIONS` (qualquer rota) | Resposta rápida CORS sem round-trip ao backend |
| `/` (demais) | Proxy ao backend com timeouts: read=30s, connect=5s, send=30s |

**Security Headers em api.revendaclick.com.br:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Request-ID: $request_id
```

### Domínio: `evolution.revendaclick.com.br`

- WebSocket upgrade: `Upgrade: $http_upgrade`, `Connection: upgrade`
- Timeout longo: `proxy_read_timeout 86400s` (WhatsApp conexões persistentes)
- `proxy_buffering off` (WebSocket)
- Rate: `evo_limit` burst=120, conn=200

---

## SSL

- **Provider:** Let's Encrypt via Certbot
- **Cert path:** `/etc/letsencrypt/live/api.revendaclick.com.br/`
- **Domínios cobertos:** `api.revendaclick.com.br` e `evolution.revendaclick.com.br` (compartilham o mesmo cert)
- **ACME challenge:** `/.well-known/acme-challenge/` → `/var/www/html`
- **Renovação:** automática via certbot timer/cron

---

## Volumes Docker

| Volume | Conteúdo |
|---|---|
| `backend_logs` | Logs estruturados do backend Go |
| `evolution_instances` | Instâncias WhatsApp persistidas |
| `evolution_store` | Store de mensagens Evolution |

---

## Upstreams Nginx

```nginx
upstream rc_backend {
    server 127.0.0.1:8080;
    keepalive 32;
}
upstream rc_evolution {
    server 127.0.0.1:8081;
    keepalive 16;
}
```

---

## Riscos ao Alterar Infra

| Mudança | Risco |
|---|---|
| Expor porta 8080/8081 publicamente (sem 127.0.0.1) | Backend acessível sem SSL e sem rate limit do Nginx |
| Remover `proxy_cache_lock on` | Thundering herd em requests concorrentes ao mesmo recurso público |
| Alterar `client_max_body_size` para menos de 2MB | Uploads de fotos de veículos falham |
| Remover header `Strict-Transport-Security` | Downgrade attack possível |
| Trocar `evolution.revendaclick.com.br` SSL path | Nginx não inicia — cert diferente para Evolution |
| Reduzir `proxy_read_timeout` na rota Evolution | Conexões WhatsApp caem prematuramente |
