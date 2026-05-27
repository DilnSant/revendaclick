# FC002 — QR Code Evolution não gerava / sumia / formato incompatível

## Data

2026-05-27

## Severidade

CRÍTICA

## Sintoma

Múltiplos sintomas em cascata:
1. QR code nunca aparecia na tela `/whatsapp` — botão "Conectar WhatsApp" sem resposta visual
2. QR aparecia brevemente e sumia após ~5 segundos
3. Badge mostrava o texto literal `"close"` em vez de "Desconectado"
4. Após upgrade para v2.3.7: instância sempre retornava `"disconnected"` mesmo estando conectando
5. `GET /instance/connect/:slug` retornava sempre `{"count":0}` sem QR base64

## Contexto

Frontend `/whatsapp` → `GET /api/evolution/qr` → backend `GetQRCode` → Evolution API `/instance/connect/:slug`.

A chain completa foi afetada por 5 bugs independentes que precisaram ser resolvidos em sequência.

## Causa Raiz

### Bug 1 — Imagem Evolution 14 meses desatualizada (PRINCIPAL)
`atendai/evolution-api:latest` estava buildada em 2025-02-03. O Baileys (biblioteca interna do WhatsApp) estava com protocolo quebrado para o protocolo atual do WhatsApp. A instância inicializava, mas o handshake com o WhatsApp falhava silenciosamente — `count=0`, sem erro no log.

### Bug 2 — `DATABASE_ENABLED=true` ausente
Evolution v2.3.7 requer `DATABASE_ENABLED=true` para inicializar corretamente a integração com Prisma/PostgreSQL. Sem essa flag, as instâncias não eram persistidas e o Baileys não conseguia recuperar sessão.

### Bug 3 — `CACHE_REDIS_ENABLED=true` com Redis vazio
Redis estava habilitado mas sem dados de sessão. Baileys tentava carregar sessão do Redis, falhava, e não inicializava o QR.

### Bug 4 — `EVOLUTION_DATABASE_URL` sem porta e database
O `.env` do VPS tinha `EVOLUTION_DATABASE_URL=...@supabase.com` sem `:5432/postgres`. Prisma não conseguia conectar ao banco → instâncias não eram salvas.

### Bug 5 — Frontend: condição `{qr && isConnecting}` eliminava QR
O poll de status a cada 5s retornava `"close"` (estado real do Evolution v2) que o frontend não reconhecia como "connecting". O status era revertido para `"disconnected"`, a condição `isConnecting` ficava `false`, e o QR desaparecia da tela mesmo com o valor ainda disponível.

## Arquivos Afetados

- `docker-compose.production.yml` — imagem, DATABASE_ENABLED, CACHE_REDIS_ENABLED
- `backend/internal/evolution/service.go` — `GetInstanceStatus` (parser dual-format)
- `frontend/components/whatsapp/WhatsAppManager.tsx` — condição QR, handleRefreshQR, STATUS_COLORS, STATUS_LABELS
- `/opt/revendaclick/.env` (VPS) — EVOLUTION_DATABASE_URL corrigido

## Banco/Migrations

Nenhuma migration. Ajuste de `.env` no VPS:

```bash
# ANTES (incompleto):
EVOLUTION_DATABASE_URL=postgresql://postgres.xxx:senha@aws-1-sa-east-1.pooler.supabase.com

# DEPOIS (correto):
EVOLUTION_DATABASE_URL=postgresql://postgres.xxx:senha@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?connection_limit=2&pool_timeout=30
```

## Correção Aplicada

**Fix 1 — Upgrade da imagem Evolution:**

```yaml
# docker-compose.production.yml
# ANTES:
image: atendai/evolution-api:latest   # buildada 2025-02-03, Baileys quebrado

# DEPOIS:
image: evoapicloud/evolution-api:v2.3.7   # mesma imagem usada no beautynow (mesmo VPS)
```

**Fix 2 — Variáveis obrigatórias adicionadas:**

```yaml
environment:
  DATABASE_ENABLED: "true"          # adicionado — obrigatório para v2.3.7
  CACHE_REDIS_ENABLED: "false"      # alterado — Baileys não usa Redis, cache vazio causava falha
  CACHE_REDIS_SAVE_INSTANCES: "false"
```

**Fix 3 — Parser dual-format `GetInstanceStatus` (v2.2.3 vs v2.3.7):**

```go
// v2.2.3: [{instance:{instanceName, connectionStatus}}]
// v2.3.7: [{name, connectionStatus}]  (flat, sem wrapper)

var rawList []json.RawMessage
json.NewDecoder(resp.Body).Decode(&rawList)
for _, raw := range rawList {
    var flat struct { Name string `json:"name"`; Status string `json:"connectionStatus"` }
    var nested struct { Instance struct { Name string `json:"instanceName"`; Status string `json:"connectionStatus"` } `json:"instance"` }
    json.Unmarshal(raw, &flat)
    json.Unmarshal(raw, &nested)
    name := flat.Name
    if name == "" { name = nested.Instance.Name; ... }
    if name == tenantSlug {
        if status == "close" { status = "disconnected" }  // normalização
        return &InstanceStatus{...}
    }
}
```

**Fix 4 — Normalização `"close"` → `"disconnected"`:**

```go
// Evolution v2 usa "close" para instância desconectada, não "disconnected"
if status == "close" {
    status = "disconnected"
}
```

**Fix 5 — Frontend: condição QR corrigida:**

```tsx
// ANTES: QR sumia quando status revertia para não-connecting
{qr && isConnecting && <QRCodeDisplay ... />}

// DEPOIS: QR permanece enquanto não estiver conectado
{qr && !isConnected && <QRCodeDisplay ... />}
```

**Fix 6 — handleRefreshQR atualiza status para connecting:**

```tsx
// ANTES: novo QR chegava mas status ficava "disconnected" → QR sumia
async function handleRefreshQR() {
  const qr = await fetchQR()
  setQr(qr)
}

// DEPOIS:
async function handleRefreshQR() {
  const qr = await fetchQR()
  setQr(qr)
  setStatus(prev => ({ ...prev, status: 'connecting' }))  // adicionado
}
```

## Commit(s)

- `d4eb26d079cc09eda6e5d470593ad2357c6b7f0d` — fix: disable Evolution Redis cache
- `02802f7e503c0165d747c96fa55eeb4030db8f2d` — fix: upgrade Evolution to v2.3.7 + DATABASE_ENABLED
- `9d053679d9caf19c962d25b66071b46b9a3e7990` — fix: fetchInstances parser v2.3.7 flat format
- `3248b309a2b2dc926f91eb31c9f847be487c2059` — fix: WhatsApp QR não aparece após status poll
- `727164f03c4c5246a1e35d1b49abbc76bc799033` — fix: QR retry — treat count=0 as not-ready, 5 attempts

## Como Validar

```bash
# 1. Verificar versão da imagem rodando
docker compose -f docker-compose.production.yml ps evolution
# deve mostrar evoapicloud/evolution-api:v2.3.7

# 2. Verificar QR via API diretamente
curl -s http://localhost:8081/instance/connect/santos-car \
  -H "apikey: revendaclick123" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('count:', d.get('count'), 'base64_len:', len(d.get('base64','')))"
# count deve ser >= 1, base64_len > 1000

# 3. Verificar fetchInstances
curl -s http://localhost:8081/instance/fetchInstances \
  -H "apikey: revendaclick123" | python3 -m json.tool
# deve mostrar [{name: "santos-car", connectionStatus: "connecting|open"}]

# 4. No browser: https://app.revendaclick.com.br/whatsapp
# → Clicar "Conectar WhatsApp"
# → QR deve aparecer e permanecer visível
# → Badge "Conectando…"
```

## Resultado Final

- QR gerado com `count=9+`, `base64_len=13142`, rotacionando a cada ~30s
- `fetchInstances` retorna status correto para v2.3.7
- QR permanece visível na tela até conexão ser estabelecida
- Webhook de mensagens recebido com HTTP 200
- Smoke test: 22/22 PASS

## Risco de Regressão

**ALTO.** Múltiplos pontos frágeis:

1. **Imagem Evolution:** Se `evoapicloud/evolution-api:v2.3.7` for trocada por qualquer `latest` não verificada, Baileys pode voltar a falhar silenciosamente.
2. **Volume evolution_instances:** `docker compose down -v` destrói sessões — todos os tenants precisam re-escanear QR.
3. **EVOLUTION_DATABASE_URL:** Se `.env` do VPS for recriado sem `:5432/postgres?connection_limit=2&pool_timeout=30`, Prisma falha.
4. **CACHE_REDIS_ENABLED:** Nunca reabilitar para Evolution sem testar Baileys completamente.

## Prevenção Futura

1. **Nunca usar `:latest`** para Evolution — sempre fixar versão (ex: `v2.3.7`). Ver D2 em `21_DECISOES_TECNICAS.md`.
2. Ao fazer upgrade de versão, testar `count` do `/instance/connect/:slug` antes de declarar sucesso.
3. Comparar docker-compose com instância funcionando no mesmo VPS (beautynow) antes de diagnosticar.
4. `EVOLUTION_DATABASE_URL` deve sempre incluir `:5432/postgres` (porta 5432, não 6543) + `connection_limit` + `pool_timeout`.
5. Evolution usa `"close"` para desconectado — sempre normalizar no backend antes de enviar ao frontend.
