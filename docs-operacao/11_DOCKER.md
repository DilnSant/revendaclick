# 11 — DOCKER

> Baseado em: `docker-compose.yml`, `docker-compose.prod.yml`, `docker-compose.production.yml`, `backend/Dockerfile`.

---

## Regra absoluta

Sempre usar **Docker Compose V2**:
```bash
docker compose [comando]  # correto
docker-compose [comando]  # ERRADO — legado
```

---

## Ambientes e Arquivos

| Arquivo | Ambiente | Quando usar |
|---|---|---|
| `docker-compose.yml` | Desenvolvimento local | `docker compose up` |
| `docker-compose.prod.yml` | Produção (referência) | Deploy manual |
| `docker-compose.production.yml` | Produção (CI/CD) | Usado pelo ci.yml |
| `docker-compose.staging.yml` | Staging | Testes pré-produção |

---

## Desenvolvimento (`docker-compose.yml`)

### backend

```yaml
build: ./backend          # compila localmente
ports: "8080:8080"        # porta exposta para dev
env_file: ./backend/.env  # carrega variáveis locais
environment:
  ENV: development
  ALLOWED_ORIGINS: http://localhost:3000,http://localhost
  EVOLUTION_API_URL: http://evolution:8080
volumes:
  - backend_logs:/app/logs
healthcheck:
  test: wget -qO- http://localhost:8080/health
  interval: 10s, timeout: 5s, retries: 5, start_period: 15s
restart: unless-stopped
```

### evolution

```yaml
image: atendai/evolution-api:latest
ports: "8081:8080"          # acesso direto em dev
environment:
  DATABASE_PROVIDER: postgresql
  DATABASE_CONNECTION_URI: $EVOLUTION_DATABASE_URL   # porta 5432
  WEBHOOK_GLOBAL_URL: http://backend:8080/api/webhooks/evolution
  LOG_LEVEL: ERROR
volumes:
  - evolution_instances:/evolution/instances
  - evolution_store:/evolution/store
healthcheck:
  test: wget -qO- http://127.0.0.1:8080/
  interval: 30s, start_period: 40s
restart: unless-stopped
```

---

## Produção (`docker-compose.production.yml`)

### Diferenças em relação ao dev

| Parâmetro | Dev | Produção |
|---|---|---|
| Porta backend | `8080:8080` (pública) | `127.0.0.1:8080:8080` (local only) |
| Porta evolution | `8081:8080` (pública) | `127.0.0.1:8081:8080` (local only) |
| Imagem backend | Build local | `${BACKEND_IMAGE}:${IMAGE_TAG}` GHCR |
| Limites memória | — | Backend: max 256m / Evolution: max **768m** |
| ENV | development | production |
| Evolution SERVER_URL | localhost | `https://evolution.revendaclick.com.br` |
| QRCODE_LIMIT | — | 30 |
| NODE_OPTIONS (Evolution) | — | `--max-old-space-size=400` |
| Redis | — | `redis:7-alpine` (cache Evolution) |

### Redis (só em produção)

```yaml
redis:
  image: redis:7-alpine
  container_name: rc_redis
  command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
  restart: unless-stopped
  networks:
    - revendaclick
  deploy:
    resources:
      limits:
        memory: 160m
```

Usado pela Evolution API como cache de instâncias:
- `CACHE_REDIS_ENABLED: "true"`
- `CACHE_REDIS_URI: "redis://rc_redis:6379"`
- `CACHE_REDIS_SAVE_INSTANCES: "true"`

Redis não tem porta exposta — apenas acessível pela rede interna Docker.

### backup (só em produção)

```yaml
image: alpine:3.20
# Roda pg_dump todo dia às 03:00 UTC
# Salva em /opt/revendaclick/backups/
# Opcional: upload S3
environment:
  DATABASE_URL: $DATABASE_URL
  BACKUP_S3_BUCKET: $BACKUP_S3_BUCKET  # opcional
  AWS_*: credenciais S3
volumes:
  - /opt/revendaclick/backups:/opt/revendaclick/backups
  - /opt/revendaclick/backup.sh:/scripts/backup.sh:ro
limits:
  memory: 128m
```

---

## Rede Docker

```yaml
networks:
  revendaclick:
    driver: bridge
```

Todos os serviços estão na mesma rede `revendaclick`. Comunicação interna:
- Backend alcança Evolution em: `http://evolution:8080`
- Evolution envia webhook ao backend em: `http://backend:8080/api/webhooks/evolution`

---

## Volumes

| Volume | Conteúdo | Perda se remover |
|---|---|---|
| `backend_logs` | Logs do servidor Go | Apenas logs históricos |
| `evolution_instances` | Instâncias WhatsApp ativas | **GRAVE** — reconexão necessária para todos |
| `evolution_store` | Store de mensagens | Histórico de mensagens |

Redis não tem volume persistente — os dados de cache são perdidos ao reiniciar (comportamento esperado e seguro).

**Nunca remover `evolution_instances` em produção** sem avisar os clientes sobre reconexão do WhatsApp.

---

## Dockerfile Backend

Localização: `backend/Dockerfile`

Multi-stage build:
```dockerfile
# Stage 1: compilação
FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server ./cmd/api/...

# Stage 2: imagem final
FROM alpine:latest
RUN apk add --no-cache ca-certificates wget
COPY --from=builder /app/server /app/server
EXPOSE 8080
CMD ["/app/server"]
```

Tamanho final: ~15-20MB.

---

## Registry de Imagens

- **Registro:** GitHub Container Registry (GHCR)
- **Imagem backend:** `ghcr.io/dilnsant/revendaclick-backend`
- **Tags:** `:latest` e `:<github-sha>` (permite rollback preciso)
- **Username:** deve ser lowercase (`dilnsant`, não `DilnSant`)

---

## Comandos Úteis

```bash
# Iniciar dev
docker compose up -d

# Ver status
docker compose ps

# Logs em tempo real
docker compose logs backend -f
docker compose logs evolution -f

# Restart de um serviço
docker compose restart backend

# Rebuild após mudança de código
docker compose up --build backend

# Parar tudo
docker compose down

# Parar e remover volumes (CUIDADO — apaga dados)
docker compose down -v

# Ver uso de recursos
docker stats

# Executar comando no container
docker compose exec backend sh

# Ver imagens disponíveis
docker images | grep revendaclick

# Limpar imagens antigas (> 24h)
docker image prune -f --filter "until=24h"
```

---

## Healthchecks

Todos os serviços têm healthcheck configurado. O CI/CD aguarda o container ficar `healthy` antes de prosseguir.

Para verificar:
```bash
docker inspect backend --format='{{.State.Health.Status}}'
# Esperado: healthy
```

Estados possíveis: `starting` → `healthy` | `unhealthy`

Se ficar `unhealthy` após `start_period`:
```bash
docker compose logs backend --tail=50  # verificar erros
```

---

## Riscos Docker

| Ação | Risco |
|---|---|
| `docker compose down -v` | Remove volumes — perde evolution_instances |
| `docker compose up` sem `--env-file` | Serviços sobem sem vars de produção |
| Expor porta 8080 publicamente em prod | Backend sem SSL e sem rate limit Nginx |
| Usar `docker-compose` (legado) | Pode ter comportamento diferente em V2 |
| Não usar `restart: unless-stopped` | Containers não sobem após reboot do VPS |
