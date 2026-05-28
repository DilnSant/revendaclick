# 16 — EVOLUTION API (WHATSAPP)

> Baseado em: `backend/internal/evolution/`, `docker-compose.yml`, `docker-compose.prod.yml`, `nginx.conf`.

---

## O Que é a Evolution API

Evolution API é um gateway self-hosted para WhatsApp (Baileys protocol).

- Imagem Docker: `atendai/evolution-api:latest`
- Protocolo interno: WHATSAPP-BAILEYS
- Cada tenant tem uma **instância** nomeada com seu `slug`

---

## Arquitetura

```
WhatsApp Cloud
      ↓ (mensagens entram)
Evolution API (porta 8081 interna / evolution.revendaclick.com.br)
      ↓ (webhook POST)
Backend Go /api/webhooks/evolution
      ↓
upsert lead + add activity (lead_activities)
```

```
Frontend → Backend /api/evolution/*
      ↓
Evolution API REST (autenticado via EVOLUTION_API_KEY)
```

---

## Variáveis de Ambiente

| Variável | Uso |
|---|---|
| `EVOLUTION_API_URL` | URL da Evolution no Docker (`http://evolution:8080` em prod) |
| `EVOLUTION_API_KEY` | Chave global da Evolution API (header `apikey`) |

Em desenvolvimento: `http://localhost:8081`
Em produção (Docker interno): `http://evolution:8080`

---

## Rotas do Backend (Evolution)

| Método | Rota | Roles | Descrição |
|---|---|---|---|
| GET | `/api/evolution/health` | qualquer | Verifica se Evolution está acessível |
| GET | `/api/evolution/status` | qualquer | Status da instância do tenant |
| GET | `/api/evolution/qr` | qualquer | QR code para conexão WhatsApp |
| POST | `/api/evolution/connect` | owner, admin | Cria instância + retorna QR |
| DELETE | `/api/evolution/disconnect` | owner, admin | Desconecta instância do tenant |
| POST | `/api/evolution/send` | qualquer | Envia mensagem de texto |

Todas exigem JWT + tenant resolvido + subscription ativa.

---

## Fluxo: Conectar WhatsApp

```
1. POST /api/evolution/connect
2. Backend chama Evolution API: POST /instance/create (idempotente — 400 se já existe)
3. Se instância recém-criada: aguarda 2s para Evolution inicializar
4. Backend chama Evolution API: GET /instance/connect/<slug>
5. Retorna QR code em base64 (sem prefixo data:image/png;base64,)
6. Frontend exibe QR
7. Usuário escaneia com WhatsApp
8. Instância fica connected
```

---

## Fluxo: Webhook (Mensagem Recebida)

```
POST /api/webhooks/evolution
Header: apikey: <EVOLUTION_API_KEY>
Limite: 512KB por payload

Evento processado: "messages.upsert" apenas
Ignora: mensagens enviadas por nós (fromMe=true)
Ignora: grupos (@g.us)

1. Normaliza número: remove @s.whatsapp.net, filtra não-dígitos
2. Resolve tenant_id por instance slug → SELECT id FROM tenants WHERE slug = $1
3. upsert lead: se telefone existe → retorna id existente
                se não existe → INSERT leads (source='whatsapp')
4. INSERT lead_activities (type='whatsapp', description=mensagem truncada a 1000 chars)
```

---

## Fluxo: Enviar Mensagem

```
POST /api/evolution/send
Body: { "phone": "5511999999999", "message": "Olá!" }
Limite: 4096 caracteres

Backend chama Evolution API:
  POST /message/sendText/<slug>
  Body: {
    "number": "5511999999999",
    "options": { "delay": 1200, "presence": "composing" },
    "textMessage": { "text": "Olá!" }
  }
```

---

## Instâncias por Tenant

Cada tenant tem uma instância cujo nome é o **slug** da loja.

Exemplo: tenant com slug `autoclick` → instância `autoclick` no Evolution.

O backend resolve: `tenants WHERE slug = $1` para obter o `tenant_id` do webhook.

---

## QR Code — Detalhes

- Evolution v2 retorna base64 com prefixo `data:image/png;base64,`
- O backend **remove** esse prefixo antes de retornar ao frontend
- Até 3 tentativas automáticas com backoff (0s, 2s, 4s) se Evolution falhar
- Se Evolution não responder: `503 evolution_unavailable`

---

## Nginx (Evolution)

```nginx
server_name evolution.revendaclick.com.br;
proxy_pass http://rc_evolution;   # → 127.0.0.1:8081

# WebSocket obrigatório
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_read_timeout 86400s;        # 24h — conexão WhatsApp persistente
proxy_buffering off;              # obrigatório para WebSocket

# Rate limiting: 60r/s burst=120
limit_req zone=evo_limit burst=120 nodelay;
```

---

## Docker (Produção)

```yaml
evolution:
  image: evoapicloud/evolution-api:v2.3.7
  ports:
    - "127.0.0.1:8081:8080"    # apenas local — acesso via Nginx
  environment:
    DATABASE_PROVIDER: postgresql
    DATABASE_CONNECTION_URI: $EVOLUTION_DATABASE_URL   # porta 5432 (session mode)
    WEBHOOK_GLOBAL_URL: http://backend:8080/api/webhooks/evolution
    SERVER_URL: https://evolution.revendaclick.com.br
    AUTHENTICATION_API_KEY: $EVOLUTION_API_KEY
    QRCODE_LIMIT: "30"
    LOG_LEVEL: ERROR
    NODE_OPTIONS: "--max-old-space-size=400"   # heap limit — evita OOM do Node.js
    CACHE_REDIS_ENABLED: "true"
    CACHE_REDIS_URI: "redis://rc_redis:6379"
    CACHE_REDIS_SAVE_INSTANCES: "true"
  volumes:
    - evolution_instances:/evolution/instances
    - evolution_store:/evolution/store
  memory limit: 768m   # aumentado de 512m em 25/05/2026 — fix OOM (commit d17025e)
  depends_on: [redis]
```

**CRÍTICO:** Evolution usa porta 5432 (session pooler), não 6543 (transaction mode).
Prisma (usado internamente pela Evolution) requer advisory locks que não funcionam com PgBouncer.

**Redis (novo em d17025e):** A Evolution usa Redis como cache de instâncias. O serviço `rc_redis` deve estar UP antes da Evolution inicializar. O cache Redis é volátil (sem volume persistente) — perda de cache ao reiniciar é segura, as instâncias em si continuam em `evolution_instances`.

---

## Volumes Críticos

| Volume | Conteúdo | Impacto se perder |
|---|---|---|
| `evolution_instances` | Estado das instâncias WhatsApp | **GRAVE** — todos os tenants precisam reconectar |
| `evolution_store` | Histórico de mensagens | Perda de histórico |

**Nunca executar `docker compose down -v` em produção** sem avisar todos os clientes.

---

## Diagnóstico

```bash
# Ver logs da Evolution
docker compose -f docker-compose.production.yml logs evolution --tail=100 -f

# Verificar instâncias conectadas
curl -H "apikey: $EVOLUTION_API_KEY" http://127.0.0.1:8081/instance/fetchInstances

# Status de instância específica
curl -H "apikey: $EVOLUTION_API_KEY" http://127.0.0.1:8081/instance/connect/<slug>

# Health da Evolution (via backend)
curl -H "Authorization: Bearer <token>" https://api.revendaclick.com.br/api/evolution/health
```

---

## Riscos

| Ação | Risco |
|---|---|
| Alterar `EVOLUTION_API_KEY` | Webhook de entrada para de ser autenticado; backend não consegue mais chamar Evolution |
| Usar porta 6543 em `EVOLUTION_DATABASE_URL` | Evolution falha com advisory lock errors |
| Remover `evolution_instances` | Todos os tenants perdem conexão WhatsApp |
| Alterar `WEBHOOK_GLOBAL_URL` | Evolution para de enviar webhooks ao backend |
| `QRCODE_LIMIT` muito baixo | QR não disponível para tenants acima do limite |
