# FC039 — Hardening Final e Auditoria Operacional

**Sessão:** 47  
**Data:** 09/06/2026  
**Severidade:** Alta (1 bug produção 500) + Média (3 inconsistências)  
**Status:** CONCLUÍDA

---

## Resumo

Auditoria completa de hardening em todo o stack (Frontend, Backend, Supabase, Evolution, Observabilidade, CI/CD, Segurança). Identificadas e corrigidas 7 inconsistências técnicas sem adição de funcionalidades novas.

---

## Problemas Identificados e Corrigidos

### 1. BUG CRÍTICO — `GET /api/admin/tenants` retornando 500 em produção

**Arquivo:** `backend/internal/admin/repository.go`  
**Causa raiz:** `COALESCE(s.status, 'none')` — `s.status` é enum `subscription_status` e `'none'` não é um valor válido do enum. PostgreSQL rejeita o cast implícito com `ERROR 22P02`.  
**Sintoma:** Painel Super Admin (`/admin/users`, `/admin/subscriptions`) falhava com 500 ao carregar lista de tenants.  
**Correção:** `COALESCE(s.status::text, 'none')` — cast explícito para text antes do COALESCE.  
**Commit:** `0be8b4e`

---

### 2. NavItem usando `<a>` em vez de `<Link>` (full page reload na sidebar)

**Arquivo:** `frontend/components/layout/DashboardShell.tsx`  
**Causa raiz:** `NavItem` renderizava `<a href={href}>` apesar de ser `'use client'` e ter `Link` já importado. Isso causava reload completo da página a cada clique na sidebar.  
**Correção:** Substituído `<a href={href}>` por `<Link href={href}>`.  
**Commit:** `0be8b4e`

---

### 3. `/automations` e `/campaigns` ausentes do PROTECTED_PREFIXES

**Arquivo:** `frontend/proxy.ts`  
**Causa raiz:** As rotas `/automations` e `/campaigns` existem no grupo `(dashboard)` (protegido pelo layout), mas não estavam listadas em `PROTECTED_PREFIXES` no `proxy.ts`. Usuário não autenticado recebia 404 (hit no layout → `notFound()`) em vez de ser redirecionado para `/login`.  
**Correção:** Adicionados `/automations` e `/campaigns` ao `PROTECTED_PREFIXES`.  
**Commit:** `0be8b4e`

---

### 4. Sitemap referenciando `/privacy` em vez de `/privacidade`

**Arquivo:** `frontend/app/sitemap.ts`  
**Causa raiz:** O sitemap apontava para `/privacy` (página em inglês, não-canônica), enquanto a URL canônica LGPD do projeto é `/privacidade` (página em português com hreflang e canonical corretos).  
**Correção:** Alterado `${base}/privacy` → `${base}/privacidade`.  
**Commit:** `0be8b4e`

---

### 5. Trigger functions com EXECUTE grant para anon/authenticated

**Sistema:** Supabase (banco de dados)  
**Causa raiz:** 6 funções de trigger (`_mark_first_lead_received`, `_mark_store_published`, `_mark_vehicle_added`, `_update_onboarding_completed`, `auto_assign_trial_subscription`, `auto_create_onboarding_checklist`) tinham EXECUTE concedido para os roles `anon` e `authenticated`, expostas via REST API do Supabase.  
**Risco:** Chamada direta via REST API permitia acionar triggers internos sem passar pelas regras de negócio do backend Go.  
**Correção:** `REVOKE EXECUTE ON FUNCTION ... FROM anon, authenticated` em todas as 6 funções.  
**SQL executado:** Via MCP Supabase (sem migration — revoke é não-destrutivo)

---

### 6. `landing_leads` RLS INSERT policy `WITH CHECK (true)` — permissão irrestrita

**Sistema:** Supabase (banco de dados)  
**Causa raiz:** A tabela `landing_leads` (leads do formulário da landing page) tinha policy de insert `WITH CHECK (true)` para `anon` e `authenticated`. Qualquer pessoa poderia inserir dados lixo diretamente via REST API do Supabase.  
**Análise:** A tabela não tem `tenant_id` (é plataforma-level). O único insert legítimo é via `POST /api/leads/landing` no Next.js, que usa `createServiceClient()` (service_role) e bypassa RLS.  
**Correção:** Policy alterada para `WITH CHECK (false)` — bloqueia inserts via REST API diretamente. Inserts via service_role (caminho legítimo) não são afetados pelo RLS.  
**SQL executado:** Via MCP Supabase

---

## Estado Pós-Correção

| Sistema | Status |
|---|---|
| Backend — ListTenants | ✓ Retorna 200 com dados reais |
| Frontend — sidebar navigation | ✓ SPA navigation (sem full page reload) |
| Frontend — proxy auth protection | ✓ /automations e /campaigns redirecionam para /login |
| Frontend — sitemap SEO | ✓ Aponta para /privacidade (URL canônica LGPD) |
| Supabase — trigger functions | ✓ 0 grants anon/authenticated |
| Supabase — landing_leads RLS | ✓ INSERT bloqueado para REST API direta |
| Build frontend | ✓ 0 erros, 0 warnings (2 warnings intencionais no AdminShell) |
| npm audit | ✓ 0 vulnerabilidades |
| Evolution API | ✓ Healthy (Up 6 days, 163MiB/512MiB) |
| Backend VPS health | ✓ `{"db":"ok","status":"ok"}` |
| Nginx | ✓ Config válida, active |
| Uptime monitor | ✓ `[OK] all endpoints healthy` |
| CI/CD pipeline | ✓ Deployado commit `0be8b4e` |

---

## Riscos Remanescentes (não corrigidos — fora de escopo FC039)

| Risco | Nível | Motivo de não corrigir |
|---|---|---|
| `SET search_path = public` ausente nas trigger functions | WARN (baixo) | Advisor WARN, não ERRO; correção exige migration DDL; risco operacional muito baixo |
| `/privacy` (página inglês) sem redirect para `/privacidade` | Baixo | Sem orientação de produto para manter ou remover; página não está indexada no sitemap |
| BetterStack alerta status >= 500 | Baixo | Dashboard manual — sem automação de alerta ainda |
| Leaked password protection | Bloqueada | Requer Supabase Pro |

---

## Arquivos Alterados

| Arquivo | Mudança |
|---|---|
| `backend/internal/admin/repository.go` | `COALESCE(s.status::text, 'none')` |
| `frontend/components/layout/DashboardShell.tsx` | NavItem `<a>` → `<Link>` |
| `frontend/proxy.ts` | +`/automations`, +`/campaigns` em PROTECTED_PREFIXES |
| `frontend/app/sitemap.ts` | `/privacy` → `/privacidade` |
| Supabase — `public.landing_leads` policy | `WITH CHECK (true)` → `WITH CHECK (false)` |
| Supabase — 6 trigger functions | REVOKE EXECUTE FROM anon, authenticated |

---

## Prevenção

- Ao criar funções trigger em Supabase: verificar grants com `information_schema.routine_privileges`; REVOKE de anon/authenticated imediatamente
- Ao criar tabelas sem tenant_id (plataforma-level): RLS policy insert deve usar `WITH CHECK (false)` se todos os inserts legítimos são via service_role
- Ao criar novos grupos de rotas no `(dashboard)`: atualizar `PROTECTED_PREFIXES` em `proxy.ts` imediatamente
- Ao referenciar rotas no sitemap: verificar que a URL existe como rota Next.js com canonical configurado
- Ao adicionar colunas enum em SQL: sempre fazer cast `::text` antes de COALESCE com string literal
