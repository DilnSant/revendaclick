# OBSERVABILIDADE — RevendaClick

> Extraído de: `backend/internal/observability/`, `backend/internal/betterstack/syncer.go`, `backend/cmd/api/main.go`, `frontend/instrumentation.ts`, `frontend/lib/error-tracking.ts`, `frontend/lib/logger.ts`.

---

## Visão Geral

O sistema possui 3 camadas de observabilidade:
1. **Métricas** — Prometheus (backend Go, custom registry)
2. **Logs** — Zap (backend) + BetterStack opcional
3. **Error tracking** — `/api/log/error` (frontend client-side)

---

## 1. Métricas — Prometheus

### Endpoint

```
GET /metrics
Authorization: Bearer <METRICS_TOKEN>
```

**Arquivo:** `backend/internal/observability/handler.go`

Nginx bloqueia `/metrics` para IPs não-localhost:
```nginx
location = /metrics {
    allow 127.0.0.1;
    allow ::1;
    deny all;
    proxy_pass http://rc_backend/metrics;
}
```

Se `METRICS_TOKEN` vazio → sem autenticação (apenas nginx protege).

### Registry

**Arquivo:** `backend/internal/observability/metrics.go`

Registry customizado (não usa `prometheus/client_golang`). Implementa o formato de texto Prometheus puro via `WritePrometheus(w io.Writer)`.

### Métricas HTTP

| Métrica | Tipo | Labels | Descrição |
|---|---|---|---|
| `http_requests_total` | Counter | method, path, status | Total de requests por método/rota/status |
| `http_request_duration_ms` | Histogram | method, path | Latência em ms |
| `http_requests_in_flight` | Gauge | — | Requests em andamento |

**Buckets de latência (ms):** 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, +Inf

**Middleware:** `backend/internal/observability/middleware.go`
- Incrementa `http_requests_in_flight` na entrada, decrementa na saída
- Registra duração e status code via `ObserveRequest(method, path, statusCode, durationMs)`

### Métricas de Pool de Banco

**Arquivo:** `backend/internal/observability/collector.go` — `StartDBCollector(pool)`

Coletadas via background goroutine contínua:

| Métrica | Tipo | Descrição |
|---|---|---|
| `db_pool_acquired_conns` | Gauge | Conexões em uso |
| `db_pool_idle_conns` | Gauge | Conexões ociosas |
| `db_pool_max_conns` | Gauge | Máximo configurado (10) |
| `db_pool_wait_count` | Gauge | Fila de espera por conexão |

### Métricas de Negócio

**Arquivo:** `backend/internal/observability/collector.go` — `StartBusinessCollector(pool, logger)`

Coletadas a cada **60 segundos** via polling ao banco:

| Métrica | Tipo | Labels | Query |
|---|---|---|---|
| `business_tenants_total` | Gauge | — | `SELECT COUNT(*) FROM tenants` |
| `business_subscriptions_by_status` | Gauge | status | `SELECT status, COUNT(*) FROM subscriptions GROUP BY status` |

---

## 2. Logs — Zap + BetterStack

### Backend

**Arquivo:** `backend/cmd/api/main.go`

| Modo | Formato |
|---|---|
| `ENV=development` | `zap.NewDevelopment()` — texto colorido |
| `ENV=production` | `zap.NewProduction()` — JSON estruturado |

**Campos globais em produção:**
```json
{"service": "revendaclick-backend", "env": "production"}
```

**BetterStack (opcional):**
- Ativado quando `BETTER_STACK_SOURCE_TOKEN` está preenchido
- Arquivo: `backend/internal/betterstack/syncer.go`
- Implementação: `zapcore.WriteSyncer` que envia logs via HTTP para BetterStack ingestion endpoint
- Nível mínimo: `INFO`
- Modo: **tee** (stdout continua funcionando simultaneamente)

**Middleware de log:** `backend/internal/middleware/logger.go`

Loga cada request com:
- método, path, status code, latência, IP, Request-ID

### Frontend Server

**Arquivo:** `frontend/instrumentation.ts`

OpenTelemetry / BetterStack init para Next.js server-side.

**Variáveis necessárias:**
- `BETTER_STACK_SOURCE_TOKEN`
- `BETTER_STACK_INGESTING_URL`

### Frontend Client (Error Tracking)

**Arquivo:** `frontend/lib/error-tracking.ts`

Captura erros não tratados no browser e envia para `POST /api/log/error`.

**Arquivo handler:** `frontend/app/api/log/error/route.ts`

---

## 3. Healthchecks

### Backend Go

```
GET /health
→ { "status": "ok", "db": "ok" }
→ 503 se ping do banco falhar (timeout 3s)

GET /api/v1/health
→ { "status": "ok", "version": "1" }
```

### Docker Healthcheck

```yaml
healthcheck:
  test: ["CMD", "wget", "-qO-", "http://localhost:8080/health"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 15s
```

### Frontend Next.js

```
GET /api/health
```

---

## 4. Smoke Test (pós-deploy)

10 verificações automatizadas. Veja detalhes em `DEPLOY.md`.

Executado automaticamente pelo CI após cada deploy bem-sucedido.

---

## Onde Scraper Prometheus Deve Apontar

Para integrar com Grafana/Prometheus externo:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'revendaclick-backend'
    scheme: https
    static_configs:
      - targets: ['api.revendaclick.com.br']
    metrics_path: /metrics
    authorization:
      credentials: '<METRICS_TOKEN>'
```

**Nota:** O endpoint `/metrics` só é acessível via `127.0.0.1` pelo Nginx. Para scraping externo, é necessário configurar uma rota especial no Nginx ou usar um exportador interno.

---

## Riscos ao Alterar Observabilidade

| Mudança | Risco |
|---|---|
| Remover `StartBusinessCollector` | Métricas de negócio param de ser coletadas |
| Deixar `METRICS_TOKEN` vazio em produção | Qualquer IP pode ver métricas (nginx ainda bloqueia, mas risco se nginx falhar) |
| Remover middleware `observability.Middleware()` | `http_requests_total` e `http_request_duration_ms` param de ser registrados |
| Alterar `StartDBCollector` sem pool passado | Goroutine sobe mas não coleta nada — silencioso |
| Trocar formato de log em produção para texto | BetterStack ingestion quebra (espera JSON) |
