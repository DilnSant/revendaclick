# 14 — OBSERVABILIDADE

> Baseado em: `backend/internal/observability/`, `backend/internal/betterstack/`, `backend/cmd/api/main.go`.

---

## Stack de Observabilidade

| Componente | Tecnologia | Onde |
|---|---|---|
| Métricas | Prometheus (custom — sem lib externa) | `/metrics` no backend |
| Logs (dev) | Zap JSON → stdout | Docker logs |
| Logs (prod) | Zap + BetterStack HTTP tee | stdout + BetterStack cloud |
| Coleta DB | Goroutine `StartDBCollector` | Interno Go |
| Coleta negócio | Goroutine `StartBusinessCollector` | Interno Go |

---

## Prometheus

**Endpoint:** `GET /metrics`
**Proteção:** Bearer `METRICS_TOKEN` + Nginx bloqueia IPs externos (apenas 127.0.0.1)
**Formato:** Prometheus text exposition format

### Métricas registradas

| Métrica | Tipo | Descrição |
|---|---|---|
| `http_requests_total` | Counter | Total de requests por method+path+status |
| `http_request_duration_ms` | Histogram | Latência em ms por method+path |
| `http_requests_in_flight` | Gauge | Requests sendo processados agora |
| `db_pool_acquired_conns` | Gauge | Conexões de DB atualmente em uso |
| `db_pool_idle_conns` | Gauge | Conexões de DB ociosas |
| `db_pool_max_conns` | Gauge | Máximo de conexões configurado (=10) |
| `db_pool_wait_count` | Gauge | Total acumulado de esperas por conexão |
| `business_tenants_total` | Gauge | Total de tenants no banco |
| `business_subscriptions_by_status` | Gauge(labeled) | Assinaturas agrupadas por status |

### Buckets de histograma (ms)

```
5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, +Inf
```

### Collectors

**DB Collector** (`StartDBCollector`) — lê `pgxpool.Stat()` continuamente:
- Atualiza `db_pool_acquired_conns`, `db_pool_idle_conns`, `db_pool_max_conns`, `db_pool_wait_count`

**Business Collector** (`StartBusinessCollector`) — consulta o banco a cada 60s:
```sql
SELECT COUNT(*) FROM tenants                          -- → business_tenants_total
SELECT status, COUNT(*) FROM subscriptions GROUP BY status  -- → business_subscriptions_by_status{status="active"} etc
```
Timeout de cada consulta: 5 segundos.

### Prometheus implementado do zero

O projeto **não usa** `prometheus/client_golang`. Tem implementação própria em:
- `backend/internal/observability/metrics.go` — tipos Counter, Gauge, Histogram, Registry
- `backend/internal/observability/handler.go` — serialização Prometheus text format
- `backend/internal/observability/middleware.go` — intercepta requests no Gin
- `backend/internal/observability/vars.go` — registra métricas no init()
- `backend/internal/observability/collector.go` — goroutines de coleta

---

## Logs (Zap)

**Biblioteca:** `go.uber.org/zap v1.28.0`
**Formato:** JSON estruturado

### Configuração por ambiente

| ENV | Logger |
|---|---|
| `development` | `zap.NewDevelopment()` — texto legível |
| `production` | `zap.NewProduction()` — JSON otimizado |

### BetterStack (produção)

Se `BETTER_STACK_SOURCE_TOKEN` estiver definido, os logs são enviados em paralelo:

```
stdout (sempre) ← zap → BetterStack HTTP (se token configurado)
```

**Como funciona:** `betterstack.NewSyncer(token)` cria um `zapcore.WriteSyncer` que faz HTTP POST para BetterStack. O core é composto via `zapcore.NewTee(core1, core2)` — não há perda de performance em stdout.

**Frontend BetterStack:** variável `BETTER_STACK_SOURCE_TOKEN` no frontend é independente (logs do Next.js server-side).

---

## Como Acessar Métricas

### Via SSH tunnel (acesso externo protegido)

```bash
# Na sua máquina local
ssh -L 9090:127.0.0.1:8080 user@vps-ip
curl -H "Authorization: Bearer $METRICS_TOKEN" http://localhost:9090/metrics
```

### Direto no VPS

```bash
curl -H "Authorization: Bearer $METRICS_TOKEN" http://127.0.0.1:8080/metrics
```

---

## Como Ver Logs

```bash
# Logs do backend (últimas 100 linhas, seguindo)
docker compose -f /opt/revendaclick/docker-compose.production.yml logs backend -f --tail=100

# Logs do Evolution
docker compose -f /opt/revendaclick/docker-compose.production.yml logs evolution -f --tail=100

# Logs filtrados por nível de erro
docker compose -f /opt/revendaclick/docker-compose.production.yml logs backend --tail=200 | grep '"level":"error"'
```

---

## Alertas (Atualmente Manual)

Não há sistema de alertas automático configurado. Para monitorar:

1. BetterStack: dashboard em `logs.betterstack.com` (se token configurado)
2. Health check externo: configurar uptime monitor apontando para `https://api.revendaclick.com.br/health`
3. CI/CD: smoke test pós-deploy detecta falhas imediatamente

---

## Riscos de Observabilidade

| Ação | Risco |
|---|---|
| Remover `METRICS_TOKEN` | Métricas ficam abertas (Nginx bloqueia externos, mas risco interno existe) |
| Alterar `StartBusinessCollector` | Queries no banco a cada 60s — ajustar timeout se banco estiver lento |
| Desativar BetterStack | Logs só ficam em stdout (Docker logs, perdidos em reboot sem volume) |
| Alterar buckets do histograma | Dados históricos ficam incompatíveis com queries anteriores |
