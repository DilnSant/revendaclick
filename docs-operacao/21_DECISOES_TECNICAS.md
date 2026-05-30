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

## D11 — Frontend está no Vercel (confirmado 28/05/2026)

**Status ATUALIZADO (sessão 17):** `app.revendaclick.com.br` resolve para `vercel-dns-017.com` — Vercel é o host real do frontend.
**Evidência:** `dig +short app.revendaclick.com.br` → `c248871ab6e90d06.vercel-dns-017.com.`
**Por quê Vercel:** O CLAUDE.md lista Vercel como "Forbidden" (aspiracional), mas o frontend Next.js foi deployado no Vercel durante as fases iniciais e permanece lá. Funciona corretamente — nenhuma ação de migração imediata necessária.
**Deploy automático:** Vercel tem integração com o repositório GitHub. Push para `main` → deploy automático do frontend.
**Impacto ao alterar:** Migrar para VPS/Coolify exigiria: build Docker do frontend, container `rc_frontend`, bloco nginx para `app.revendaclick.com.br`, redirecionar DNS de Vercel para 2.24.67.84.
**Não fazer agora:** A migração do frontend para VPS é complexa, tem risco de downtime e não há urgência. Manter Vercel até decisão explícita de migração.

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

## D16 — public_vehicle_listings view REMOVIDA (27/05/2026 — sessão 14)

**Status ALTERADO:** A view `public_vehicle_listings` foi removida na migration 015 (sessão 14).
**Por quê:** O backend Go não usava a view — acessava as tabelas diretamente via queries com RLS. A view SECURITY DEFINER era desnecessária e disparava o Supabase Security Advisor (`security_definer_view`).
**Impacto:** Nenhum. Backend continua funcionando normalmente via queries diretas.
**Decisão original (obsoleta) preservada abaixo para histórico:**

~~**Decisão:** A view `public_vehicle_listings` permanece com `SECURITY DEFINER`.~~
~~**Por quê:** Converter para `SECURITY INVOKER` exigiria adicionar uma política SELECT pública na tabela `tenants`.~~

---

## D19 — Evolution API deve usar schema separado no banco (27/05/2026 — sessão 14)

**Decisão:** Decisão futura — ao reformular o ambiente Evolution, configurar `DATABASE_SCHEMA=evolution` no docker-compose para isolar as tabelas Prisma do schema `public`.
**Por quê:** Na sessão 14 foi necessário dropar 37 tabelas PascalCase criadas pelo Prisma da Evolution no schema `public`. Essas tabelas desabilitavam o RLS (Supabase Security Advisor), poluíam o schema e exigiram uma sequência complexa de migrations para limpeza e recovery (P3005 → P3009 → ENUM types órfãos).
**Como implementar:** `DATABASE_SCHEMA=evolution` na evolution API. Exige suporte pelo Prisma schema da versão usada.
**Status:** PENDENTE — não urgente, mas deve ser feito antes de reiniciar o ambiente Evolution em uma nova VPS ou reset.
**Ver:** FC026, FC027, FC028 em `docs-operacao/FalhasCorrigidas/`.

---

## D20 — Tailwind primary color usa CSS channel variables (28/05/2026 — sessão 15)

**Decisão:** `tailwind.config.ts` define `primary.DEFAULT = 'rgb(var(--primary) / <alpha-value>)'` e `primary.dark = 'rgb(var(--primary-dark) / <alpha-value>)'`.
**Por quê:** Antes, `primary: '#E53935'` era estático. Classes como `bg-primary`, `hover:bg-primary-dark`, `focus:ring-primary` compilavam para vermelho fixo independentemente do CSS variable `--color-primary`. Isso impedia que a loja pública da tenant usasse sua cor personalizada.
**Como funciona:**
- `globals.css` `:root` define os defaults: `--primary: 229 57 53` e `--primary-dark: 198 40 40` (RevendaClick brand)
- `[slug]/layout.tsx` converte o `primary_color` hex do tenant para canais RGB via `hexToRgb()` e injeta `--primary: R G B` e `--primary-dark: R' G' B'` (com 17% escurecimento) no SSR
- Dashboard: usa os defaults de globals.css → cor RevendaClick `#E53935` inalterada
- Loja pública: usa os canais do tenant → cor dinâmica por tenant
**Suporte a opacity modifiers:** `bg-primary/10`, `bg-primary/5`, `ring-primary/20` funcionam corretamente com o formato `rgb(var(...) / <alpha-value>)` (padrão Tailwind v3 documentado)
**Manter:** `primary.light`, `primary.50`, `primary.100` continuam hardcoded (usados apenas em badges do dashboard, não na loja pública)
**Ver:** `frontend/tailwind.config.ts`, `frontend/app/globals.css`, `frontend/app/(public)/[slug]/layout.tsx`

---

## D21 — Billing trial: botão de assinatura desbloqueado durante trialing (28/05/2026 — sessão 15)

**Decisão:** `PlanCard.tsx` bloqueia o botão de assinatura apenas quando `subscription.status === 'active'` no plano atual. Durante `trialing`, todos os planos têm botão clicável.
**Por quê:** O tenant precisa poder antecipar a assinatura durante o trial ou mudar de plano. O backend guard (`billing/service.go:Subscribe`) já trata isso corretamente: só bloqueia re-subscribe quando `asaas_subscription_id != ""`. Durante trial, a subscription não tem `asaas_subscription_id` → guard não dispara.
**Lógica:**
```ts
const isActiveAndCurrent = isCurrent && subscription?.status === 'active'
// disabled={isActiveAndCurrent || loading}
// Trialing: isActiveAndCurrent = false → botão habilitado
// Active:   isActiveAndCurrent = true  → botão desabilitado
```
**UX:** Plano atual em trial mostra badge "Trial ativo" + botão "Antecipar assinatura". Planos diferentes mostram "Assinar" normalmente.

---

## D17 — leads_public_insert restrito a anon + validação de tenant ativo (26/05/2026)

**Decisão:** `leads_public_insert` aplica apenas para role `anon`, com `WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE is_active = TRUE))`.
**Por quê:** A política anterior era `FOR ALL ROLES WITH CHECK (true)` — qualquer role autenticada podia inserir leads para qualquer `tenant_id`, incluindo tenants inativos ou inexistentes. Isso abria vetor de spam/abuse nos formulários de captação de leads.
**Como funciona:** Visitantes anônimos das páginas de vitrine pública enviam leads via `/api/public/leads`. A policy permite apenas tenants ativos, bloqueando submissões para tenants cancelados/suspensos.
**Trade-off:** Nenhum — usuários autenticados não precisam inserir leads via PostgREST direto (fazem via backend Go que usa service_role).

---

## D18 — `$$` no `.env` para chaves com `$` literal (Docker Compose double-interpolation) (26/05/2026)

**Decisão:** Variáveis de ambiente que contêm `$` literal (ex: `ASAAS_API_KEY=$aact_prod_...`) devem ser escritas com `$$` no `.env` do VPS: `ASAAS_API_KEY=$$aact_prod_...`.
**Por quê:** Docker Compose v2 faz dupla interpolação. Ao processar `ASAAS_API_KEY: "${ASAAS_API_KEY}"` no compose file, substitui o valor do `.env` e então re-escaneia o resultado por `$`. Se o valor começa com `$aact_prod_...`, o Docker trata `$aact_prod_...` como referência a outra variável → não encontrada → **container recebe string vazia**. O `$$` no `.env` força o escape: `$$aact_prod_...` → após processamento → `$aact_prod_...` (correto).
**Evidência:** `docker compose up` logava `WARN: The "aact_prod_000M..." variable is not set. Defaulting to a blank string.` quando a chave tinha `$` simples.
**Regra:** Qualquer `.env` no VPS com valor que começa por `$` deve usar `$$` como prefixo.
**Impacto ao alterar:** Remover um `$` (deixar `$aact_...`) → container recebe key vazia → Asaas retorna 401 em todas as chamadas de billing.

---

## D22 — Separação arquitetural: Central de Atendimento vs Contato Público da Loja (28/05/2026 — sessão 17)

**Decisão:** Os conceitos "WhatsApp operacional" e "WhatsApp comercial" são implementados como módulos separados, completamente independentes.

**CONCEITO 1 — Central de Atendimento** (`/whatsapp` no dashboard):
- Evolution API, QR Code, sessão WhatsApp, leads automáticos, CRM
- Dados: `evolution_instances` no Evolution API + rotas `/api/evolution/*` no backend
- Nunca aparece na vitrine pública
- Rota menu: "Central de Atendimento" (não "WhatsApp")

**CONCEITO 2 — Contato Público da Loja** (`/settings?tab=contact` no dashboard / vitrine pública):
- Botão WhatsApp comercial, telefone, email, Instagram, link de grupos, endereço
- Dados: tabela `tenant_public_contacts` + módulo `backend/internal/storecontact`
- Aparece na vitrine pública via `GET /api/public/:slug/` (campo `public_contact`)
- Nunca expõe dados operacionais da Central de Atendimento

**Por quê separar:** Confundir os dois conceitos em uma única tela causava linguagem ambígua ("enviar mensagens em massa" sendo associada ao CRM de atendimento), limitava a evolução independente de cada módulo e misturava fluxos operacionais com fluxos comerciais.

**Fallback do botão WhatsApp na vitrine:** Se `public_whatsapp` não estiver configurado no contato público, usa `tenant.phone_whatsapp` (campo principal da loja) como fallback.

---

## D23 — Infraestrutura real de deploy (28/05/2026 — sessão 17)

**Realidade confirmada em produção:**
- **Frontend** (`app.revendaclick.com.br`) → Vercel (auto-deploy via integração GitHub)
- **Backend** (`api.revendaclick.com.br`) → VPS Hostinger (`2.24.67.84`) via Docker + nginx + CI/CD self-hosted runner
- **Evolution** (`evolution.revendaclick.com.br`) → VPS Hostinger, container `rc_evolution`
- **Banco** → Supabase cloud (`ibgaywezfcbbiiziaoac`)

**CI/CD pipeline (`.github/workflows/ci.yml`):**
1. Test backend (Go vet + go test)
2. Build + push imagem Docker backend para GHCR
3. Deploy via SSH no self-hosted runner (git pull + docker compose pull/up)
4. Wait for health (24 tentativas × 5s)
5. Smoke test (`scripts/smoke-test.sh`)

**O que NÃO está no CI/CD:** frontend (Vercel cuida), migrations Supabase (aplicadas manualmente via MCP ou CLI)

---

## D14 — middleware.ts renomeado para proxy.ts (23/05/2026)

**Decisão:** `frontend/middleware.ts` substituído por `frontend/proxy.ts`.
**Por quê:** Next.js 16 deprecou a convenção `middleware` em favor de `proxy`. O build logava warning: "The 'middleware' file convention is deprecated. Please use 'proxy' instead." O arquivo antigo foi esvaziado para evitar conflito.
**Impacto:** A lógica de auth (session refresh, x-user-id header, redirect para /login) continua idêntica. Apenas o nome do arquivo mudou.

---

## D24 — Add-ons concedem feature flags via plan_addons.features JSONB (28/05/2026 — sessão 22)

**Decisão:** A tabela `plan_addons` tem coluna `features JSONB` que lista as feature flags concedidas pelo add-on. A resolução de features do tenant é um merge 3-way:
1. `plans.features` — features base do plano contratado
2. `tenant_features` — overrides manuais pelo super_admin
3. `subscription_addons JOIN plan_addons.features` — features concedidas por add-ons ativos

**Por quê:** Permite que add-ons desbloqueiem funcionalidades sem criar código condicional separado. O `plan_gate.go` já usa UNION ALL nos 3 branches. A UI consome os mesmos feature flags independentemente de onde vieram.

**Exemplo:** `whatsapp_automation` add-on tem `features: ["central_atendimento"]`. Tenant Starter que contrata esse add-on passa no gate de `central_atendimento` automaticamente.

**Impacto ao alterar:** Adicionar uma feature ao add-on basta atualizar o array JSONB em `plan_addons`. Nenhuma mudança de código necessária.

---

## D25 — Plano Scale oculto do grid público (28/05/2026 — sessão 22)

**Decisão:** O plano `scale` (Enterprise) existe no banco mas nunca é exibido no grid de planos (`/billing/plans`). `PlansGrid.tsx` filtra `plans.filter(p => p.name !== 'scale')`. No lugar, exibe uma seção CTA "Escala do seu negócio merece um plano sob medida" com botão WhatsApp para contato.

**Por quê:** Enterprise tem pricing negociado (não público). Exibir um card com preço fixo ou "Consulte" junto aos demais planos dilui o posicionamento premium e cria fricção desnecessária.

**Regra:** Nunca exibir `scale` no grid. CTA Enterprise fica sempre ao final da página de planos.

---

## D26 — Sidebar gate Pro usa has_crm; Starter inclui financial+vendors (28/05/2026 — sessão 22)

**ATUALIZADO pela D28 (29/05/2026 — sessão 23 cont. 2)** — ver D28 para a estrutura definitiva.

**Decisão original (sessão 22):** `NAV_BASE` incluía Financeiro, Comissões, Vendedores. `NAV_PRO` (gate `has_crm`) incluía Compradores, Atendimento.

**Regra permanente (inalterada):** Nunca usar `plan_name === 'premium'` ou similar. Sempre feature flags.

---

## D28 — Sidebar definitiva: Starter/Pro/Premium por feature flag (29/05/2026 — sessão 23 cont. 2)

**Decisão:** `DashboardShell.tsx` implementa 3 grupos de nav baseados em feature flags (não em `plan_name`):

- **NAV_BASE** (Starter+, sempre): Dashboard, Veículos, Interessados, **Clientes**, Financeiro
- **NAV_PRO** (`has_crm`): Atendimento, Analytics — header "Pro"
- **NAV_PREMIUM** (`has_api_access`): Automações, Campanhas — header "Premium"
- **Rodapé sempre-visível** (sem header): Assinatura, Configurações

**Itens retirados da sidebar:**
- Vendas → acessível via Financeiro → sub-nav tab "Vendas"
- Comissões → acessível via Financeiro → sub-nav tab "Comissões"
- Vendedores → acessível via Configurações → aba Usuários (ou `/vendors` direto)
- Add-ons → acessível via Assinatura → sub-nav tab "Add-ons"
- Central de Atendimento → acessível via Configurações → aba WhatsApp

**Renomeações:**
- "Compradores" → "Clientes" (label mais natural; `href` permanece `/customers`)
- "Central de Atendimento" → "WhatsApp" (breadcrumb/ROUTE_LABELS)

**Sub-navegação por seção:**
- `FinancialSubNav`: tabs Resumo / Vendas / Comissões — adicionado a `financial/page`, `sales/page`, `financial/commissions/page`
- `BillingSubNav`: tabs Assinatura / Add-ons / Cobranças / Planos — adicionado a todos os sub-pages de billing

**Regra permanente:** Nunca usar `plan_name === X` no frontend. Sempre feature flags.

**Gate Pro:** `has_crm` (inalterado — coerente com D26)
**Gate Premium:** `has_api_access` — proxy de plano Performance/Scale

**Ver:** `frontend/components/layout/DashboardShell.tsx`, `components/financial/FinancialSubNav.tsx`, `components/billing/BillingSubNav.tsx`

---

## D27 — database.types.ts deve ser regenerado após cada migration Supabase (28/05/2026 — FC029)

**Decisão:** Após aplicar qualquer migration Supabase, regenerar `frontend/lib/database.types.ts` antes de commitar código que referencie as tabelas novas ou colunas alteradas.

**Por quê:** Em 8 deploys consecutivos (sessões 15–21), o build no Vercel falhou com TypeScript error porque `database.types.ts` não incluía as tabelas `tenant_public_contacts`, `tenant_features`, `subscription_addons`, `plan_addons`. O arquivo estava congelado na versão pré-migration 018.

**Como regenerar:**
```bash
# Via MCP Supabase (generate_typescript_types) — preferido
# Ou via CLI:
supabase gen types typescript --project-id ibgaywezfcbbiiziaoac > frontend/lib/database.types.ts
```

**Ver:** FC029 em `docs-operacao/FalhasCorrigidas/`.
