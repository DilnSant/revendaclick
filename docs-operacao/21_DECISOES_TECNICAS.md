# 21 — DECISÕES TÉCNICAS

> Registra decisões arquiteturais e o motivo por trás delas.
> Atualizar quando uma decisão importante for tomada ou revertida.

---

## D1 — PgBouncer transaction mode (porta 6543) para o backend Go

**Decisão:** Backend Go usa porta 6543 (PgBouncer em transaction mode).
**Por quê:** PgBouncer reduz o número de conexões abertas no PostgreSQL. Em Go com `pgx/v5`, o SimpleProtocol é compatível com transaction mode. Advisory locks não são necessários no backend Go.
**Trade-off:** Não é possível usar prepared statements nomeados com lifetime além de uma transação.
**Impacto ao alterar:** Trocar para 5432 funciona, mas perde o benefício do pooling.

---

## D2 — Evolution API usa porta 5432 (session mode)

**Decisão:** `EVOLUTION_DATABASE_URL` sempre porta 5432 (sem PgBouncer).
**Por quê:** Prisma (ORM interno da Evolution) usa advisory locks que são incompatíveis com PgBouncer em transaction mode.
**Consequência de ignorar:** Evolution falha com "advisory lock" errors ao iniciar.

---

## D3 — Prometheus sem client_golang

**Decisão:** Implementação própria de métricas Prometheus em `backend/internal/observability/`.
**Por quê:** Reduz dependências externas. A implementação cobre todos os casos de uso necessários (Counter, Gauge, Histogram com labels, serialização text format).
**Trade-off:** Não tem auto-discovery de métricas Go runtime (goroutines, GC) — apenas métricas de negócio e HTTP.

---

## D4 — JWT com suporte ES256 e HS256

**Decisão:** Backend detecta automaticamente se a chave em JWKS é EC ou RSA/HS.
**Por quê:** Supabase usa ES256 por padrão. Alguns setups podem usar HS256 (SUPABASE_JWT_SECRET). O código faz fallback automático.
**Como funciona:** Na inicialização, faz GET no JWKS endpoint do Supabase. Se a chave for EC → ES256. Caso contrário (ou se `SUPABASE_JWT_SECRET` estiver definido) → HS256.

---

## D5 — Dupla proteção de tenant: backend + RLS

**Decisão:** Todo handler filtra por `tenant_id` E o banco tem RLS.
**Por quê:** Defesa em profundidade. Se o backend tiver um bug e passar `tenant_id` errado, o RLS bloqueia. Se o RLS tiver um erro, o backend ainda filtra.
**Trade-off:** Queries um pouco mais complexas (duas camadas de filtro).

---

## D6 — Grace period de 3 dias via trigger no banco

**Decisão:** `set_subscription_grace()` trigger seta `grace_until = NOW() + 3 days` quando status → `past_due`.
**Por quê:** Centraliza a lógica no banco, não no backend. Impossível bypass por bug no código Go.
**Alerta:** Se alterar o trigger, auditar todos os tenants com `past_due` para garantir que `grace_until` está correto.

---

## D7 — Instância Evolution nomeada pelo slug do tenant

**Decisão:** Cada tenant tem instância WhatsApp com nome = slug (ex: `autoclick`).
**Por quê:** Simplifica o mapeamento webhook → tenant (lookup `WHERE slug = $1`). Nome único garantido pela constraint UNIQUE no banco.
**Trade-off:** Se o slug mudar, a instância no Evolution fica com nome desatualizado e precisa ser recriada.

---

## D8 — Smoke test pós-deploy com 10 categorias

**Decisão:** Deploy só termina após smoke-test.sh passar todas as 10 verificações.
**Por quê:** Detecta regressões óbvias antes que usuários reportem (TLS, auth, cache, security headers, Evolution).
**Trade-off:** Deploy fica uns 30-60s mais lento. Justificado pela segurança.

---

## D9 — Runner CI/CD no próprio VPS

**Decisão:** GitHub Actions self-hosted runner roda no VPS Hostinger.
**Por quê:** Deploy direto sem copiar secrets para o CI. O `.env` fica só no VPS. Sem exposição de credenciais de produção no GitHub Secrets.
**Risco:** Se o runner parar, o CI fica em fila. Monitorar `systemctl status actions.runner.*`.

---

## D10 — Nginx cache apenas para /api/public/* (60s)

**Decisão:** Apenas rotas públicas são cacheadas. Rotas autenticadas nunca.
**Por quê:** Rotas autenticadas têm dados por-tenant que não podem ser compartilhados entre usuários. Rotas públicas (vitrine, veículos) mudam raramente e têm alto volume.
**Trade-off:** Atualização de veículo na vitrine leva até 60s para aparecer para visitantes.

---

## D11 — Frontend Coolify (planejado) → não implementado como descrito

**Status:** O CLAUDE.md menciona Coolify para o frontend. Na prática, o frontend Next.js pode estar em Coolify ou em outro setup.
**Verificar:** Estado real do frontend em produção antes de qualquer alteração de deploy.

---

## D12 — FlutterFlow descartado (22/05/2026)

**Decisão:** Migração para FlutterFlow foi cancelada.
**Motivo:** Decisão do produto — não será mais necessária.
**Impacto:** `FLUTTERFLOW_MIGRATION.md` e `18_MIGRACAO_FLUTTERFLOW.md` são obsoletos.
**Ação:** Frontend Next.js continua como stack oficial.

---

## D13 — getTenantForUser usa abordagem híbrida: session client + service role fallback (23/05/2026)

**Decisão:** `getTenantForUser` tenta session client primeiro (RLS via JWT `tenant_id` claim). Se retornar null (JWT sem claim), faz fallback para service role consultando por `id = userId` diretamente.
**Por quê:** `updateSupabaseAppMetadata` no backend Go é non-fatal. Se falhar, o JWT fica sem o claim `tenant_id`. Com session client puro, o RLS `WHERE tenant_id = auth_tenant_id()` retorna 0 linhas → null → loop /onboarding. O fallback garante que usuários com tenant no banco sempre chegam ao dashboard, independentemente do estado do JWT.
**Segurança:** Fallback filtra por `id = userId` (autenticado via proxy.ts). Nunca expõe dados de outro tenant.
**Trade-off:** O fallback faz 2 queries extras (service role) quando JWT não tem claim. Frequência baixa (apenas usuários com JWT stale).
**Patch retroativo:** SQL executado em 23/05/2026 corrige `raw_app_meta_data` para usuários existentes com tenant mas sem claim.

## D13 (anterior) — getTenantForUser usa session client em vez de service role (23/05/2026)

**Decisão:** `getTenantForUser` usa `createClient()` (anon key + JWT do usuário) em vez de `createServiceClient()` (service role key).
**Por quê:** Em Vercel (serverless), `SUPABASE_SERVICE_ROLE_KEY` não estava configurado. Toda chamada ao `createServiceClient()` em `getTenantForUser` falhava silenciosamente → retornava null → dashboard redirecionava para /onboarding → loop infinito.
**Como funciona:** A RLS na tabela `users` permite SELECT via `WHERE tenant_id = auth_tenant_id()`. A função `auth_tenant_id()` lê o claim `tenant_id` do JWT, que é injetado pelo backend via `app_metadata` após o onboarding. O `supabase.auth.refreshSession()` no server action `setupTenant` garante que o JWT atualizado chegue ao próximo request.
**Trade-off:** Exige que o JWT tenha o claim `tenant_id`. Se `refreshSession()` falhar (raro), o usuário fica redirecionado para /onboarding mesmo com tenant criado — mas o erro é rastreável via console.error.
**Segurança:** Mais seguro que service role — o banco aplica RLS em vez de bypass total.
**Impacto ao alterar:** `getTenantById` e `getTenantBySlug` (rotas públicas sem sessão) ainda usam `createServiceClient()` — precisam do `SUPABASE_SERVICE_ROLE_KEY` configurado no Vercel.

---

## D15 — Redis adicionado ao stack de produção para cache da Evolution API (25/05/2026)

**Decisão:** `redis:7-alpine` adicionado ao `docker-compose.production.yml` como cache da Evolution API.
**Por quê:** Evolution API atingia OOM (container sendo morto pelo kernel). Análise: parte do consumo excessivo de memória vinha de dados de instâncias sendo mantidos apenas em memória no processo Node.js da Evolution. Redis offloads esse cache, liberando heap.
**Configuração:** `CACHE_REDIS_ENABLED=true`, `CACHE_REDIS_URI=redis://rc_redis:6379`, `CACHE_REDIS_SAVE_INSTANCES=true`. Redis com `maxmemory 128mb` e política `allkeys-lru`.
**Complemento:** `NODE_OPTIONS=--max-old-space-size=400` limita o heap V8 da Evolution a 400MB, criando margem de segurança antes do container limit de 768m.
**Trade-off:** Mais um serviço no stack. Redis não tem volume persistente — cache é volátil, mas as instâncias WhatsApp persistem no volume `evolution_instances`.
**Impacto ao alterar:** Remover Redis sem ajustar `CACHE_REDIS_ENABLED=false` faz a Evolution falhar ao tentar conectar em `rc_redis`.

---

## D14 — middleware.ts renomeado para proxy.ts (23/05/2026)

**Decisão:** `frontend/middleware.ts` substituído por `frontend/proxy.ts`.
**Por quê:** Next.js 16 deprecou a convenção `middleware` em favor de `proxy`. O build logava warning: "The 'middleware' file convention is deprecated. Please use 'proxy' instead." O arquivo antigo foi esvaziado para evitar conflito.
**Impacto:** A lógica de auth (session refresh, x-user-id header, redirect para /login) continua idêntica. Apenas o nome do arquivo mudou.
