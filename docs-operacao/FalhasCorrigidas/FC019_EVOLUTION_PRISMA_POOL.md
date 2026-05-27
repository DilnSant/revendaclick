# FC019 — Evolution Prisma connection pool exhaustion — sessão WhatsApp cai após QR scan

## Data

2026-05-27

## Severidade

ALTA

## Sintoma

Após escanear o QR code com sucesso (status `open`), a instância WhatsApp caia para `close` em 10-30 segundos. Os logs da Evolution mostravam:

```
Error: Timed out fetching a new connection from the connection pool.
  Timeout: 10000ms
  connection_limit: 3
Error: Connection Closed
```

Seguido pelo Baileys dropando a sessão WebSocket com o WhatsApp.

## Contexto

Evolution v2.3.7 usa Prisma como ORM para persistir instâncias, mensagens e sessões no PostgreSQL. O Prisma usa um connection pool interno. Durante a sincronização de histórico após uma nova conexão WhatsApp, o Baileys faz muitas escritas simultâneas, esgotando o pool.

## Causa Raiz

`EVOLUTION_DATABASE_URL` sem parâmetros de pool:

```
# SEM pool config (padrão Prisma: connection_limit=5, pool_timeout=10s):
EVOLUTION_DATABASE_URL=postgresql://postgres.xxx:senha@supabase.com:5432/postgres

# Problema: connection_limit=5 (padrão) + timeout=10s
# Durante history sync, Baileys faz ~10-20 escritas simultâneas
# → pool esgotado → timeout em 10s → Connection Closed → sessão cai
```

O Supabase tem limite de conexões por tier. Com `connection_limit=5`, a Evolution abria 5 conexões permanentes ao PostgreSQL. Combinado com a explosão de escritas do history sync, o pool ficava cheio e as queries subsequentes esperavam além do timeout de 10s.

## Arquivos Afetados

- `/opt/revendaclick/.env` (VPS) — `EVOLUTION_DATABASE_URL`

**Não é um arquivo de código** — é configuração de runtime no `.env` do VPS (gitignored).

## Banco/Migrations

Nenhuma.

## Correção Aplicada

Adicionado `connection_limit` e `pool_timeout` na URL do banco da Evolution:

```bash
# ANTES (sem pool config):
EVOLUTION_DATABASE_URL=postgresql://postgres.xxx:senha@aws-1-sa-east-1.pooler.supabase.com:5432/postgres

# DEPOIS (com pool config conservador):
EVOLUTION_DATABASE_URL=postgresql://postgres.xxx:senha@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?connection_limit=2&pool_timeout=30
```

**Raciocínio:**
- `connection_limit=2`: Limita o Prisma a 2 conexões abertas simultaneamente. Menos conexões = menos chance de esgotar o pool do Supabase. O Prisma vai enfileirar as queries em vez de abrir conexões ilimitadas.
- `pool_timeout=30`: Aumenta o timeout de espera por conexão disponível de 10s para 30s. Durante picos de sincronização, as queries esperam mais em vez de falhar imediatamente.

**Como aplicar no VPS:**
```bash
# Usar Python para evitar problemas com & e ? no sed:
python3 -c "
import re
with open('/opt/revendaclick/.env', 'r') as f:
    content = f.read()
content = re.sub(
    r'EVOLUTION_DATABASE_URL=.*',
    'EVOLUTION_DATABASE_URL=postgresql://postgres.xxx:senha@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?connection_limit=2&pool_timeout=30',
    content
)
with open('/opt/revendaclick/.env', 'w') as f:
    f.write(content)
"
docker compose -f docker-compose.production.yml up -d evolution
```

## Commit(s)

Nenhum commit — mudança aplicada diretamente no `.env` do VPS (gitignored por design).

## Como Validar

```bash
# 1. Após escanear QR, aguardar 60 segundos e verificar status
curl -s http://localhost:8081/instance/fetchInstances \
  -H "apikey: revendaclick123" | python3 -m json.tool
# connectionStatus deve permanecer "open" após 60s

# 2. Verificar que não há erros de pool nos logs da Evolution
docker compose -f docker-compose.production.yml logs evolution --tail=100 | \
  grep -i "connection pool\|timeout\|closed"
# não deve ter erros de pool

# 3. Confirmar a URL configurada (sem expor a senha):
grep "EVOLUTION_DATABASE_URL" /opt/revendaclick/.env | \
  sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/'
# deve mostrar: ...5432/postgres?connection_limit=2&pool_timeout=30
```

## Resultado Final

Instância WhatsApp permanece conectada após o scan do QR. Pool do Prisma configurado com limite conservador e timeout aumentado para tolerar picos de sincronização.

## Risco de Regressão

**ALTO.** Esta configuração está **apenas no `.env` do VPS** — não está commitada no git (`.env` é gitignored). Se o VPS for recriado ou o `.env` for sobrescrito, o problema retornará.

**Procedimento obrigatório ao recriar o `.env`:**
```
EVOLUTION_DATABASE_URL=postgresql://postgres.<project>:<senha>@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?connection_limit=2&pool_timeout=30
```

Lembrar: porta **5432** (não 6543 — Evolution usa session mode, não PgBouncer).

## Prevenção Futura

1. Documentar `connection_limit=2&pool_timeout=30` no template `.env` e em `09_ENVS.md`.
2. Ao criar novo tenant que conecta WhatsApp pela primeira vez, monitorar os logs da Evolution por 2-3 minutos após o QR scan para verificar se a sessão se mantém estável.
3. Considerar aumentar para `connection_limit=3` se houver muitos tenants conectando simultaneamente e houver filas de query.
