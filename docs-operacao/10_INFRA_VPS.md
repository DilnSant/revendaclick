# 10 — INFRA VPS

> Baseado em: `nginx.conf`, `vps-setup.sh`, `docker-compose.prod.yml`, `scripts/`.

---

## VPS

| Atributo | Valor |
|---|---|
| Provedor | Hostinger |
| Sistema | Linux Ubuntu |
| Localização do projeto | `/opt/revendaclick/` |

---

## Domínios e Roteamento

| Domínio | Destino | Como chega |
|---|---|---|
| `revendaclick.com.br` | Frontend Next.js (Vercel) | Vercel — auto-deploy via GitHub push `main` |
| `app.revendaclick.com.br` | Frontend Next.js (Vercel) | Vercel — auto-deploy via GitHub push `main` |
| `api.revendaclick.com.br` | Backend Go | Nginx → 127.0.0.1:8080 |
| `evolution.revendaclick.com.br` | Evolution API | Nginx → 127.0.0.1:8081 |

---

## Nginx

**Arquivo:** `/etc/nginx/nginx.conf` (copiado de `nginx.conf` do repositório durante deploy)

### Configurações globais

| Parâmetro | Valor | Por quê |
|---|---|---|
| `worker_processes auto` | Auto | Um worker por CPU |
| `worker_connections 2048` | 2048 | Suporta alto volume |
| `worker_rlimit_nofile 65535` | 65535 | Evita "too many files" |
| `use epoll` | Ativo | I/O eficiente no Linux |
| `keepalive_timeout 65` | 65s | Reutiliza conexões TCP |
| `server_tokens off` | Off | Não expõe versão Nginx |
| `client_max_body_size 64m` | 64MB (api) / 50MB (evolution) | Uploads de fotos |

### Rate Limiting (Nginx)

| Zone | Rate | Burst | Uso |
|---|---|---|---|
| `api_limit` | 30r/s | 60 | Todas as rotas API |
| `evo_limit` | 60r/s | 120 | Evolution API |
| `webhook_limit` | 5r/s | 10 | Webhooks |
| `conn_limit` | — | 100/200 | Max conexões por IP |

### Cache

```
/api/public/*  → cache 60s para 200, 10s para 404
Chave: $uri$is_args$args (query string diferencia)
Localização: /var/cache/nginx (max 100MB)
```

### Gzip

Comprime: JSON, CSS, JS, XML, SVG
Nível: 5 (equilíbrio CPU vs tamanho)
Mínimo: 1024 bytes

### Security Headers (api.revendaclick.com.br)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Request-ID: <uuid único>
```

### WebSocket (evolution.revendaclick.com.br)

```
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_read_timeout 86400s;   # 24h — conexão WhatsApp persistente
proxy_buffering off;         # obrigatório para WebSocket
```

---

## SSL

| Atributo | Valor |
|---|---|
| Provider | Let's Encrypt (Certbot) |
| Cert path | `/etc/letsencrypt/live/api.revendaclick.com.br/` |
| Domínios cobertos | `api.revendaclick.com.br` e `evolution.revendaclick.com.br` |
| Renovação | Automática via certbot timer systemd |
| ACME challenge | `/.well-known/acme-challenge/` → `/var/www/html` |

**Para renovar manualmente:**
```bash
sudo certbot renew --nginx
```

**Para novo domínio:**
```bash
sudo certbot --nginx -d novo-dominio.com.br
```

---

## Upstreams Nginx

```nginx
upstream rc_backend {
    server 127.0.0.1:8080;
    keepalive 32;          # 32 conexões keepalive com backend
}

upstream rc_evolution {
    server 127.0.0.1:8081;
    keepalive 16;
}
```

As portas são `127.0.0.1:*` — apenas acessíveis localmente. Internet acessa via Nginx na porta 443.

---

## Métricas protegidas pelo Nginx

```nginx
location = /metrics {
    allow 127.0.0.1;
    allow ::1;
    deny all;              # bloqueia qualquer IP externo
    proxy_pass http://rc_backend/metrics;
}
```

Para scraping externo de métricas, é necessário configurar VPN ou acesso SSH tunnel.

---

## Provisionamento Inicial do VPS

**Script:** `vps-setup.sh`

O que instala/configura:
1. Docker CE + Docker Compose V2
2. Nginx
3. Certbot + plugin nginx
4. UFW firewall (permite 22, 80, 443)
5. Estrutura de diretórios `/opt/revendaclick/`
6. Gera `METRICS_TOKEN` se ausente

```bash
bash vps-setup.sh
```

---

## Operações no VPS

```bash
# Ver status dos containers
docker compose -f docker-compose.production.yml ps

# Ver logs do backend
docker compose -f docker-compose.production.yml logs backend --tail=100 -f

# Ver logs Evolution
docker compose -f docker-compose.production.yml logs evolution --tail=100

# Restartar backend
docker compose -f docker-compose.production.yml restart backend

# Recarregar Nginx sem downtime
sudo nginx -t && sudo nginx -s reload

# Ver espaço em disco
df -h

# Ver uso de memória
free -h

# Ver processos Docker
docker stats
```

---

## Backups

Executado diariamente às 03:00 UTC pelo container `backup` em `docker-compose.prod.yml`:

1. `pg_dump $DATABASE_URL` → arquivo com timestamp
2. Salvo em `/opt/revendaclick/backups/`
3. Se `BACKUP_S3_BUCKET` configurado → upload para S3

Para fazer backup manual:
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

## Firewall (UFW)

| Porta | Protocolo | Origem | Motivo |
|---|---|---|---|
| 22 | TCP | qualquer | SSH |
| 80 | TCP | qualquer | HTTP → redireciona para HTTPS |
| 443 | TCP | qualquer | HTTPS |
| 8080 | — | BLOQUEADO | Acesso interno via Nginx |
| 8081 | — | BLOQUEADO | Acesso interno via Nginx |

---

## Self-Hosted Runner (GitHub Actions)

O VPS tem um runner do GitHub Actions instalado.

Quando CI/CD faz deploy, o runner:
1. Recebe job do GitHub
2. Executa `git pull`, `nginx reload`, `docker compose pull/up`
3. Aguarda health check
4. Roda smoke test

Para verificar status do runner:
```bash
# Na VPS
systemctl status actions.runner.*
```
