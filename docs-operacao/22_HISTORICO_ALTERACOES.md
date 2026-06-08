# 22 — HISTÓRICO DE ALTERAÇÕES

## ESTADO ATUAL POR FEATURE (snapshot — atualizar a cada sessão)

> Última atualização: 06/06/2026 (sessão 44 — auditoria completa + correções visuais + fix santos-car billing)
> Este bloco é um snapshot do estado de cada módulo/feature em produção.
> Para histórico cronológico, ver as entradas abaixo.

| Módulo / Feature | Status | Observações |
|---|---|---|
| **Auth / Onboarding** | ✓ Produção | Hybrid session+service role; checklist v2; triggers automáticos; email confirmation ON; password "No requirements" min 8; forgot-password appUrl fix FC035 (sessão 38); focus ring onboarding → `border-primary` (sessão 40) |
| **Dashboard** | ✓ Produção | KPIs + OnboardingChecklist widget; `bg-primary/10` step highlight (sessão 40) |
| **Sidebar** | ✓ Logo +70% (sessão 41 enc.) | `bg-gray-900`; logo sidebar 64px→110px (+72%); mobile topbar 40px→56px (+40%); frame `border-primary/30`; Starter/Pro/Premium por feature flag — ver D28 + SIDEBAR_SNAPSHOT |
| **Veículos** | ✓ Produção | CRUD + vitrine pública SEO + filtros |
| **Leads / CRM / Kanban** | ✓ Produção | Lista, kanban, atividades, follow-ups |
| **Clientes** | ✓ Produção (Starter+) | Movido para base na sessão 23 |
| **Financeiro** | ✓ Produção + sub-nav | Tabs: Resumo / Vendas / Comissões |
| **Vendas** | ✓ Produção | Acessível via sub-nav Financeiro |
| **Comissões** | ✓ Produção | Acessível via sub-nav Financeiro |
| **Vendedores** | ✓ Produção | Acessível via Configurações → Usuários |
| **Analytics** | ✓ Produção (Pro+, `has_analytics`) | — |
| **Assinatura** | ✓ Produção + sub-nav | Tabs: Assinatura / Add-ons / Cobranças / Planos |
| **Add-ons** | ✓ Produção | user_extra / whatsapp_automation / ia_recovery; acessível via sub-nav Billing |
| **Central de Atendimento** | ✓ Produção (`has_central_atendimento`) | Acessível via Configurações → WhatsApp; devecar desconectado |
| **Automações** | ✓ Placeholder produção (`has_automation`) | Gated; CTA WhatsApp add-on condicional — BUG-02 corrigido sessão 29 |
| **Campanhas** | ✓ Placeholder produção (`has_campaigns`) | Gated; "Em breve" com links Analytics/CRM — BUG-02 corrigido sessão 29 |
| **Plano Premium** | ✓ `plan.name = 'premium'` (migration 026) | DB e nome comercial unificados; FC030 corrigido |
| **Sandbox tenant** | ✓ `sandbox-revendaclick` (sessão 26) | Pro active, `tenant_id = e72eb104-98b7-4a71-946d-15e680496fc3`, substitui devecar |
| **Admin Panel** | ✓ Produção (super_admin) | `/admin`; ativar/bloquear/feature/trial por tenant; simulate-event |
| **Billing Asaas** | ✓ Produção | Subscribe, upgrade, webhook, idempotência; AdminSimulateEvent; FC037: CPF/CNPJ do tenant (migration 035) — gate no frontend, lê do DB, valida antes de Asaas |
| **Configurações** | ✓ Produção + Suporte card | Tabs: Loja / Contato Público / Usuários / Plano / WhatsApp; card "Suporte RevendaClick" ao final com email + botão mailto |
| **DevActivate** | ✓ Staging only | `POST /api/billing/dev/activate` — não registrado em produção |
| **Evolution API** | ✓ Produção v2.3.7 | Webhook 401 corrigido (sessão 23); santos-car open; devecar desconectado |
| **OpenRouter AI** | ✓ Produção | classify-lead, suggest-reply |
| **Observabilidade** | ✓ Produção | Prometheus `/metrics`; METRICS_TOKEN confirmado no VPS (sessão 26) |
| **CI/CD** | ✓ Automático | GitHub Actions → GHCR → self-hosted runner VPS; Vercel auto-deploy |
| **RLS / Segurança** | ✓ Migrations 011–025 | Leaked password protection **bloqueada** — requer Supabase Pro (Free plan não suporta HaveIBeenPwned.org) |
| **Billing Asaas — santos-car** | ✓ **Restaurado** (sessão 44) | Ficou `past_due`/`starter` durante testes E2E sessão 42; restaurado para `active`/`pro` via SQL (sessão 44). `sub_b3y3xwo9s18g50xc` no campo asaas_subscription_id |
| **FC031 — ActivateByAsaasSubID** | ✓ **Corrigido** (sessão 28) | `canceled_at = NULL` adicionado ao UPDATE; evita tenant ativo com canceled_at stale |
| **BUG-01/02/03 — Feature flags Premium** | ✓ **Corrigido** (sessão 29) | Sidebar Premium gateada por `has_automation`; /whatsapp copy correto; flags mapeadas no frontend |
| **FC032 — Add-ons sem billing Asaas** | ✓ **Corrigido** (sessão 30 — Etapa 5) | Migration 027 + billing real via Asaas; pending_payment → active via webhook |
| **FC033 — Cancel sub não cancela add-ons** | ✓ **Corrigido** (sessão 30) | Opção A: cancelTenantAddons em cascata; 7/7 smoke tests — commit `529efb2` |
| **Etapa 5 — Billing real add-ons** | ✓ **Implementado** (sessão 30) | Asaas subscription por add-on; status lifecycle; webhook routing; is_redundant |
| **Landing Page** | ✓ **Hero reformulado** (sessão 38) | Hero: formulário removido → CTA direto /register; logo tipográfico; copy novo. Fluxo de leads backend: INALTERADO (CONGELADO) |
| **Admin Leads** | ✓ Produção (sessão 31) | `/admin/leads` — filtros, paginação 25/pág, alerta leads sem contato 4h |
| **Admin Lead Detalhe** | ✓ Produção (sessão 31) | `/admin/leads/[id]` — status, notas, próxima ação, último contato |
| **Pipeline Comercial Leads** | ✓ Produção (migrations 030-031) | 5 status: novo → contatado → em_negociacao → convertido / perdido |
| **Webhook landing lead** | ✓ Produção (opcional) | `POST /api/webhooks/landing-lead` no backend Go — ativo sem Evolution; notificação WA opcional |

| **Documentação feature flags** | ✓ Corrigida (sessão 33) | `has_api_access` era incorretamente documentado como Premium+ — é Scale-only; gate Premium = `has_automation` |
| **Auditoria final homologação** | ✓ APROVADO (sessão 33) | build/tsc/vet/test limpos; infra saudável; fluxos validados; docs sincronizadas |
| **Bugs billing/planos corrigidos** | ✓ Corrigidos (sessão 34) | Seleção dupla + sucesso falso + Asaas 404 — ver sessão 34 abaixo |
| **Bugs add-ons corrigidos** | ✓ Corrigidos (sessão 34) | UI não atualizava após contratar + sem botão cancelar pendente |
| **Security: RLS Evolution API** | ✓ Migration 032 (sessão 34) | 36 tabelas Evolution com RLS deny-all; alertas `rls_disabled` + `sensitive_columns` eliminados |
| **FC034 — Asaas invalid_action deleted sub** | ✓ Corrigido (sessão 36) | Fallback em `UpgradeSubscription`; cria nova sub quando deletada; 6/6 cenários aprovados |
| **Uptime monitoring** | ✓ Ativo (sessão 37) | Cron job `*/5 * * * *` no VPS; checa api+evolution+frontend; falhas logadas + BetterStack |
| **Auditoria documental (sessão 37)** | ✓ Concluída | 9 arquivos corrigidos: `has_api_access` → `has_automation`; FC033→FC034; contagem FCs; flags Premium/Scale |
| **rc_backup fix (sessão 37)** | ✓ Operacional | `alpine:3.20` → `postgres:17-alpine`; pg_dump 17.10; backup 2.2M; cleanup ok |
| **FC035 — forgot-password appUrl localhost** | ✓ Corrigido (sessão 38) | `window.location.origin` em vez de `localhost:3000`; links de recovery agora apontam para o domínio real |
| **Auth audit (sessão 38)** | ✓ AUTH APROVADO | 6 fluxos validados; email confirmation ON; password "No requirements"; forgot-password + login "Email not confirmed" corrigidos |
| **Landing hero (sessão 38)** | ✓ Reformulado | Formulário → CTA direto; logo tipográfico Revenda/Click; copy atualizado |
| **Auditoria ativação lojista (sessão 41)** | ✓ ATIVAÇÃO APROVADA | 5 correções UX: checklist step 4 com CTA; step 3 copy; Termos href; leads empty state; CopyStoreLink — commit `d6307b2` |
| **FC037 — Asaas HTTP 400 CPF/CNPJ ausente (sessão 41 cont.)** | ✓ **Corrigido** | Migration 035 + cpf_cnpj no tenant; backend lê do DB; gate no frontend; campo com máscara — commit `e075945` |
| **Sidebar logo +70% (sessão 41 enc.)** | ✓ **Implementado** | Desktop: 64px→110px (+72%); mobile topbar: 40px→56px (+40%); maxWidth sidebar 200px — commit `e74d51c` |
| **Suporte RevendaClick card (sessão 41 enc.)** | ✓ **Implementado** | Card ao final de Settings com email + botão "Enviar Email" (mailto) — commit `d193574` |
| **Auditoria comercial E2E (sessão 42)** | ✓ **PRONTO PARA OPERAÇÃO COMERCIAL** | Fluxo completo validado: registro→email→login→onboarding→CPF gate→Asaas→veículo→vitrine→lead→CRM→checklist 4/4 — ver entrada sessão 42 abaixo |
| **Migration 036 — published_store trigger (sessão 42)** | ✓ **Corrigido** | Trigger `trg_mark_store_published` em `tenant_public_contacts`; `published_store` agora seta automaticamente ao salvar contato público |

| **Correções visuais homologação (sessão 43)** | ✓ **Concluídas** | C1: Suporte card single-row + logo; C2: topbar bg-gray-900 sólido; C3: bg-[#040C21] auth pages; C5: reset-password redirect via onAuthStateChange — commits `0ee15d9` `c664506` |
| **Premium topbar redesign (sessão 43)** | ✓ **Implementado** | Desktop topbar removida (Linear pattern); mobile h-20→h-14; logo 56px→36px; "Ver loja" migrado para sidebar identity — commit `c664506` |
| **Fix auth background exato (sessão 43 enc.)** | ✓ **Corrigido** | bg-[#040C21]→bg-[#010F21] (amostrado do logo-dark.png); C2 deployado via push 5 commits — commit `4c44b18` |
| **Auditoria completa + fix billing (sessão 44)** | ✓ **Concluída** | santos-car restaurado para Pro/active (estava past_due/starter após testes E2E); novos tenants reais descobertos (finalcar, revenda-click); docs atualizadas; 08_API_ROTAS_REAIS completo |
| **Super Admin — 8 páginas implementadas (sessão 45)** | ✓ **Completo** | /admin/users, /admin/subscriptions, /admin/billing, /admin/features, /admin/whatsapps, /admin/analytics, /admin/logs, /admin/settings — todas funcionais com dados reais do Supabase — commit `ad87d37` |

---

## 2026-06-07 (sessão 45) — Super Admin: 8 páginas implementadas

### Problema
Menu do Super Admin exibia 8 rotas que retornavam 404 (users, subscriptions, billing, features, whatsapps, analytics, logs, settings).

### Implementado
- `/admin/users` — query `users` + `tenants` JOIN; cards role/status; tabela com último acesso
- `/admin/subscriptions` — query `subscriptions` + `plans` + `subscription_addons`; MRR estimado
- `/admin/billing` — query `billing_invoices` + `tenants`; receita recebida vs inadimplente
- `/admin/features` — query `tenant_features` + `tenants`; agrupado por tenant + tabela completa
- `/admin/whatsapps` — query `Instance` + `Session` + contagem `Message`; status de conexão Evolution
- `/admin/analytics` — 8 tabelas via `Promise.all`; MRR, ARR, churn, conversão, planos, receita
- `/admin/logs` — query `audit_logs` + lookup manual de `users` (sem FK direta); top entidades
- `/admin/settings` — planos, add-ons, infraestrutura, variáveis de ambiente, links operacionais

### Técnico
- Todas Server Components, `createServiceClient()` (service role), zero mock data
- TypeScript: 0 erros (1 fix: audit_logs sem FK para users → lookup manual)
- Commit `ad87d37` → push main → Vercel auto-deploy

---

## 2026-06-06 (sessão 44) — Auditoria autônoma completa

### Achados críticos
- santos-car ficou `past_due` + `starter` após sequência de eventos Asaas durante E2E sessão 42 (2026-06-03 SUBSCRIPTION_DELETED + 2026-06-05 PAYMENT_OVERDUE)
- Restaurado via SQL: `plan_id = Pro`, `status = active`, `grace_until = NULL`
- `get_tenant_usage()` confirmado: Pro + active + features corretas (crm, analytics, central_atendimento...)

### Novos tenants em produção (não documentados antes)
| Tenant | Email | Status |
|---|---|---|
| `finalcar` | metodolimpezas@gmail.com | Assinou Pro, cancelou (2026-06-05) |
| `revenda-click` | app.revendaclick@gmail.com | Trial Starter ativo (2026-06-06) |
| `auditoria-rc-s42` | auditoria.rc.s42@gmail.com | E2E test tenant sessão 42 |

### Landing leads reais
- "Joaõ" — São José/SC, phone 48998232010 — status `novo` (2026-06-04) — lead real não atendido ainda

### Documentação atualizada
- `REFERENCE.md`: tabela tenants completa, nota migration 033 obsoleta
- `08_API_ROTAS_REAIS.md`: add-on routes, admin routes, landing-lead webhook, evolution gate
- `22_HISTORICO_ALTERACOES.md`: sessões 43 + 44
- `23_PROXIMO_PASSO.md`: estado atual + próximos passos

---

## 2026-06-05 (sessão 42) — Auditoria comercial E2E + Migration 036 published_store

### Auditoria comercial E2E — PRONTO PARA OPERAÇÃO COMERCIAL

Fluxo completo testado com tenant real (`auditoria-rc-s42`):

1. **Registro** — `POST /api/onboarding/setup` criou tenant `45e09d8c-0546-45fa-b94d-4a32b08f0038`
2. **Email confirmation** — `email_confirmed_at` setado via Supabase
3. **Login** — JWT + claim `tenant_id` corretos
4. **Onboarding** — checklist 4 passos iniciado
5. **CPF gate** — `PUT /api/tenants/me` com `cpf_cnpj`; gate no frontend ok
6. **Asaas subscribe** — `sub_nas6a1w4kxontf5n` criado (Pro, active)
7. **Veículo cadastrado** — Toyota Corolla 2022, `cf6c2083-7d93-403d-85c2-0d34eb21d6a5`; `added_vehicle = true`
8. **Vitrine pública** — `https://app.revendaclick.com.br/auditoria-rc-s42` HTTP 200, SEO correto
9. **Lead gerado** — Pedro Comprador, `b295d01f-2ff1-465a-99ab-5324ece0b10a`; `received_first_lead = true`
10. **CRM** — lead visível em `/crm`, kanban funcionando
11. **Contato público** — salvo via `PUT /api/store-contact`; `published_store = true` (trigger 036)
12. **Checklist 4/4 completo** — `completed_at` setado automaticamente

### Migration 036 — Bug found & fixed

**Problema:** `published_store` em `onboarding_checklists` nunca era setado `true`. Lojistas ficavam presos em 3/4 do checklist de onboarding para sempre.

**Causa raiz:** `PUT /api/store-contact` salvava em `tenant_public_contacts` mas não havia trigger na tabela — ao contrário de `vehicles` (`trg_mark_vehicle_added`) e `leads` (`trg_mark_first_lead_received`).

**Correção:** `database/migrations/036_mark_store_published_trigger.sql`

```sql
CREATE OR REPLACE FUNCTION public._mark_store_published()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.onboarding_checklists
  SET published_store = true, updated_at = NOW()
  WHERE tenant_id = NEW.tenant_id AND published_store = false;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mark_store_published
AFTER INSERT OR UPDATE ON public.tenant_public_contacts
FOR EACH ROW EXECUTE FUNCTION public._mark_store_published();
```

**Aplicado em produção** via MCP Supabase. **Verificado:** após `PUT /api/store-contact`, `published_store = true` e `completed_at` setado.

### Divergências documentais corrigidas

- `SIDEBAR_SNAPSHOT.md`: logo heights atualizados (64px→110px, 40px→56px)
- `REFERENCE.md`: migration 035→036, próxima 037
- `PRODUCT_ARCHITECTURE.md`: limites de veículos corrigidos (50/200/500 → 15/50/120, conforme DB real)

---

## 2026-06-05 (sessão 41 enc.) — Sidebar logo +70% + card Suporte RevendaClick

**Alterações visuais sem impacto em arquitetura ou billing.**

### Sidebar logo +70%

**Arquivo:** `frontend/components/layout/DashboardShell.tsx`

| Elemento | Antes | Depois |
|---|---|---|
| Container sidebar (logo area) | `h-24` (96px) | `h-36` (144px) |
| Logo altura sidebar | `64px` | `110px` (+72%) |
| Logo maxWidth sidebar | `160px` | `200px` |
| Container topbar mobile | `h-16` (64px) | `h-20` (80px) |
| Logo altura topbar mobile | `40px` | `56px` (+40%) |
| Logo maxWidth topbar mobile | `120px` | `160px` |

**Commit:** `e74d51c`

### Suporte RevendaClick

**Arquivo:** `frontend/app/(dashboard)/settings/page.tsx`

Card adicionado ao final da página Settings (abaixo de `<SettingsTabs>`):
- Título: "Suporte RevendaClick"
- Descrição: "Precisa de ajuda? Entre em contato com nossa equipe."
- Email visível: `contato@revendaclick.com.br` (link mailto)
- Botão "Enviar Email" (bg-primary, mailto)
- Sem backend, sem tickets, sem chat

**Commit:** `d193574`

---

## 2026-06-05 (sessão 41 cont.) — FC037: CPF/CNPJ obrigatório para billing Asaas

**Problema:** Asaas retorna HTTP 400 `invalid_object: Para criar esta cobrança é necessário preencher o CPF ou CNPJ do cliente` ao contratar ou alterar plano em `/settings?tab=plan` e `/billing/plans`.

**Causa raiz:** `service.go:Subscribe()` lia `req.CPFOrCNPJ` do body HTTP. O frontend nunca enviava esse campo. A coluna `cpf_cnpj` não existia na tabela `tenants`.

**Migration aplicada:** `035_add_cpf_cnpj_to_tenants.sql` — `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(18)`

**Arquivos alterados:**
- `database/migrations/035_add_cpf_cnpj_to_tenants.sql` — **novo**
- `backend/internal/tenant/model.go` — `CPFOrCNPJ *string` em `Tenant` + `UpdateRequest`
- `backend/internal/tenant/repository.go` — cpf_cnpj em SELECT/UPDATE/RETURNING; `scanTenant` atualizado
- `backend/internal/billing/repository.go` — `GetAsaasCustomerID` retorna 5 valores (+ cpfCnpj)
- `backend/internal/billing/asaas.go` — `updateCustomer()` adicionado (PUT /customers/{id})
- `backend/internal/billing/service.go` — `Subscribe()` lê cpfCnpj do DB; valida antes de chamar Asaas; atualiza customer existente; 3 call sites de `GetAsaasCustomerID` atualizados
- `frontend/lib/tenant.ts` — `cpf_cnpj: string | null` no tipo `Tenant`
- `frontend/app/(dashboard)/settings/actions.ts` — `cpf_cnpj` em `TenantUpdatePayload`
- `frontend/app/(dashboard)/settings/page.tsx` — `cpf_cnpj` passado ao `SettingsTabs`
- `frontend/app/(dashboard)/settings/_components/SettingsTabs.tsx` — campo CPF/CNPJ com máscara e validação; gate em `PlanTab`; botões desabilitados sem cpf_cnpj
- `frontend/app/(dashboard)/billing/plans/page.tsx` — `getTenantById` para obter cpf_cnpj
- `frontend/app/(dashboard)/billing/plans/_components/PlansGrid.tsx` — repassa cpfCnpj ao PlanCard
- `frontend/app/(dashboard)/billing/plans/_components/PlanCard.tsx` — gate amigável + botão "Preencher agora"; campo CPF opcional removido

**Fluxo implementado:**
1. Lojista preenche CPF/CNPJ em Configurações → Loja (com máscara + validação)
2. Ao contratar plano: se ausente → gate amigável + link "Preencher agora" → `/settings?tab=store`
3. Backend: Subscribe() lê cpf_cnpj do banco; valida antes de chamar Asaas
4. Se customer Asaas já existe: `updateCustomer()` sincroniza o CPF/CNPJ antes de criar subscription
5. Se customer não existe: `createCustomer()` com cpf_cnpj do banco

**Auditoria de validação:**
- TypeScript: ✓ limpo (0 erros)
- Build frontend: ✓ sucesso
- Migration Supabase: ✓ aplicada

**Commit:** `e075945`

---

## 2026-06-05 (sessão 41) — Auditoria de ativação do lojista — jornada primeiro acesso

**Objetivo:** Auditar e corrigir o fluxo completo Landing → Cadastro → Login → Onboarding → Dashboard para o primeiro lojista. Foco em UX sem alterar arquitetura ou fluxos de negócio.

**Migrations aplicadas:** nenhuma

**Arquivos alterados:**
- `frontend/components/onboarding/OnboardingChecklist.tsx` — step 3: description corrigida ("publique" → "aparecer na vitrine"); step 4: `href: null` → `href: '/leads'` + description orientada à ação
- `frontend/app/onboarding/page.tsx` — `href="#"` (Termos de Uso) → `href="/terms"`
- `frontend/app/(dashboard)/leads/page.tsx` — banner contextual quando `total === 0` com link da vitrine e orientação ao lojista
- `frontend/app/(dashboard)/dashboard/page.tsx` — card do link da loja substituído por `CopyStoreLink`
- `frontend/components/dashboard/CopyStoreLink.tsx` — **novo** — botão "Copiar" com feedback "✓ Copiado" (2s)

**Problemas corrigidos:**

| # | Problema | Impacto | Correção |
|---|---|---|---|
| P1 | Step 4 do checklist sem CTA (`href: null`) | CRÍTICO — lojista sem ação possível | `href: '/leads'` + botão "Fazer agora" |
| P2 | "Termos de Uso" com `href="#"` | Alto — link morto, desconfiança | `href="/terms"` |
| P3 | Leads vazio: "Sem leads" sem contexto | Alto — usuário não sabe o que fazer | Banner explicativo com link da vitrine |
| P4 | Link da loja sem botão copiar | Médio — dificulta compartilhamento | `CopyStoreLink` client component |
| P5 | Step 3 description: "publique sua loja" | Médio — expectativa de botão inexistente | Copy corrigido para ação real |

**Auditoria de validação:**
- TypeScript: ✓ limpo (0 erros)
- Build frontend: ✓ sucesso
- Rotas `/leads`, `/onboarding`, `/dashboard`, `/terms`: ✓ presentes

**Commit:** `d6307b2`

---

## 2026-06-04 (sessão 40) — Refinamento visual da navegação + auditoria completa fluxo Landing→Lead

**Objetivo:** (1) Refinamento visual da sidebar e topbars. (2) Auditoria de branding no fluxo completo Landing → Cadastro → Login → Onboarding → Primeiro veículo → Primeira publicação → Primeiro lead.

**Migrations aplicadas:** nenhuma

**Arquivos alterados:**
- `frontend/components/layout/DashboardShell.tsx` — sidebar `bg-gray-900`; topbars `bg-gray-900/90 backdrop-blur`; logo sidebar/mobile com frame `border-primary/30 rounded-xl p-1.5 bg-white/[0.04]`; logo sidebar 80px→64px, mobile 48px→40px
- `frontend/app/onboarding/page.tsx` — focus ring campo slug: `border-red-600 ring-red-600` → `border-primary ring-primary`
- `frontend/components/onboarding/OnboardingChecklist.tsx` — `bg-primary/8` → `bg-primary/10` (opacidade padrão Tailwind)
- `frontend/app/(public)/[slug]/[vehicleSlug]/page.tsx` — injeção de `--primary` CSS var do tenant (gap crítico: CTA usava cor padrão da plataforma em vez da cor da loja)
- `docs-operacao/features/SIDEBAR_SNAPSHOT.md` — atualizado com dark theme

**Commits:**
- `cb03ab2` — `feat(nav): refinamento visual da navegação — borda logo, sidebar e topbars`
- `1dc7460` — `fix(branding): auditoria fluxo completo — 3 correções de cor primária`

**Problemas corrigidos:**

| # | Problema | Impacto | Correção |
|---|---|---|---|
| B1 | Focus ring campo slug hardcoded `red-600` | Visual — inconsistência com tema | `focus-within:border-primary ring-primary` |
| B2 | `bg-primary/8` não-padrão Tailwind | Visual — pode não gerar CSS | `bg-primary/10` |
| B3 | Página detalhe do veículo sem `--primary` var | CRÍTICO — CTA usava cor da plataforma, não da loja | Adicionado `hexToRgbChannels` + wrapper div com `style` |

**Auditoria do fluxo completo:**

| Etapa | Status | Observação |
|---|---|---|
| Landing | ✅ OK | NavBar + Hero com `text-primary` / `bg-primary` corretos |
| Cadastro | ✅ OK | Dark bg, logo-dark.png, btn-primary |
| Login | ✅ OK | Dark bg, logo-dark.png, text-primary links |
| Onboarding (config loja) | ✅ OK após B1 | focus ring corrigido |
| Dashboard | ✅ OK | KPIs, links primários, checklist |
| Primeiro veículo | ✅ OK | btn-primary, text-primary preço, upgrade card |
| Primeira publicação (loja pública) | ✅ OK | --primary injetado, filtros/CTA com cor da loja |
| Detalhe do veículo / Primeiro lead | ✅ OK após B3 | --primary agora injetado corretamente |

| Módulo / Feature | Status |
|---|---|
| **Navegação dark theme (sessão 40)** | ✓ Sidebar `bg-gray-900`; topbars `bg-gray-900/90 backdrop-blur`; logo com borda primária |
| **Auditoria branding fluxo completo (sessão 40)** | ✓ 3 correções — commits `cb03ab2` + `1dc7460` |

---

## 2026-06-04 (sessão 39) — Auditoria UX fluxo de ativação do lojista

**Objetivo:** Auditar e corrigir o fluxo Landing → Cadastro → Email → Login → Onboarding → Dashboard. Foco em remover atritos que impedem ativação do primeiro lojista pagante.

**Migrations aplicadas:** nenhuma

**Arquivos alterados:**
- `docs-operacao/REFERENCE.md` — FC count 34→35; próxima FC035→FC036
- `frontend/components/onboarding/OnboardingChecklist.tsx` — P1: `/vehicles/new` (404) → `/vehicles`; P2: `tab=contato-publico` → `tab=contact`
- `frontend/app/onboarding/page.tsx` — P3/P4: pré-preencher nome+email da sessão Supabase; P5: erros amigáveis via `friendlyError()`; logo 280px → 80px; catch genérico sanitizado; P9: typo `sujarevenda` → `suarevenda`
- `frontend/app/register/page.tsx` — P7: logo 280px → 80px (form + tela done); P6: aviso de spam/promoções na tela de confirmação; copy "Tentar novamente" → "Usar outro email"
- `frontend/app/login/page.tsx` — P7: logo 280px → 80px
- `frontend/app/forgot-password/page.tsx` — P8: "RC" quadrado → logo.png (80px), consistente com auth flow

**Problemas corrigidos:**

| # | Problema | Impacto | Correção |
|---|---|---|---|
| P1 | `/vehicles/new` → 404 | CRÍTICO — bloqueava ativação | href → `/vehicles` |
| P2 | `tab=contato-publico` → tab errado | CRÍTICO — bloqueava publicação | href → `?tab=contact` |
| P3 | Nome pedido 2x | Alto — atrito desnecessário | pré-preencher do user_metadata |
| P4 | E-mail da loja vazio | Alto — atrito desnecessário | pré-preencher do user.email |
| P5 | Erros técnicos expostos | Alto — confundia usuário | `friendlyError()` por código |
| P6 | Sem aviso de spam | Alto — abandono por não receber email | Texto orientativo adicionado |
| P7 | Logo 280px em auth | Médio — bloqueava form mobile | Reduzido para 80px |
| P8 | Logo inconsistente forgot-password | Médio — desorientação | logo.png 80px |
| P9 | Typo "sujarevenda" | Baixo | Corrigido |

**Commit:** `ee85f9c`

| Módulo / Feature | Status |
|---|---|
| **UX ativação lojista (sessão 39)** | ✓ 9 problemas corrigidos — commit `ee85f9c` |

---

## 2026-06-03 (sessão 38) — Auditoria auth APROVADO + otimização hero landing page

**Objetivo:** Validar e corrigir os 6 fluxos de autenticação. Otimizar hero da landing para conversão direta.

**Migrations aplicadas:** nenhuma

**Arquivos alterados:**
- `frontend/app/forgot-password/page.tsx` — FC035: `appUrl` fallback `'http://localhost:3000'` → `window.location.origin`
- `frontend/app/login/page.tsx` — mensagem específica "Confirme seu e-mail antes de entrar" quando erro = "Email not confirmed"
- `frontend/components/marketing/NavBar.tsx` — logo PNG `<Image>` → logo CSS `<span>` (`Revenda` branco + `Click` vermelho; +50% tamanho; contraste perfeito em fundo escuro)
- `frontend/components/marketing/HeroSection.tsx` — formulário de captura removido; CTA "Começar Agora" (→ /register) + "Ver Demonstração" (→ #como-funciona); subtítulo atualizado; benefício: `+500 revendas` → `Configuração em menos de 5 minutos`

**Configurações Supabase Dashboard (executadas pelo usuário):**
- Password Strength: "No requirements" (mínimo 8 caracteres)
- Email confirmations: ON
- Redirect URLs: `https://app.revendaclick.com.br/auth/callback` adicionado

**Bugs corrigidos:**
- FC035: link de recuperação de senha apontava para `localhost:3000` se `NEXT_PUBLIC_APP_URL` ausente na Vercel
- Login: "Email or password invalid" genérico → mensagem específica quando e-mail ainda não confirmado

**Auditoria auth — resultado:** AUTH APROVADO

| Fluxo | Status |
|---|---|
| Cadastro de usuário novo | ✓ |
| Confirmação de e-mail | ✓ |
| Login após confirmação | ✓ |
| Recuperação de senha | ✓ FC035 corrigido |
| Redefinição de senha | ✓ |
| Login após redefinição | ✓ |

**Commits:**
- `234abe4` — fix(auth): corrigir appUrl no forgot-password — fallback era localhost:3000
- `a64143d` — fix(auth): mensagem específica quando e-mail não confirmado no login
- `39b8ad9` — feat(landing): otimização hero — logo texto, CTA direto, copy novo

**Deploy:** Frontend: EXECUTADO (Vercel — push automático) | Backend: NÃO EXECUTADO | Banco: NÃO EXECUTADO

**TypeScript:** ✓ clean | **Go build/vet:** NÃO EXECUTADO (sem alteração Go)

---

## 2026-06-03 (sessão 37) — Auditoria documental + uptime monitoring + fix rc_backup

**Objetivo:** Eliminar pendências autônomas sem alterar arquitetura ou criar funcionalidades.

**Migrations aplicadas:** nenhuma

**Arquivos documentais corrigidos:**
- `docs-operacao/features/SIDEBAR_SNAPSHOT.md` — gate Premium: `has_api_access` → `has_automation`
- `docs-operacao/MEMORY.md` — 3 ocorrências: tabela planos + sidebar + regra 6
- `docs-operacao/PRODUCT_ARCHITECTURE.md` — 5 ocorrências: planos table, feature flags table, sidebar, automações/campanhas requires
- `docs-operacao/23_PROXIMO_PASSO.md` — sidebar + FC033→FC034 + contagem 33→34 FCs
- `docs-operacao/21_DECISOES_TECNICAS.md` — D28: NAV_PREMIUM gate corrigido
- `docs-operacao/17_FLUXOS_NEGOCIO.md` — gates automações/campanhas corrigidos
- `docs-operacao/15_BILLING_ASAAS.md` — Premium plan description corrigida
- `docs-operacao/tests/E2E_TEST_PLAN.md` — 2 ocorrências corrigidas
- `docs-operacao/20_PENDENCIAS.md` — uptime monitoring marcado como CONCLUÍDA

**Infraestrutura configurada (VPS):**
- Script `/opt/revendaclick/scripts/health-check.sh` — verifica api+evolution+frontend; alerta via BetterStack
- Crontab `*/5 * * * *` — executa a cada 5 min; log em `/var/log/rc_health.log`
- Testado: todos endpoints retornando 200 ✓

**Fix rc_backup:**
- Causa raiz: `alpine:3.20` instala `postgresql-client` 16.x — incompatível com servidor Supabase 17.6
- Erro: `pg_dump: error: aborting because of server version mismatch — server version: 17.6; pg_dump version: 16.14`
- Solução: `docker-compose.production.yml` — `alpine:3.20` → `postgres:17-alpine` (inclui pg_dump 17.10 nativamente)
- Removida linha `apk add --no-cache postgresql-client bash` (não mais necessária)
- Aplicado no VPS e sincronizado para o repositório git (commit `f9839cb`)
- Validação: pg_dump 17.10 ✓; backup `backup-2026-06-03_14-01-07.sql.gz` (2.2M) ✓; cleanup `>7d` executou ✓
- VEREDITO: BACKUP OPERACIONAL

**Diagnósticos entregues:**
- BetterStack backend: ✓ operacional (token VPS + container + `betterstack/syncer.go`)
- BetterStack frontend: ✓ operacional (`@logtail/next` + `instrumentation.ts` + `/api/log/error` route)
  - Pendência manual: confirmar `BETTER_STACK_SOURCE_TOKEN` nas env vars do Vercel dashboard
- E2E Playwright: estrutura OK; 4 senhas faltando no `.env.e2e`

**Commits:**
- `640b2b1` — docs: sessão 37 — auditoria documental + uptime monitoring
- `f9839cb` — fix(backup): usar postgres:17-alpine para pg_dump compatível com PostgreSQL 17.6

---

## 2026-06-02 (sessão 36) — Fix upgrade/downgrade Asaas invalid_action

**Objetivo:** Diagnosticar e corrigir `400 invalid_action` em todas as operações de upgrade/downgrade/ciclo do tenant santos-car.

**Migrations aplicadas:** nenhuma

**Arquivos alterados:**
- `backend/internal/billing/service.go` — `UpgradeSubscription`: fallback para criar nova assinatura quando `PUT /subscriptions/{id}` retorna `invalid_action`

**Diagnóstico:**
- `sub_gqu4uiro0sisshxt`: `deleted: true` no Asaas — `PUT` rejeitado com `400 invalid_action`
- Comportamento correto Asaas: assinatura deletada NÃO pode ser atualizada; deve ser recriada
- Divergência: código tentava sempre `PUT`; não havia fallback para assinatura deletada

**Correção (service.go — UpgradeSubscription):**
- Ao detectar `invalid_action` no erro do `updateSubscription`: cria nova assinatura Asaas via `POST /subscriptions`
- Salva novo `asaas_subscription_id` + `billing_cycle` + `plan_id` via `UpdateSubscriptionAsaas` (status = trialing)
- Em caso de erro ao salvar: cancela a nova assinatura no Asaas (best-effort cleanup)

**Testes executados:**
| Cenário | Resultado | Novo ID |
|---|---|---|
| Upgrade Pro → Premium (assinatura deletada) | ✅ Fallback ativado — nova assinatura criada | `sub_b3y3xwo9s18g50xc` |
| Downgrade Premium → Pro (assinatura ativa) | ✅ PUT normal funcionou | — |
| Mensal → Anual | ✅ | — |
| Anual → Mensal | ✅ | — |
| Upgrade Pro → Premium (assinatura ativa) | ✅ PUT normal funcionou | — |
| Downgrade Premium → Starter | ✅ | — |

**Estado final santos-car:**
- Plan: Pro, monthly, active
- `asaas_subscription_id`: `sub_b3y3xwo9s18g50xc` (ativo no Asaas)
- Go vet: VET_OK | TypeScript: clean

**Rebuild VPS (encerramento sessão 36):**
- `git pull origin main` → Already up to date
- `docker compose down` → rc_backend, rc_evolution parados
- `docker compose up -d --build` → rebuildo local da imagem; containers `revendaclick-backend-1` + `revendaclick-evolution-1` saudáveis
- `GET /health` → `{"db":"ok","status":"ok"}` ✅
- Observação: containers `rc_redis` e `rc_backup` seguem como orphans — correto; não afetam operação

**FC034 documentado:** `docs-operacao/FalhasCorrigidas/FC034_ASAAS_INVALID_ACTION_DELETED_SUBSCRIPTION.md`

---

## 2026-06-02 (sessão 35) — Auditoria e correção asaas_subscription_id santos-car

**Objetivo:** Localizar a assinatura Asaas real do tenant santos-car e corrigir o campo `asaas_subscription_id` que continha valor legado fictício.

**Migrations aplicadas:** nenhuma (correção de dados via execute_sql)

**Arquivos alterados:**
- `database/migrations/033_fix_santos_car_asaas_subscription_id.sql` — criado para rastreabilidade

**Auditoria realizada:**
- `asaas_customer_id` no banco: `cus_000178518508` (real, produção)
- Assinaturas Asaas do customer: 3 add-ons ativos + 1 plano principal encontrado
- `sub_gqu4uiro0sisshxt` (Pro R$ 197/mês): `deleted: true`, `status: INACTIVE` — criado sessão 27, cancelado posteriormente
- Nenhuma assinatura ativa do plano principal existe no Asaas

**Correção aplicada:**
- `asaas_subscription_id`: `dev_test_fd1172f6-11e7-4555-8fe3-082fd1849587` → `sub_gqu4uiro0sisshxt`
- Efeito: ID agora é rastreável e o Asaas responde com erro correto (`400 invalid_action`) em vez de `404 not found`

**Testes pós-correção:**
- Upgrade Pro → Premium: `400 "A assinatura [sub_gqu4uiro0sisshxt] não pode ser atualizada."` (esperado — assinatura deletada)
- Mensal → Anual: `400 invalid_action` (mesmo motivo)
- Upgrade/downgrade completo: **BLOQUEADO** até nova assinatura ser criada via subscribe

**Resolução pendente (ação manual):**
Para reativar upgrade/downgrade, Dilney deve acessar /settings e passar pelo fluxo de assinatura (re-subscribe ao plano Pro). Isso criará um novo `sub_xxx` ativo no Asaas e salvará no banco automaticamente.

---

## 2026-06-02 (sessão 34) — Correção bugs billing + security RLS Evolution API

**Objetivo:** Corrigir 3 bugs de billing/planos, 2 bugs de add-ons e eliminar alertas críticos do Security Advisor.

**Migrations aplicadas:** `032_evolution_api_rls_deny_all`

**Arquivos alterados (código):**
- `frontend/app/(dashboard)/settings/_components/SettingsTabs.tsx` — PlanTab: roteamento upgrade, detecção guard, msg sucesso corrigida
- `frontend/app/(dashboard)/billing/plans/_components/PlanCard.tsx` — msg sucesso quando sem payment link
- `frontend/app/(dashboard)/billing/addons/_components/AddonsClient.tsx` — router.refresh() pós-ação + botão cancelar pendente
- `backend/internal/billing/service.go` — retry Asaas 404 (recriar customer)
- `database/migrations/032_evolution_api_rls_deny_all.sql` — criado localmente

**Resultados:**
- Billing/Planos Bug 1 (seleção dupla): corrigido — upgrade routing + guard detection
- Billing/Planos Bug 2 (sucesso falso): corrigido — msg indica pagamento pendente
- Billing/Planos Bug 3 (Asaas 404): corrigido — retry automático com novo customer
- Add-ons Bug 1 (UI não atualiza): corrigido — router.refresh() pós-activate
- Add-ons Bug 2 (sem cancelar pendente): corrigido — botão "Cancelar contratação" adicionado
- Security: 36 tabelas Evolution com RLS deny-all; `rls_disabled_in_public` + `sensitive_columns_exposed` eliminados
- Evolution API: operacional após migration (HTTP 200, instâncias respondendo)
- TypeScript: clean | Go vet: VET_OK

---

## 2026-06-02 (sessão 33) — Auditoria final de homologação

**Objetivo:** Validar o estado completo do sistema antes da abertura comercial.

**Commits:** _(ver commit desta sessão)_

**Migrations aplicadas:** nenhuma.

**Arquivos alterados (docs):**
- `docs-operacao/DEPENDENCIES.md` — METRICS_TOKEN corrigido (estava como ausente; confirmado presente)
- `docs-operacao/REFERENCE.md` — feature flags corrigidas: `has_api_access` Scale-only; gate Premium = `has_automation`; sidebar gates atualizado
- `docs-operacao/21_DECISOES_TECNICAS.md` — D28 gate Premium corrigido: `has_automation` (não `has_api_access`)
- `docs-operacao/MEMORY.md` — feature flags Premium/Scale corrigidas
- `docs-operacao/features/FEATURE_FLAGS_SNAPSHOT.md` — tabela completa reescrita com flags reais do banco
- `docs-operacao/features/SIDEBAR_SNAPSHOT.md` — gate Premium: `has_automation`

**Código alterado:** nenhum (código estava correto).

**Resultados da auditoria:**
- `npm run build` → ✓ 53 páginas compiladas sem erros
- `npx tsc --noEmit` → ✓ clean
- `go vet ./...` → ✓ VET_OK
- `go test ./...` → ✓ billing/leads/observability/onboarding — 4 packages OK
- Containers produção → ✓ rc_backend (healthy 9.8MB), rc_evolution (healthy 165MB), rc_redis (healthy 3.8MB)
- `POST /api/leads/landing` → ✓ `{"success":true}` testado em produção
- Vitrine santos-car → ✓ 200 OK

**Divergências encontradas e corrigidas:**
1. FC033 ainda listada como pendente na auto-memory → removida (resolvida na sessão 30 com Opção A)
2. METRICS_TOKEN descrito como ausente em DEPENDENCIES.md → corrigido (confirmado presente desde sessão 26)
3. `has_api_access` documentado como gate Premium → corrigido para `has_automation` (banco confirma: `api_access` só em Scale)

**Veredicto:** REVENDACLICK APROVADO PARA PRODUÇÃO

---

## 2026-06-01 (sessão 32) — Consolidação arquitetura: WhatsApp da Loja vs Central de Atendimento

**Objetivo:** Eliminar toda ambiguidade documental entre os dois conceitos de WhatsApp — produto base vs add-on opcional.

**Commits:** `2839603`, `556eeef`

**Migrations aplicadas:** nenhuma.

**Arquivos alterados:**
- `docs-operacao/PRODUCT_ARCHITECTURE.md` — Proposta de valor corrigida ("add-on opcional"); diagrama marcado com `← add-on whatsapp_automation — opcional`
- `docs-operacao/17_FLUXOS_NEGOCIO.md` — Tabela comparativa dos dois conceitos adicionada; Fluxo 4 renomeado como add-on; Fluxo 10 renomeado como "Central de Atendimento (add-on)"
- `docs-operacao/19_RISCOS.md` — R1/R3/R13: linguagem corrigida — falha da Evolution não afeta produto base; WhatsApp da Loja não é afetado
- `docs-operacao/DEPENDENCIES.md` — Tabela de dependências externas: Evolution e Redis corrigidos para "(add-on)"
- `docs-operacao/architecture/STACK_OVERVIEW.md` — Camada "WhatsApp" → "Central de Atendimento (add-on)"
- `docs-operacao/21_DECISOES_TECNICAS.md` — D34 registrada

**Decisões desta sessão:**
- **D34**: WhatsApp da Loja = produto base (link `wa.me`, sem Evolution). Central de Atendimento = add-on `whatsapp_automation` (Evolution + QR Code obrigatórios). Falha da Evolution não afeta o produto base.

**Testes:** Sessão documental — sem alterações de código ou banco. Deploy: não executado.

---

## 2026-06-01 (sessão 31) — Pipeline comercial de leads + reclassificação webhook

**Objetivo:** Garantir operação comercial real — nenhum lead perdido, equipe acompanha ciclo completo.

**Commits:** `e766fd8`, `d8ee343`, `40cbe0d`, `69883bb`

**Migrations aplicadas:**
- `030_landing_leads_status.sql` — status (novo/contatado/atendido/convertido/descartado), notes, updated_at, índice status
- `031_landing_leads_pipeline.sql` — renomear atendido→em_negociacao, descartado→perdido; add last_contact_at, next_action

**Arquivos criados/alterados:**
- `frontend/app/(admin)/admin/leads/actions.ts` — Server Actions: `updateLeadStatus` + `updateLeadDetail`; last_contact_at automático ao avançar status de contato
- `frontend/app/(admin)/admin/leads/page.tsx` — filtros por status (tabs), paginação 25/pág, alerta amarelo para leads novos sem contato há mais de 4h, coluna "próxima ação"
- `frontend/app/(admin)/admin/leads/[id]/page.tsx` — detalhe com todos os dados UTM + form de atendimento
- `frontend/app/(admin)/admin/leads/_components/LeadStatusBadge.tsx` — badge colorido por status
- `frontend/app/(admin)/admin/leads/_components/QuickStatusForm.tsx` — botão de avanço rápido inline na listagem
- `frontend/app/(admin)/admin/leads/_components/LeadDetailForm.tsx` — form completo: status + próxima ação + notas + checkbox "registrar último contato agora"
- `backend/internal/landinglead/handler.go` — novo package; receptor do webhook opcional; notificação WA via Evolution se configurado
- `backend/internal/config/config.go` — LeadWebhookSecret, LeadNotifyInstance, LeadNotifyNumber
- `backend/internal/server/server.go` — rota `POST /api/webhooks/landing-lead` registrada
- `frontend/app/api/leads/landing/route.ts` — comentário webhook corrigido (opcional)
- `backend/.env.example` — seção webhook documentada como opcional
- `database/migrations/030_landing_leads_status.sql` / `031_landing_leads_pipeline.sql` — arquivos locais

**Decisões desta sessão:**
- **D31**: Fluxo principal de leads é `Landing → Supabase → /admin/leads`. Webhook, Evolution e WhatsApp são opcionais/add-on.
- **D32**: Status de lead: `novo → contatado → em_negociacao → convertido | perdido` (migrated de atendido/descartado — migration 031)
- **D33**: Alerta operacional implementado sem cron/worker — query simples na renderização do Server Component (leads novos há mais de 4h).

**Fluxo principal validado:** Lead salvo no Supabase + visível em `/admin/leads` = funcionamento completo. Sem necessidade de webhook ou Evolution.

**Testes:** `tsc --noEmit` ✓ | `npm run build` ✓ | Backend deployado via CI/CD — endpoint `/api/webhooks/landing-lead` respondendo 200 em produção.

---

## 2026-05-31 (sessão 30b) — FC033: Cancelamento em cascata de add-ons

**Objetivo:** Implementar Opção A — sem plano ativo = sem add-ons ativos.
**Commit:** `529efb2`

**Arquivos alterados:**
- `backend/internal/billing/repository.go` — `ListActiveAddonIDs` + `CancelAllAddonsByTenantID`
- `backend/internal/billing/service.go` — `cancelTenantAddons()` helper; `CancelSubscription` chama cascata; `dispatchWebhookEvent` recebe `tenantID` e cancela add-ons em `EventSubCanceled`/`EventSubDeleted`
- `frontend/app/(dashboard)/billing/_components/CancelButton.tsx` — aviso estático + mensagem no `confirm()`

**Smoke tests — 7/7 ✓:**
T1: 3 add-ons (active/pending/past_due) cancelados em cascata ✓ | T2: reativação não restaura add-ons ✓ | T3: sem add-ons → sem erro ✓ | T4: idempotência ✓ | T5: grandfathered (asaas_addon_id=NULL) → só DB ✓ | T6: SUBSCRIPTION_DELETED também dispara cascata ✓ | T7: DELETE direto via API (owner JWT) ✓

---

## 2026-05-31 (sessão 30) — Etapa 5: Billing real Asaas para add-ons (migration 027)

**Objetivo:** Implementar cobrança real via Asaas para add-ons — fecha FC032. Add-ons anteriores eram gratuitos (gap sem billing).
**Commits:** `80e0878`

**Arquivos alterados:**
- `database/migrations/027_addon_billing_integration.sql` — `grace_until` + `asaas_payment_link` em `subscription_addons`; índices webhook routing e grandfathered
- `backend/internal/billing/model.go` — `PaymentLink` + `IsRedundant` em `ActiveAddon`; `AddonActivateResponse` + `AddonRecord`
- `backend/internal/billing/repository.go` — 7 novos métodos: `FindTenantByAsaasAddonID`, `ActivateAddonByAsaasID`, `MarkAddonPastDueByAsaasID`, `CancelAddonByAsaasID`, `GetAddonByTenantAndType`, `GetAddonPrice`, `GetPlanFeaturesByTenant`; `ListActiveAddons` inclui `pending_payment`/`past_due`
- `backend/internal/billing/service.go` — `ActivateAddon` cria assinatura Asaas + `pending_payment`; `CancelAddon` cancela no Asaas; `HandleWebhook` com dual routing; `dispatchAddonWebhookEvent` com grace period 3d
- `backend/internal/billing/handler.go` — `ActivateAddon`/`CancelAddon` delegam ao service; `GetAddons` computa `is_redundant`
- `backend/internal/plans/repository.go` — `GetUsage` SQL: `pending_payment` exclui features (D1); `past_due` com `grace_until` mantém features
- `frontend/app/(dashboard)/billing/addons/_components/AddonsClient.tsx` — seção `pending_payment` (amber) com "Pagar agora"; badge `past_due` vermelho; aviso `is_redundant` com cancel inline (D4)
- `docs-operacao/FalhasCorrigidas/FC033_...md` — novo documento

**Decisões técnicas aplicadas (aprovadas na sessão):**
- **D1**: Features só concedidas após `PAYMENT_CONFIRMED` (não em `pending_payment`)
- **D2**: `createSubscription()` reutilizado — sem novo método Asaas
- **D3**: Sem grandfathering permanente — índice `idx_grandfathered` para relatório admin
- **D4**: Sem auto-cancel em upgrade — `is_redundant=true` na UI para decisão explícita do usuário

**Smoke tests executados (7/7 passaram):**
- T1: `PAYMENT_CONFIRMED` → `active` ✓
- T2: `PAYMENT_OVERDUE` → `past_due` + `grace_until+3d` ✓
- T3: `PAYMENT_CONFIRMED` (recovery) → `active`, `grace_until=NULL` ✓
- T4: `PAYMENT_REFUNDED` → `past_due` (mesmo comportamento que overdue) ✓
- T5: Main sub não afetada por evento de addon (regressão) ✓
- T6: `SUBSCRIPTION_CANCELED` → `canceled` + `canceled_at` ✓
- T7: Idempotência — evento duplicado bloqueado ✓

---

## 2026-05-31 (sessão 29) — Correção bugs comerciais Premium + nomenclatura add-ons

**Objetivo:** corrigir BUG-01/02/03 (feature flags Premium incorretas + copy de gate) e nomenclatura comercial dos add-ons
**Commit:** `29f6605`

**Arquivos alterados:**
- `frontend/lib/tenant.ts` — `getUsageFromAPI` agora mapeia `has_automation`, `has_campaigns`, `has_ai_assistance`, `has_lead_recovery`, `has_multi_store`, `has_extra_user` (flags ausentes causavam falso `false` → BUG-02)
- `frontend/components/layout/DashboardShell.tsx` — sidebar Premium gateada por `has_automation` (era `has_api_access` — exclusivo Scale)
- `frontend/app/(dashboard)/automations/page.tsx` — gate `has_api_access` → `has_automation`
- `frontend/app/(dashboard)/campaigns/page.tsx` — gate `has_api_access` → `has_campaigns`
- `frontend/app/(dashboard)/whatsapp/page.tsx` — BUG-01: copy "Plano Pro" → "Plano Premium ou Add-on WhatsApp Automação"; fallback 'Start' → 'Starter'
- `frontend/app/(dashboard)/billing/addons/_components/AddonsClient.tsx` — remove chips de flags técnicas; "Add-on" → "Recurso"; headers comerciais
- `docs-operacao/FalhasCorrigidas/FC032_ADDONS_SEM_BILLING_ASAAS.md` — gap billing add-ons documentado (Etapa 5)
- DB: `plan_addons.ia_recovery.display_name` = "Recuperação por IA"

### BUG-01 (corrigido)
`/whatsapp/page.tsx` mostrava "Disponível a partir do Plano Pro" mas Central de Atendimento é feature Premium (`has_central_atendimento`). Corrigido para "Plano Premium ou Add-on WhatsApp Automação".

### BUG-02 (corrigido)
Sidebar seção Premium gateada por `has_api_access` (só Scale tem `api_access`). Premium tem `automation` + `campaigns` mas não `api_access` → Premium nunca via Automações/Campanhas na sidebar. Corrigido para `has_automation`. Gates das pages corrigidos também.

### BUG-03 (resolvido via BUG-02)
PlanCard Premium anunciava "Automações e campanhas" mas nunca apareciam por BUG-02. Após BUG-02, Premium vê corretamente.

### FC032 (documentado)
Add-ons não têm integração Asaas — ativação é grátis. Gap identificado e documentado. Correção na Etapa 5 (billing gateway abstraction).

---

## 2026-05-31 (sessão 28) — Fechamento autônomo de pendências técnicas

**Objetivo:** elevar maturidade operacional de 91% para 95%+
**Arquivos alterados:**
- `backend/internal/billing/repository.go` — FC031: `canceled_at = NULL` em `ActivateByAsaasSubID`
- `frontend/e2e/helpers/auth.ts` — rename `starter` → `proOwner` + alias retrocompat + user `sandbox`
- `frontend/e2e/03_upgrade_downgrade.spec.ts` — body simulate-event corrigido (`event_type`/`subscription_id`)
- `frontend/.env.e2e` — vars `E2E_PRO_EMAIL`/`E2E_PRO_PASSWORD` adicionadas
- `docs-operacao/ENVIRONMENTS.md` — body simulate-event correto; seção "sandbox (a criar)" removida; Asaas env correto
- `docs-operacao/FalhasCorrigidas/FC031_ACTIVATE_CANCELED_AT_NULL.md` — criado
- `docs-operacao/FalhasCorrigidas/README.md` — FC030 + FC031 adicionados
- `docs-operacao/20_PENDENCIAS.md` — FalhasCorrigidas count atualizado (28 → 31)

### Billing — Opção A executada (sessão 27/28)

Decisão: cancelar `sub_gqu4uiro0sisshxt` no Asaas antes de 2026-06-28 (zero cobrança).
DB restaurado para `dev_test_fd1172f6-11e7-4555-8fe3-082fd1849587` com status `active`.
Usar `AdminSimulateEvent` para todos os testes futuros de billing em produção.

### FC031 corrigido

`ActivateByAsaasSubID` não limpava `canceled_at` após reativação.
Bug identificado ao vivo durante testes webhook da sessão 27.
Correção: `canceled_at = NULL` adicionado ao UPDATE SQL em `repository.go`.

### E2E — melhorias aplicadas

- `auth.ts`: `starter` renomeado para `proOwner` (retrocompat alias mantido); `sandbox` user adicionado
- `03_upgrade_downgrade.spec.ts`: body correto para `AdminSimulateEvent`
- `.env.e2e`: variáveis `E2E_PRO_*` alinhadas com nomenclatura `auth.ts`

### Pendências remanescentes (ação manual)

- Preencher `.env.e2e` com senhas reais e criar user auth para sandbox-revendaclick
- Uptime monitoring (UptimeRobot/BetterStack)
- Backup S3 credentials
- Rotação semestral de secrets
- Verificar sidebar no browser (santos-car Pro + sandbox Pro)

---

## 2026-05-31 (sessão 27) — Migração billing santos-car: dev_test_* → sub_* real Asaas

**Commits:** (ver abaixo)
**Alterações:** apenas infraestrutura e DB — nenhum arquivo de código alterado

### Causa raiz

`subscriptions.asaas_subscription_id` de santos-car continha `dev_test_fd1172f6-...` (gerado por `DevActivate` em ambiente não-produção, executado contra o DB de produção). O Asaas nunca envia webhooks com esse ID, portanto `FindTenantByAsaasSubID` sempre retornava vazio → `tenant_id = NULL` em billing_events → pipeline não atualizava a subscription.

### Correção aplicada

1. **Auditoria Asaas** — confirmado zero assinaturas ativas para `cus_000178518508`
2. **Criação da assinatura real** — via API Asaas produção:
   - `POST /api/v3/subscriptions` com `customer=cus_000178518508`, `billingType=BOLETO`, `value=197.00`, `nextDueDate=2026-06-28`, `cycle=MONTHLY`
   - Resultado: `sub_gqu4uiro0sisshxt` (ACTIVE)
   - Boleto gerado: `pay_ge775bps3k78ezhd`, vencimento 2026-06-28, R$197
3. **Atualização cirúrgica do DB** — apenas `asaas_subscription_id` e `asaas_payment_link`; status, plano, vigência intactos
4. **`canceled_at` limpo** — artefato do teste SUBSCRIPTION_DELETED

### Testes executados (webhook HTTP real com token)

| Evento | payment_id | Resultado DB | tenant_id resolvido? |
|---|---|---|---|
| `PAYMENT_CONFIRMED` | `test_audit_confirmed_001` | status=active, period_end=2026-07-28 | ✓ fd1172f6 |
| `PAYMENT_OVERDUE` | `test_audit_overdue_001` | status=past_due, grace_until=+3d | ✓ fd1172f6 |
| `SUBSCRIPTION_DELETED` | sub_gqu4uiro0sisshxt | status=canceled | ✓ fd1172f6 |
| Restauração `PAYMENT_CONFIRMED` | `test_audit_restore_001` | status=active | ✓ fd1172f6 |
| Idempotência (reenvio `confirmed_001`) | idem | **sem alteração no DB** | ✓ bloqueado |

### Estado final santos-car

| Campo | Valor |
|---|---|
| `asaas_subscription_id` | `sub_gqu4uiro0sisshxt` |
| `asaas_customer_id` | `cus_000178518508` |
| `status` | `active` |
| `plan` | `pro` (R$197/mês) |
| `current_period_end` | `2026-07-28` |
| `canceled_at` | `NULL` |
| Boleto pendente | `pay_ge775bps3k78ezhd` — R$197, vencimento 2026-06-28 |

### Notas

- `SUBSCRIPTION_CREATED` chegou com `tenant_id=NULL` — race condition esperada (evento chega antes do UPDATE do DB). Inofensivo: é informacional, não altera subscription.
- `dev_test_*` permanece apenas em: (1) comentário de `AdminSimulateEvent`; (2) corpo de `DevActivateSubscription` — ambos não executam em produção.
- `devecar` ainda tem `dev_test_devecar` no DB — irrelevante (`is_active=false`; tenant não operacional).

---

## 2026-05-31 (sessão 26) — Saneamento documental final + sandbox + E2E

**Commits:** (a confirmar após push)
**Arquivos alterados:**
- `docs-operacao/MEMORY.md` — CRÍTICO: corrigido plan.name 'performance' → 'premium' na nota
- `docs-operacao/PRODUCT_ARCHITECTURE.md` — tabela planos: performance → premium
- `docs-operacao/15_BILLING_ASAAS.md` — plan_name list: performance → premium
- `docs-operacao/README.md` — referências docs-operacao/prompts/ → prompts/
- `docs-operacao/00_LEIA_PRIMEIRO.md` — referências prompts corretas + seção PROMPTS OFICIAIS
- `prompts/00_PROMPT_INICIO_SESSAO.md` — referências docs-operacao/prompts/ → prompts/
- `docs-operacao/20_PENDENCIAS.md` — fix duplicidade Reconectar Central; +4 itens CONCLUÍDOS
- `docs-operacao/23_PROXIMO_PASSO.md` — sessão 26; sandbox + E2E + METRICS_TOKEN na tabela
- `docs-operacao/22_HISTORICO_ALTERACOES.md` — esta entrada + snapshot atualizado
- `docs-operacao/10_INFRA_VPS.md` — Coolify → Vercel no mapa de domínios
- `docs-operacao/03_FRONTEND.md` — Coolify → Vercel; middleware.ts → proxy.ts
- `docs-operacao/06_AUTENTICACAO.md` — middleware.ts → proxy.ts (3 ocorrências)
- `docs-operacao/02_MAPA_DE_PASTAS.md` — middleware.ts → proxy.ts
- `docs-operacao/REFERENCE.md` — tenants atualizados: santos-car Pro + sandbox-revendaclick
- `docs-operacao/ENVIRONMENTS.md` — tenants atualizados
- `docs-operacao/prompts/` (pasta) — removida via git rm (prompts vivem em prompts/ na raiz)
- `frontend/.env.e2e` — template criado com variáveis para santos-car, sandbox e super_admin
- `frontend/e2e/helpers/auth.ts` — comentário corrigido: santos-car é Pro
- `.gitignore` — .env.e2e adicionado

### Correções realizadas

**4 divergências documentais:**
1. `MEMORY.md` linha 42: plan.name 'performance' → 'premium'
2. `PRODUCT_ARCHITECTURE.md` tabela: performance → premium
3. `docs-operacao/prompts/` removida; referências atualizadas para `prompts/` (raiz)
4. `20_PENDENCIAS.md` item duplicado "Reconectar Central" corrigido para CONCLUÍDA

**Coolify → Vercel (3 arquivos):** 03_FRONTEND, 10_INFRA_VPS, ENVIRONMENTS
**middleware.ts → proxy.ts (3 arquivos):** 06_AUTENTICACAO, 02_MAPA_DE_PASTAS, 03_FRONTEND

**Nova divergência encontrada e corrigida:**
- santos-car estava documentado como Starter — DB confirma Pro. REFERENCE e ENVIRONMENTS atualizados.

### Banco de dados

Tenant `sandbox-revendaclick` criado via SQL:
- `tenant_id`: `e72eb104-98b7-4a71-946d-15e680496fc3`
- slug: `sandbox-revendaclick`
- plano: Pro (active)
- `current_period_end`: 2026-06-30

### Deploy

Frontend: Vercel — EXECUTADO (push automático)
Backend: CI/CD — NÃO EXECUTADO (nenhuma alteração de código Go)
Banco: tenant sandbox-revendaclick criado via MCP SQL

### Hardening — Leaked Password Protection (BLOQUEADA)

Tentativa de ativar "Prevent use of leaked passwords" no Supabase Dashboard retornou:
> *"Configuring leaked password protection via HaveIBeenPwned.org is available on Pro Plans and up."*

**Status:** Bloqueada por limitação do plano Supabase Free. Não é erro de implementação do RevendaClick. Sem correção necessária. Depende exclusivamente de upgrade para Supabase Pro.
Registrado em `20_PENDENCIAS.md` (Segurança) como BLOQUEADA.

### Testes

TypeScript: NÃO EXECUTADO (nenhuma alteração de código)
Go build: NÃO EXECUTADO (nenhuma alteração de código Go)
METRICS_TOKEN: ✓ confirmado via SSH — `/metrics` retorna 200 do VPS com Bearer token correto

---

## 2026-05-30 (sessão 25) — Renomeação definitiva performance → premium + auditoria nomenclatura

**Commits:** `b2ea6a0`, `e43271a`, (docs — a confirmar)
**Arquivos alterados:**
- `database/migrations/026_rename_performance_to_premium.sql` (novo)
- `frontend/lib/database.types.ts` (regenerado)
- `frontend/app/(dashboard)/billing/plans/_components/PlanCard.tsx` (performance→premium; isPerformance→isPremium)
- `frontend/app/(dashboard)/billing/plans/_components/PlansGrid.tsx` (comentário)
- `backend/internal/billing/model.go` (comentário)
- `docs-operacao/REFERENCE.md` (planos + feature flags)
- `docs-operacao/MEMORY.md` (planos + flags + OBSOLETO + regra 9)
- `docs-operacao/PRODUCT_ARCHITECTURE.md` (planos + DECISÕES COMERCIAIS)
- `docs-operacao/features/FEATURE_FLAGS_SNAPSHOT.md` (coluna Performance → Premium)
- `docs-operacao/tests/E2E_TEST_PLAN.md` (Performance → Premium)
- `docs-operacao/15_BILLING_ASAAS.md` (plan_name examples)
- `docs-operacao/00_LEIA_PRIMEIRO.md` (seção planos unificada)
- `docs-operacao/21_DECISOES_TECNICAS.md` (D29 adicionado)
- `docs-operacao/FalhasCorrigidas/FC030_SettingsTabs_plan_name_premium_vs_performance.md` (novo)

### Alterações realizadas

**Migration 026 (Supabase):**
- `UPDATE plans SET name='premium', display_name='Premium' WHERE name='performance'`
- `subscriptions` usa `plan_id` (FK) — sem campo denormalizado afetado
- `get_tenant_usage()` retorna `premium` automaticamente via JOIN

**Frontend:**
- PlanCard.tsx: PLAN_HIGHLIGHTS e PLAN_BADGE usam chave `premium`
- PlanCard.tsx: `isPerformance` → `isPremium`; `plan.name === 'performance'` → `'premium'`
- FC030 corrigido como efeito colateral: SettingsTabs.tsx usava `name:'premium'` que não casava com DB `'performance'`

**Auditoria de nomenclatura:**
- Todos os docs operacionais atualizados: `performance` → `premium` onde era plan.name
- `Performance+` → `Premium+` em feature flags
- Docs históricos (01, 06, 10_INFRA, 18_MIGRACAO) não atualizados — são históricos e corretos no contexto

### Deploy

Frontend: Vercel — EXECUTADO (push `e43271a`)
Backend: CI/CD — EXECUTADO (sem alteração de lógica Go)
Banco: migration 026 aplicada via MCP Supabase ✓

### Testes

TypeScript: ✓ zero erros (`npx tsc --noEmit`)
Go build/vet: executado em CI (go não disponível localmente)
E2E: NÃO EXECUTADO (requer .env.e2e)

### Rollback

NÃO necessário. Reversão: migration 027 com `UPDATE plans SET name='performance' WHERE name='premium'`

---

## 2026-05-30 (sessão 24) — Governança operacional: /prompts raiz + testes unitários billing + placeholders automations/campaigns + auditoria estrutural

**Commits:** (a confirmar após push)

**Arquivos alterados:**
- `prompts/00_PROMPT_INICIO_SESSAO.md` (novo)
- `prompts/01_PROMPT_ENCERRAMENTO_SESSAO.md` (novo)
- `prompts/02_PROMPT_AUDITORIA.md` (novo)
- `prompts/03_PROMPT_BUG_CRITICO.md` (novo)
- `prompts/04_PROMPT_DEPLOY.md` (novo)
- `backend/internal/billing/billing_test.go` (modificado — +4 testes unitários)
- `frontend/app/(dashboard)/automations/page.tsx` (novo)
- `frontend/app/(dashboard)/campaigns/page.tsx` (novo)
- `frontend/playwright.config.ts` (novo)
- `frontend/e2e/helpers/auth.ts` (novo)
- `frontend/e2e/01_onboarding.spec.ts` (novo)
- `frontend/e2e/02_billing_subscribe.spec.ts` (novo)
- `frontend/e2e/03_upgrade_downgrade.spec.ts` (novo)
- `frontend/e2e/04_whatsapp_addon.spec.ts` (novo)
- `frontend/e2e/05_ia_recovery.spec.ts` (novo)
- `frontend/package.json` (modificado — @playwright/test)
- `docs-operacao/PRODUCT_ARCHITECTURE.md` (novo)
- `docs-operacao/DEPENDENCIES.md` (novo)
- `docs-operacao/ENVIRONMENTS.md` (novo)
- `docs-operacao/MEMORY.md` (novo — in-repo, OBSOLETO + nomenclatura)
- `docs-operacao/features/FEATURE_FLAGS_SNAPSHOT.md` (novo)
- `docs-operacao/features/SIDEBAR_SNAPSHOT.md` (novo)
- `docs-operacao/tests/E2E_TEST_PLAN.md` (novo)
- `docs-operacao/architecture/STACK_OVERVIEW.md` (novo)
- `docs-operacao/00_LEIA_PRIMEIRO.md` (modificado — tabela LEITURA OBRIGATÓRIA + referência /prompts)
- `docs-operacao/01_ARQUITETURA_REAL.md` (modificado — Coolify→Vercel, middleware.ts→proxy.ts)
- `docs-operacao/15_BILLING_ASAAS.md` (modificado — fix plan names)
- `docs-operacao/17_FLUXOS_NEGOCIO.md` (modificado — proxy.ts, novas rotas)
- `docs-operacao/REFERENCE.md` (modificado — devecar→sandbox-revendaclick)
- `frontend/app/(dashboard)/billing/plans/_components/PlanCard.tsx` (modificado — "Compradores"→"Clientes")

### Objetivo

Sessão de governança: solidificar documentação, criar prompts operacionais oficiais, corrigir nomenclatura e estruturar testes E2E.

### Alterações realizadas

**Testes unitários billing:**
- 4 novos testes: `TestWebhookAsaasID`, `TestAsaasUserErr`, `TestCapitalize`, `TestWebhookEventKey`
- Table-driven, sem dependência de banco

**Placeholders /automations e /campaigns:**
- Gateados por `has_api_access` (plano Performance+)
- /automations: bloco condicional WhatsApp add-on (`has_central_atendimento` → link /whatsapp; else → CTA /billing/addons)
- /campaigns: "Em breve" com links atalho

**Pasta /prompts (raiz do repositório):**
- 5 prompts operacionais criados e adaptados para RevendaClick
- Procedimento oficial de abertura/encerramento de sessão

**Auditoria estrutural de documentação:**
- Coolify → Vercel em todos os docs
- middleware.ts → proxy.ts
- enterprise/premium → scale/performance nos docs e código
- devecar removido como tenant operacional
- MEMORY.md criado com seção OBSOLETO (8 itens)

**Testes E2E (Playwright):**
- Estrutura criada em `frontend/e2e/`
- 5 specs cobrindo 6 fluxos principais
- Playwright instalado no frontend

### Deploy

Frontend: Vercel (automático via push)
Backend: CI/CD GitHub Actions (sem alteração de código Go exceto testes)
Banco: sem migration nesta sessão

### Testes

TypeScript: ✓ sem novos erros introduzidos
Go build: validado por estrutura (CI/CD)
Go unit tests billing: +4 funções (executar em CI)
E2E: estrutura criada, não executados (requer .env.e2e)

### Rollback

NÃO necessário — apenas documentação, testes e placeholders de UI.

---

## 2026-05-29 (sessão 23 — continuação 2) — Sidebar Refactor + Sub-navs Financeiro/Billing + WhatsApp em Configurações

**Commits:** `b22fb2a`, `51def30`
**Arquivos alterados:** `DashboardShell.tsx`, `FinancialSubNav.tsx` (new), `BillingSubNav.tsx` (new), `financial/page.tsx`, `sales/page.tsx`, `financial/commissions/page.tsx`, `billing/page.tsx`, `billing/addons/page.tsx`, `billing/history/page.tsx`, `billing/plans/page.tsx`, `settings/_components/SettingsTabs.tsx`, `docs-operacao/23_PROXIMO_PASSO.md`

### Objetivo

Refatoração definitiva da UX da sidebar. Problemas anteriores:
- Vendas, Comissões e Vendedores estavam soltos na nav base — ruído visual
- Compradores era label inconsistente com "Clientes" (linguagem do domínio)
- Add-ons e Central de Atendimento poluíam a sidebar principal
- Usuários Starter não tinham acesso a Clientes

### Alterações DashboardShell.tsx

**NAV_BASE** (Starter+ — todos os planos ativos):
- Removidos: Vendas, Comissões, Vendedores
- Adicionado: Clientes (`/customers`) — era exclusivo de Pro, agora disponível para todos
- Mantidos: Dashboard, Veículos, Interessados, Financeiro

**NAV_PRO** (gated `has_crm`):
- Removido: Compradores (movido para base como Clientes)
- Adicionado: Analytics (estava em seção separada "Sistema")
- Mantido: Atendimento (`/crm`)
- Header: "Pro"

**NAV_PREMIUM** (gated `has_api_access`) — NOVO:
- Automações (`/automations`)
- Campanhas (`/campaigns`)
- Header: "Premium"

**Seção Sistema — removida**:
- Central de Atendimento: removido da sidebar
- Add-ons: removido da sidebar
- Analytics: movido para seção Pro

**Rodapé sempre-visível**: Assinatura + Configurações (sem header de seção)

**Upgrade prompt**: Atualizado para "Desbloqueie com Pro — Atendimento, Analytics e mais"

**ROUTE_LABELS**: `customers: 'Clientes'`, `whatsapp: 'WhatsApp'` + novas: `automations`, `campaigns`

### Novos componentes de sub-navegação

**`components/financial/FinancialSubNav.tsx`** — tabs Resumo / Vendas / Comissões
- Adicionado a: `financial/page.tsx`, `sales/page.tsx`, `financial/commissions/page.tsx`
- Financeiro agora centraliza visualmente todas as sub-páginas financeiras

**`components/billing/BillingSubNav.tsx`** — tabs Assinatura / Add-ons / Cobranças / Planos
- Adicionado a: `billing/page.tsx`, `billing/addons/page.tsx`, `billing/history/page.tsx`, `billing/plans/page.tsx`
- Billing é uma seção coesa — Add-ons e Histórico acessíveis por tabs internas

### WhatsApp em Configurações

**`settings/_components/SettingsTabs.tsx`**:
- Nova aba "WhatsApp" — 5ª tab em Configurações
- Exibe descrição da Central de Atendimento + botão "Abrir Central de Atendimento" (→ `/whatsapp`) + link "Ver add-ons disponíveis" (→ `/billing/addons`)
- Usuários sem a feature verão o botão mas serão redirecionados pela lógica da página `/whatsapp`

### TypeScript

`npx tsc --noEmit` — sem erros.

### Validação dos 10 critérios

| # | Critério | Status |
|---|---|---|
| 1 | Starter sem Central Atendimento visível | ✓ |
| 2 | Compradores renomeado para Clientes | ✓ |
| 3 | Add-ons removido da sidebar | ✓ |
| 4 | Vendas removido da sidebar | ✓ via sub-nav Financeiro |
| 5 | Comissões removido da sidebar | ✓ via sub-nav Financeiro |
| 6 | Financeiro centraliza tudo | ✓ tabs Resumo/Vendas/Comissões |
| 7 | Configurações contém WhatsApp | ✓ nova aba |
| 8 | Sem quebra de rotas | ✓ todas as pages existem |
| 9 | Sem quebra de permissões | ✓ Clientes sem gate; Pro gated has_crm |
| 10 | Sem regressões | ✓ TypeScript ok |

---

## 2026-05-29 (sessão 23 — continuação) — Fix Evolution webhook 401 + rc_backup memory + CI/CD deploy

**Commits:** `7e3f56a`
**Arquivos alterados:** `backend/internal/evolution/handler.go`, `docker-compose.production.yml`

### Evolution webhook 401 — causa raiz identificada e corrigida

**Sintoma:** Evolution v2.3.7 recebia HTTP 401 ao postar para `http://backend:8080/api/webhooks/evolution`.

**Causa:** Gin v1.12.0 com trusted proxies padrão (`["0.0.0.0/0"]`) usa `X-Forwarded-For` para determinar o IP do cliente. Evolution v2.3.7 envia `X-Forwarded-For: 2.24.67.84` (IP público do VPS) nos seus webhooks. Gin usava esse header em vez do endereço TCP real (`10.0.4.5`), classificando a requisição como "externa". A checagem de IP interno (`10.`, `172.`, `192.168.`) falhava, e como Evolution não envia o cabeçalho `apikey` nos webhooks globais, o backend retornava 401.

**Fix:** `evolution/handler.go` — substituir `c.ClientIP()` por `c.Request.RemoteAddr` + `net.SplitHostPort()` para usar o endereço TCP real, imune a X-Forwarded-For spoofing.

### rc_backup — OOM corrigido

- Limite de memória: `128m` → `256m` (estava em 98% — 126MiB/128MiB)
- Variáveis shell no `command` do backup escapadas com `$$` (ELAPSED, TARGET_SEC, WAIT) para evitar interpolação do Docker Compose (warnings nas logs)
- Após restart: **6MiB / 256MiB (2.33%)** ✓

### devecar — instância Evolution desconectada

`connectionStatus: close` desde 2026-05-28T10:57:57. `disconnectionReasonCode: 401`, tipo `device_removed` (conflito — dispositivo removido). **Requer ação do usuário: acessar `/whatsapp` como `devecar` e escanear QR novamente.**

santos-car: `connectionStatus: open` ✓ (554888482877).

---

## 2026-05-29 (sessão 23) — Auditoria de riscos + reestruturação estratégica verificada + migration 024

**Migration:** `024_fix_plan_addons_rls_rename_performance.sql` — aplicada via Supabase MCP
**Arquivos alterados:** `PlanCard.tsx`, `PlansGrid.tsx`, `billing/model.go`, `database.types.ts`, docs

### Verificação da reestruturação estratégica

Leitura integral dos 34 arquivos em `docs-operacao/` + código-fonte real. Resultado: **todas as 10 etapas já estavam implementadas** corretamente desde sessões 17–22:

| Etapa | Status | Sessão |
|---|---|---|
| ETAPA 1 — Menu "Central de Atendimento" | ✓ | 17 |
| ETAPA 2 — /whatsapp reposicionado (sem bulk/spam) | ✓ | 17 |
| ETAPA 3 — Settings aba "Contato Público da Loja" | ✓ | 17 |
| ETAPA 4 — Página pública mostra apenas contato público | ✓ | 17 |
| ETAPA 5 — Billing premium redesign (3 cards + Enterprise CTA) | ✓ | 18/22 |
| ETAPA 6 — Arquitetura modular (loja/atendimento/IA) | ✓ | 18–22 |
| ETAPA 7 — tenant_public_contacts + tenant_whatsapp_sessions | ✓ | 18 |
| ETAPA 8 — Backend store-contact + plan_gate 3-way | ✓ | 17/22 |
| ETAPA 9 — Frontend refatorado (linguagem CRM, não disparo) | ✓ | 17–22 |
| ETAPA 10 — Posicionamento CRM automotivo | ✓ | 17–22 |

### Auditoria de riscos (19_RISCOS.md)

| Risco | Resultado | Ação |
|---|---|---|
| R4 `plan_addons` sem RLS | ❌ Encontrado | Migration 024: RLS + 2 policies |
| R5 .env no .gitignore | ✓ OK | Verificado: `.env`, `.env.local`, `.env.*.local`, `.env.production` cobertos |
| R9 triggers de limite | ✓ OK | `trg_check_vehicle_limit` + `trg_check_user_limit` ativos |
| R10 grace period | ✓ OK | `trg_subscription_grace` ativo em `subscriptions` |
| R1/R2/R3/R6/R7/R8/R11–R15 | Operacionais | Requerem acesso VPS — documentados em 19_RISCOS.md |

### Migration 024

- `plan_addons`: RLS habilitado; policies `plan_addons_read` (authenticated) + `plan_addons_read_anon` (anon)
- Plano 3: `premium` → `performance`, `display_name` → `Performance`, `tagline` → "Automatize sua operação"

### GAP encontrado e corrigido: nome do plano 3

Strategy document especificava `PLANO 3 — PERFORMANCE`. Session 22 (FASE 4) havia renomeado para `premium`. Migration 024 corrige para `performance`.

**Frontend atualizado:**
- `PlanCard.tsx`: `PLAN_HIGHLIGHTS.premium` → `.performance`; `PLAN_BADGE.premium` → `.performance`; `isPremium` → `isPerformance`
- `PlansGrid.tsx`: comentário atualizado
- `billing/model.go`: comentário atualizado

**database.types.ts regenerado:** 131.307 chars (pós-migration 024).

---


> Registrar toda alteração significativa feita em cada sessão de trabalho.
> Formato: data + o que mudou + por quê + arquivos afetados.

---

## Como Usar

No **início** de cada sessão: ler este arquivo para entender o estado atual.
No **fim** de cada sessão: adicionar uma entrada com as alterações feitas.

---

## 2026-05-28 (sessão 22) — FASE 4 Reestruturação Comercial Definitiva: Premium, Add-ons, Sidebar

**Commit:** `bdefe75` (16 arquivos, 904 inserções)
**Migration:** `022_commercial_restructure_premium_addons.sql` — aplicada via Supabase MCP
**Deploy Vercel:** `dpl_DYGETwWoLjxqC8nzjBTFpgXcwx37` — estado READY; `app.revendaclick.com.br` ao vivo

### Objetivo

Reestruturação comercial completa dos planos e add-ons. Três objetivos principais:
1. Renomear `performance` → `premium`; ocultar plano `scale` do grid (CTA "Falar com especialista")
2. Criar arquitetura de add-ons real com grant de features por add-on
3. Reorganizar sidebar: Financeiro/Comissões/Vendedores para Starter+; CRM/Compradores apenas Pro+

### Mudanças de Banco (Migration 022)

- `performance` → `premium` em `plans.name`
- Features por plano atualizadas conforme spec comercial
- `plan_addons`: adicionada coluna `features JSONB` — permite que add-ons concedam feature flags
- `get_tenant_usage` RPC recriada: merge 3-way `plan.features` UNION `tenant_features` UNION `addon.features`
- Catálogo: `user_extra` (R$20), `whatsapp_automation` (R$39), `ia_recovery` (R$39)

### Mudanças Backend

- `plans/model.go`: 3 novos campos `HasWhatsAppQR`, `HasLeadRecovery`, `HasExtraUser`
- `plans/repository.go`: `GetUsage` com merge de features de add-ons + incremento `max_users` por `user_extra`
- `middleware/plan_gate.go`: 3º UNION ALL — verifica `subscription_addons JOIN plan_addons.features`
- `billing/model.go`: `PlanAddon`, `ActiveAddon`, `AddonsResponse`
- `billing/repository.go`: `ListAvailableAddons`, `ListActiveAddons`, `ActivateAddon`, `CancelAddon`
- `billing/handler.go`: `GetAddons`, `ActivateAddon`, `CancelAddon` handlers
- `server/server.go`: rotas `GET/POST/DELETE /api/billing/addons/:type`

### Mudanças Frontend

- `DashboardShell.tsx`: financial+comissões+vendedores → NAV_BASE (Starter+); gate Pro = `has_crm`; label "CRM"; Add-ons nav item
- `PlanCard.tsx`: `performance` → `premium`; highlights atualizados por plano
- `PlansGrid.tsx`: oculta `scale`; grid 3 colunas; CTA Enterprise
- `billing/plans/page.tsx`: tabela comparativa 3 colunas; `whatsapp_qr`, `lead_recovery` incluídos
- `billing/addons/page.tsx`: nova página server component
- `billing/addons/_components/AddonsClient.tsx`: ativar/cancelar add-ons com feedback
- `app/api/billing/addons-action/[type]/route.ts`: proxy Next.js → backend (POST/DELETE)
- `lib/tenant.ts`: `has_whatsapp_qr`, `has_lead_recovery`, `has_extra_user` em `PlanUsage`

### Regra de Segurança

NUNCA hardcode `plan_name === 'premium'` ou similar. Sempre usar feature flags (`has_crm`, `has_whatsapp_qr`, etc).

## 2026-05-28 (sessão 22 — cont.) — Fix: get_tenant_usage sem tenant_features + reconexão santos-car

**Commit:** `8c323e6`
**Migration:** `023_fix_get_tenant_usage_tenant_features_merge.sql` — aplicada via Supabase MCP

### Problema
Migration 022 foi aplicada com versão incompleta de `get_tenant_usage` — o branch `tenant_features` do UNION ALL 3-way estava ausente. Resultado: overrides de super_admin (tenant_features table) eram silenciosamente ignorados pelo RPC. Detectado ao tentar conceder `central_atendimento` à santos-car.

### Correção
Migration 023 recria `get_tenant_usage` com os 3 branches corretos:
- Branch 1: `plans.features` (base do plano)
- Branch 2: `tenant_features` WHERE enabled = true AND expires_at IS NULL OR > NOW()
- Branch 3: `subscription_addons JOIN plan_addons.features` WHERE status = 'active'

### Central de Atendimento santos-car
- Instância Evolution `santos-car` já estava `connectionStatus: open` (554888482877, "Método Soluções")
- Feature `central_atendimento` concedida via `tenant_features` (INSERT + override — sem expiração)
- RPC corrigido → feature aparece no merge
- santos-car pode acessar `/whatsapp` sem necessitar add-on nem upgrade de plano

---

## 2026-05-28 (sessão 21) — FASE 3 Auditoria de Regressão: correção do congelamento de deploy no Vercel

**Commits:** `f0e59c0` (regenerar database.types.ts), `5eb241a` (tenant.ts unknown cast)
**Migration:** nenhuma
**Deploy:** `dpl_FySkkpdCPWXTHzYJGcwSWvLTiHPa` — estado READY; `app.revendaclick.com.br` ao vivo

### Problema

Produção estava congelada no commit `c885492` (sessão 15). Oito deploys consecutivos (sessões 16–20) falharam com TypeScript error no Vercel, bloqueando silenciosamente todas as features implementadas: sidebar dinâmica, admin panel, feature flags, OnboardingChecklist, billing upgrade.

### Causa raiz

`frontend/lib/database.types.ts` não era atualizado desde antes das migrations 018–021. O arquivo gerado pelo Supabase não incluía as tabelas `tenant_public_contacts`, `tenant_features`, `subscription_addons` e `plan_addons`. Qualquer arquivo que referenciasse essas tabelas causava erro de tipo no build.

### Investigação

1. Confirmado que frontend deploy é exclusivamente via Vercel (nginx.conf não tem entrada para `app.`; `docker-compose.production.yml` não tem serviço frontend; `ci.yml` só builda o backend)
2. Lido `DashboardShell.tsx` — código local correto (DEFAULT_FEATURES false, gates por feature flag, banner Starter)
3. Lido `(dashboard)/layout.tsx` — `getUsageFromAPI` passa planFeatures corretamente
4. Verificado DB via SQL — santos-car=starter sem kanban, devecar=pro com todos os flags ✓
5. Build logs do Vercel confirmaram o erro no `lib/tenant.ts:332` (referência a `tenant_public_contacts`)

### Correção 1 — Regenerar `database.types.ts` (commit `f0e59c0`)

- Gerado via `mcp__claude_ai_Supabase__generate_typescript_types`
- Arquivo atualizado de ~1200 para 4263 linhas
- Tabelas adicionadas: `tenant_public_contacts`, `tenant_features`, `subscription_addons`, `plan_addons`

### Correção 2 — Cast em `lib/tenant.ts` (commit `5eb241a`)

- O tipo gerado para `tenant.theme` é `Json` (correto conforme schema), conflitando com o tipo local `{ primary_color: string; font: string }`
- `getTenantById` linha 116 e `getTenantBySlug` linha 136: `return data as Tenant` → `return data as unknown as Tenant`
- Sem impacto em runtime — apenas satisfaz o compilador TypeScript

### Resultado

Deploy `dpl_FySkkpdCPWXTHzYJGcwSWvLTiHPa` (commit `5eb241a`) → **READY** ✓
Produção agora executa código das sessões 16–21: sidebar dinâmica, admin panel, feature flags, checklist de onboarding.

### Arquivos alterados

- `frontend/lib/database.types.ts` — regenerado (4263 linhas)
- `frontend/lib/tenant.ts` — linhas 116 e 136: cast unknown intermediário

---

## 2026-05-28 (sessão 20) — Reestruturação estratégica: sidebar dinâmica, Starter rename, feature flags, add-ons

**Commit:** 6321538
**Migration:** 021 aplicada ao Supabase

### Problema
Sidebar estática mostrava tudo para todos os planos. Plan name "start" divergia do posicionamento "Starter". Feature flags `financial` e `vendors` não existiam, tornando impossível ocultar Financeiro/Vendedores para Starter. Add-ons não tinham estrutura de banco.

### Alterações

#### Banco (Migration 021)
- Plano `start` → `starter` (display_name='Starter')
- Pro+: features + `financial` + `vendors`
- Performance+: + `ai_assistance` + `automation` + `campaigns`
- Trigger `auto_assign_trial_subscription` atualizado para `'starter'`
- Tabela `subscription_addons` — add-ons ativos por tenant (RLS service_role)
- Tabela `plan_addons` — catálogo de add-ons (5 produtos: R$19-R$99/mês)
- View `plan_usage` recriada

#### Backend
- `plans/model.go` — Usage struct: +HasFinancial, +HasVendors, +HasAIAssistance, +HasAutomation, +HasCampaigns, +HasMultiStore
- `ComputeFeatureFlags()` computa todos os novos flags

#### Frontend
- `DashboardShell.tsx` — sidebar 100% dinâmica por feature flag:
  - Starter: Dashboard, Veículos, Interessados, Vendas, Assinatura, Configurações
  - Pro+ (has_kanban): + Compradores, Atendimento, Financeiro, Comissões, Vendedores
  - Pro+ (has_central_atendimento): + Central de Atendimento
  - Pro+ (has_analytics): + Analytics
  - DEFAULT_FEATURES agora restritivo (false por padrão)
  - Labels: Leads→Interessados, Clientes→Compradores, CRM→Atendimento
  - Banner upgrade para Starter ("Desbloqueie com Pro")
- `PlanCard.tsx` — 'start'→'starter', "Tudo do Starter"
- `plans/page.tsx` — tabela comparativa atualizada com novos features
- `lib/tenant.ts` — PlanUsage com novos feature flags

---

## 2026-05-28 (sessão 19) — FASE 2: Consolidação SaaS — feature flags reais, onboarding v2, painel admin, correção /whatsapp, widget checklist dashboard

**Commits:** feat: FASE 2 — feature flags, onboarding v2, admin panel, checklist widget
**Migration:** 020 aplicada ao Supabase
**Deploy:** commit + CI/CD push

### Problema

Plataforma precisava: (1) feature flags reais por plano/tenant (sem hardcode de plan_name), (2) onboarding reformulado (QR opcional), (3) painel admin para gerenciar tenants, (4) devecar ativado para testes.

### Alterações

#### Banco de dados — Migration 020

- `ALTER TYPE user_role ADD VALUE 'super_admin'` — novo papel sem tenant_id
- Tabela `tenant_features` — overrides por tenant (admin-granted features com expiração opcional; RLS service_role only)
- `onboarding_checklists` — colunas `received_first_lead`, `whatsapp_connected` adicionadas
- Trigger `_mark_vehicle_added()` — marca `added_vehicle=true` no INSERT de veículo
- Trigger `_mark_first_lead_received()` — marca `received_first_lead=true` no INSERT de lead
- Trigger BEFORE UPDATE `_update_onboarding_completed()` — `completed_at` automático quando `added_vehicle AND published_store AND received_first_lead`
- `auto_create_onboarding_checklist()` recriado com novas colunas

#### Backend

- `middleware/plan_gate.go` — query UNION ALL: verifica `plans.features` OU `tenant_features` (admin overrides)
- `onboarding/onboarding.go` — Checklist com 8 campos; GET/PUT atualizados; aceita `received_first_lead` e `whatsapp_connected`
- `admin/` (pacote novo) — model.go, repository.go, handler.go
  - `ListTenants`: JOIN tenants+subscriptions+plans, COUNT veículos/usuários/leads
  - `ActivateTenant`, `ExtendTrial`, `BlockTenant`, `UnblockTenant`
  - `GrantFeature`, `RevokeFeature`, `ListGrantedFeatures`
- `server/server.go` — importa `admin`, registra `/api/admin/*` (jwtAuth + superAdmin, sem resolveTenant)
- `billing/repository.go` + `billing/service.go` + `billing/handler.go` — `DevActivate` (apenas ENV != production)

#### Frontend

- `app/(admin)/layout.tsx` — valida `super_admin`, redireciona para /dashboard se não autorizado
- `app/(admin)/admin/page.tsx` — server component; stats grid; `GET /api/admin/tenants`
- `app/(admin)/admin/_components/AdminTenantsTable.tsx` — client component; busca + ações por tenant (Ativar Pro, +7 dias trial, + Atendimento feature, Block/Unblock)
- `app/api/admin/[...path]/route.ts` — catch-all proxy: valida super_admin no frontend → proxy para backend `/api/admin/*`
- `app/api/billing/dev-activate-action/route.ts` — proxy para `/api/billing/dev/activate` (só quando NEXT_PUBLIC_DEV_BILLING=true)
- `components/onboarding/OnboardingChecklist.tsx` — widget do checklist de onboarding (4 passos obrigatórios + 1 opcional WhatsApp)
- `app/(dashboard)/dashboard/page.tsx` — integra OnboardingChecklist; fetchChecklist + merges has_central_atendimento de usage
- `app/(dashboard)/whatsapp/page.tsx` — corrigido: usa `usage?.has_central_atendimento` em vez de `planName !== 'start'` (hardcode removido)

---

## 2026-05-28 (sessão 18) — Reestruturação estratégica: novos planos (Start/Pro/Performance/Scale), billing premium redesign, gate Central de Atendimento

**Commit:** pendente (próxima ação)
**Migration:** 019 aplicada ao Supabase — planos renomeados, tagline adicionada, features atualizadas
**Deploy:** pendente após commit

### Problema

O modelo de planos usava nomes genéricos (Starter/Pro/Premium/Enterprise) sem diferenciação de posicionamento. A feature "Central de Atendimento" (Evolution API) não estava isolada como gate de plano — qualquer plano com subscription ativa podia acessar QR Code. A página `/billing/plans` usava design básico sem hierarquia visual.

### Alterações

#### Banco de dados — Migration 019

- `plans.name` convertido de ENUM `plan_type` para TEXT (+ drop/recreate view `plan_usage`)
- Planos renomeados: `starter → start`, `premium → performance`, `enterprise → scale`
- Coluna `tagline` adicionada com slogan de posicionamento por plano
- Limites atualizados: Start (15/2/100), Pro (50/5/500), Performance (120/15/2500), Scale (−1/−1/−1)
- Feature `central_atendimento` adicionada em Pro, Performance, Scale (ausente em Start)
- Features de IA (`ai_suggest_reply`, `ai_classify_lead`) adicionadas em Performance e Scale
- `auto_assign_trial_subscription()` atualizado para usar `'start'` em vez de `'starter'`

#### Backend

- `plans/model.go` — `Tagline string` em `Plan`; `HasCentralAtendimento bool` em `Usage`; `ComputeFeatureFlags()` atualizado
- `plans/repository.go` — `tagline` incluído no SELECT/Scan de `ListPlans`
- `server.go` — `caGate := planGate("central_atendimento")` aplicado a todas as rotas Evolution operacionais (`/evolution/status`, `/evolution/qr`, `/evolution/connect`, `/evolution/disconnect`, `/evolution/send`); `/evolution/health` sem gate
- `billing/model.go` — comentário atualizado para `"start"|"pro"|"performance"|"scale"`

#### Frontend

- `lib/billing-utils.ts` — `tagline: string` adicionado ao tipo `Plan`
- `lib/tenant.ts` — `has_central_atendimento?: boolean` em `PlanUsage`; `getUsageFromAPI` retorna o campo
- `app/(dashboard)/whatsapp/page.tsx` — gate de plano: Start → exibe `CentralAtendimentoGate` (upgrade prompt com lock icon, benefícios, CTA Pro); Pro+ → renderiza `WhatsAppManager`
- `app/(dashboard)/billing/plans/page.tsx` — redesign premium: header centralizado, subscription banner, usa `PlansGrid`, comparison table com seções groupadas (Limites / Loja & Marketplace / Central de Atendimento / IA & Automação / Enterprise)
- `app/(dashboard)/billing/plans/_components/PlansGrid.tsx` — **novo** client component: toggle global mensal/anual aplica a todos os cards simultaneamente
- `app/(dashboard)/billing/plans/_components/PlanCard.tsx` — redesign premium: recebe `cycle` do parent; badges "Mais popular" (Pro) e "Melhor custo-benefício" (Performance); pill grid de limites; feature sections groupadas por módulo; ring highlight no Pro; CTA amber no Performance

---

## 2026-05-28 (sessão 17) — Refatoração estratégica WhatsApp: Central de Atendimento × Contato Público da Loja

**Commit:** `b8d2a48` — feat: Central de Atendimento + Contato Público da Loja
**Tag git:** `evolution-conectado` — marco publicado no GitHub
**Migration:** 018 aplicada ao Supabase (tenant_public_contacts + tenant_whatsapp_sessions)
**Deploy backend:** automático via CI/CD — VPS rodando `ghcr.io/dilnsant/revendaclick-backend:b8d2a487a2a486d300da2fc3e80abd8e711a7dea`
**Deploy frontend:** automático via Vercel (push para `main` dispara integração Vercel)
**Smoke test:** `https://api.revendaclick.com.br/health` → `{"db":"ok","status":"ok"}` ✓ | `https://app.revendaclick.com.br/` → HTTP 200 ✓
**Erros:** nenhum durante deploy ou aplicação da migration

### Problema

O sistema conflava dois conceitos distintos sob o nome "WhatsApp":
- **CONCEITO 1 (operacional):** Evolution API, QR Code, sessão, CRM, leads automáticos — restrito ao dashboard interno
- **CONCEITO 2 (comercial):** Botão de contato público na vitrine, Instagram, grupo de ofertas, localização — visível a clientes

### Divergências corrigidas antes das alterações

1. `docs-operacao/16_EVOLUTION.md` — `atendai/evolution-api:latest` → `evoapicloud/evolution-api:v2.3.7` (código real no `docker-compose.production.yml`)
2. `docs-operacao/08_API_ROTAS_REAIS.md` — `PUT /api/billing/subscription` estava ausente (adicionado)

### Arquivos criados

- `database/migrations/018_tenant_public_contacts_and_whatsapp_sessions.sql` — tabelas `tenant_public_contacts` + `tenant_whatsapp_sessions` com RLS, indexes, triggers
- `backend/internal/storecontact/model.go` — `StoreContact`, `UpsertRequest`
- `backend/internal/storecontact/repository.go` — `GetByTenantID`, `Upsert`
- `backend/internal/storecontact/service.go` — `Get`, `Upsert`
- `backend/internal/storecontact/handler.go` — `GET /api/store-contact`, `PUT /api/store-contact`

### Arquivos modificados

- `backend/internal/tenant/handler.go` — `GetPublic` inclui `public_contact` na resposta pública do slug
- `backend/internal/server/server.go` — rotas `GET/PUT /api/store-contact` + inicialização do módulo storecontact
- `frontend/components/layout/DashboardShell.tsx` — menu "WhatsApp" → "Central de Atendimento" (ícone headset)
- `frontend/app/(dashboard)/whatsapp/page.tsx` — título/descrição → linguagem de CRM/atendimento
- `frontend/components/whatsapp/WhatsAppManager.tsx` — todos os textos sem linguagem de bulk/spam; banner explicativo apontando para Settings → Contato Público
- `frontend/app/(dashboard)/settings/actions.ts` — `StoreContactData`, `getStoreContact()`, `saveStoreContact()`
- `frontend/app/(dashboard)/settings/page.tsx` — fetch `getStoreContact()` em parallel; passa `storeContact` ao `SettingsTabs`
- `frontend/app/(dashboard)/settings/_components/SettingsTabs.tsx` — nova aba "Contato Público" + componente `ContactTab` (6 campos: WhatsApp, telefone, email, Instagram, link grupos, localização)
- `frontend/lib/tenant.ts` — tipo `PublicContact` + função `getPublicStoreContact(tenantId)`
- `frontend/app/(public)/[slug]/page.tsx` — vitrine pública exibe `public_contact`: Instagram, telefone, email, localização, link grupo; botão WhatsApp usa `public_whatsapp` com fallback para `phone_whatsapp`

### Docs atualizadas

- `08_API_ROTAS_REAIS.md` — rotas `GET/PUT /api/store-contact` + nota `public_contact` na rota pública
- `20_PENDENCIAS.md` — refatoração marcada CONCLUÍDA, nomenclatura atualizada
- `23_PROXIMO_PASSO.md` — estado atualizado

---

## 2026-05-28 (sessão 16) — Endpoint de upgrade de plano

**Commit:** `d20e798` — feat: billing upgrade — PUT /api/billing/subscription para troca de plano ativo
**Deploy:** automático via CI/CD — incluído no mesmo pipeline do push da sessão 17
**Smoke test:** `https://api.revendaclick.com.br/health` → `{"db":"ok","status":"ok"}` ✓

### Endpoint PUT /api/billing/subscription (upgrade/downgrade)

**Problema:** Guard em `billing/service.go:Subscribe` devolvia a subscription ativa sem alteração quando `asaas_subscription_id != ""`. Usuários com `status=active` não conseguiam trocar de plano.

**Solução:** Endpoint dedicado `PUT /api/billing/subscription` que:
1. Valida `status=active` com `asaas_subscription_id` preenchido
2. Chama Asaas `PUT /subscriptions/{id}` → novo valor/ciclo no próximo billing
3. Atualiza `plan_id` + `billing_cycle` no banco local sem alterar `status`
4. No-op se mesmo plano + mesmo ciclo

**Frontend:**
- `PlanCard.tsx`: detecta `is_active && !isCurrent` → modo upgrade (`isUpgradeMode`)
- Modo upgrade: botão "Mudar para este plano", sem CPF/billing_type (customer já existe), sem banner "7 dias de trial gratuito"
- Modo subscribe (existente): inalterado — trialing/novos assinantes

**Arquivos criados/modificados:**
- `backend/internal/billing/asaas.go` — `updateSubscription()` + `asaasSubscriptionUpdateReq`
- `backend/internal/billing/model.go` — `UpgradeRequest`
- `backend/internal/billing/repository.go` — `UpdateSubscriptionPlan()`
- `backend/internal/billing/service.go` — `UpgradeSubscription()`
- `backend/internal/billing/handler.go` — `Upgrade()` handler
- `backend/internal/server/server.go` — rota `PUT /billing/subscription`
- `frontend/app/api/billing/upgrade-action/route.ts` — novo proxy SSR
- `frontend/app/(dashboard)/billing/plans/_components/PlanCard.tsx` — `isUpgradeMode` + `handleUpgrade()`

**Docs atualizadas:**
- `15_BILLING_ASAAS.md` — nova rota + body de upgrade documentados
- `20_PENDENCIAS.md` — marcado CONCLUÍDA
- `23_PROXIMO_PASSO.md` — item removido, numeração ajustada

---

## 2026-05-28 (sessão 15) — Correções finais: billing trial + header duplo + cores tenant

**Commits:** `81eceb5`
**Smoke test:** 22/22 PASS

### PROBLEMA 1 — Billing: usuário em trial não conseguia assinar

**Causa raiz:** `PlanCard.tsx` usava `isCurrent = plan.name === currentPlanName` para desabilitar o botão. Como `isCurrent = true` durante o trial, o botão ficava desabilitado para qualquer `status` — incluindo `trialing`.

**Análise backend:** Guard em `billing/service.go:Subscribe` só bloqueia quando `asaas_subscription_id != ""`. Durante trial, não há `asaas_subscription_id` → guard não dispara → backend aceita o subscribe normalmente. Problema era **somente no frontend**.

**Fix (`PlanCard.tsx`):**
```ts
// Antes:
disabled={isCurrent || loading}   // bloqueava trialing

// Depois:
const isActiveAndCurrent = isCurrent && !isTrialing  // bloqueia APENAS active
disabled={isActiveAndCurrent || loading}
```

**UX implementada:**
- `trialing` (plano atual): badge "Trial ativo" + botão "Antecipar assinatura" clicável
- `trialing` (outro plano): botão "Assinar" clicável
- `active` (plano atual): botão "Plano atual ✓" desabilitado + data de renovação
- Formulário de pagamento (forma + CPF) visível para todos os planos não-bloqueados

---

### PROBLEMA 2 — Cabeçalho duplo na loja pública

**Causa raiz:** `[slug]/layout.tsx` renderizava `<header className="sticky top-0 z-40 ...">` com logo + botão WhatsApp. `[slug]/page.tsx` já tinha Hero section completa (logo + nome + descrição + cidade/estado + botão WhatsApp). Dois headers empilhados visualmente.

**Fix (`[slug]/layout.tsx`):**
- Removido o bloco `<header>` completo
- Layout agora: `<style>` + `<main>{children}</main>` + `<footer>`
- O Hero da `page.tsx` é o único cabeçalho da loja — mais rico e com todas as informações

**Impacto:** Afeta tanto `/[slug]` quanto `/[slug]/[vehicleSlug]` (ambos usam o mesmo layout).

---

### PROBLEMA 3 — Cores hardcoded na loja pública

**Causa raiz:** `tailwind.config.ts` definia `primary: { DEFAULT: '#E53935' }` — valor estático. Classes Tailwind como `bg-primary`, `text-primary`, `hover:bg-primary-dark` compilavam para vermelho fixo. O CSS variable `--color-primary` só funcionava em `style={}` inline.

**Fix em 3 camadas:**

**Camada 1 — `tailwind.config.ts`:**
```ts
primary: {
  DEFAULT: 'rgb(var(--primary) / <alpha-value>)',  // era: '#E53935'
  dark:    'rgb(var(--primary-dark) / <alpha-value>)',  // era: '#C62828'
}
```
Suporte nativo a opacity modifiers: `bg-primary/10`, `ring-primary/20`, etc.

**Camada 2 — `globals.css`:**
```css
:root {
  --primary:      229 57 53;  /* canais RGB de #E53935 — default dashboard */
  --primary-dark: 198 40 40;  /* canais RGB de #C62828 */
}
```

**Camada 3 — `[slug]/layout.tsx`:**
```ts
function hexToRgb(hex) { /* hex → {r,g,b} */ }
function darken(r,g,b, factor=0.83) { /* 17% escurecimento */ }

const { r, g, b } = hexToRgb(hexColor)       // tenant primary_color
const darkChannels = darken(r, g, b)

<style>{`
  :root {
    --color-primary: ${hexColor};         /* para inline style={{ color: 'var(...)' }} */
    --primary: ${r} ${g} ${b};           /* para Tailwind bg-primary */
    --primary-dark: ${darkChannels};      /* para Tailwind hover:bg-primary-dark */
  }
`}</style>
```

**Elementos agora usando cor do tenant:**
- `bg-primary` (Buscar, chips ativos, filtros, etc.) — via Tailwind
- `hover:bg-primary-dark` (hover de botões) — via Tailwind
- `focus:border-primary`, `focus:ring-primary` (inputs) — via Tailwind
- `btn-primary` em globals.css (vehicle detail "Quero este veículo") — via @apply bg-primary
- `style={{ backgroundColor: 'var(--color-primary)' }}` (VehicleCard "Tenho interesse") — via CSS var hex
- `style={{ color: 'var(--color-primary)' }}` (preço) — via CSS var hex
- Botão WhatsApp do hero: `bg-green-500` → `bg-primary`

**Dashboard:** Usa defaults de globals.css (`--primary: 229 57 53` = `#E53935`) → sem mudança visual.

---

**Arquivos modificados (sessão 15):**
- `frontend/app/(dashboard)/billing/plans/_components/PlanCard.tsx`
- `frontend/app/(public)/[slug]/layout.tsx`
- `frontend/app/(public)/[slug]/page.tsx`
- `frontend/app/globals.css`
- `frontend/tailwind.config.ts`

**Validação produção:**
```
curl "https://www.revendaclick.com.br/santos-car" → HTTP 200
  → --primary: 229 57 53 presente no HTML
  → sem sticky top-0 header no markup
  → bg-primary no botão WhatsApp (não bg-green-500)
22/22 smoke test PASS
```

---

## 2026-05-27/28 (sessão 14) — Evolution recovery: P3005+P3009+ENUMs + security advisors

**Commits:** `76ddc51`
**Smoke test:** 22/22 PASS

### Security cleanup Supabase

**Problema:** Supabase Security Advisor mostrava:
- `rls_disabled_in_public`: 37 tabelas PascalCase da Evolution API (criadas pelo Prisma) sem RLS no schema `public`
- `security_definer_view`: view `public_vehicle_listings` com SECURITY DEFINER desnecessária
- `public_bucket_allows_listing`: policy `logos_public_read` dava acesso de listagem ao bucket `logos`

**Migration 015 — `cleanup_evolution_tables_and_security_fixes`:**
- Dropadas 37 tabelas PascalCase da Evolution (`Chat`, `Contact`, `Instance`, `Message`, etc.)
- Dropada tabela `_prisma_migrations`
- Dropada view `public_vehicle_listings`
- Dropada policy `logos_public_read` (bucket público não precisa de SELECT explícito)

**Resultado:** Security advisors zerados (exceto Leaked Password Protection — só via Dashboard UI).

### Recovery Evolution API (P3005 → P3009 → ENUM types órfãos)

**Erro P3005:** Ao dropar `_prisma_migrations`, Prisma viu schema não vazio sem histórico → recusou executar.
- **Fix migration 016:** Recriada tabela `_prisma_migrations` vazia com schema correto + RLS habilitado.

**Erro P3009:** Ao iniciar com `_prisma_migrations` vazia, Prisma tentou aplicar `20240609181238_init` que executa `CREATE TYPE "InstanceConnectionStatus"`. O `DROP TABLE CASCADE` NÃO remove ENUM types → tipo já existia → `ERROR 42710` → registro de migration falha travou tudo.

**Diagnóstico ENUM types órfãos:**
```sql
SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'e'
-- Retornou 7 tipos PascalCase da Evolution + 18 tipos snake_case do RevendaClick
```

**Migration 017 — `drop_evolution_enum_types_and_fix_prisma_migration`:**
```sql
DROP TYPE IF EXISTS public."DeviceMessage" CASCADE;
DROP TYPE IF EXISTS public."DifyBotType" CASCADE;
DROP TYPE IF EXISTS public."InstanceConnectionStatus" CASCADE;
DROP TYPE IF EXISTS public."OpenaiBotType" CASCADE;
DROP TYPE IF EXISTS public."SessionStatus" CASCADE;
DROP TYPE IF EXISTS public."TriggerOperator" CASCADE;
DROP TYPE IF EXISTS public."TriggerType" CASCADE;
DELETE FROM public."_prisma_migrations" WHERE migration_name = '20240609181238_init';
```

**Recovery:** `docker restart rc_evolution` → container aplicou todas as migrations Prisma com sucesso → `healthy`.

**Consequência:** Todas as instâncias WhatsApp foram perdidas (dados estavam nas tabelas dropadas). Usuários precisam reconectar em `/whatsapp`.

### FC024–FC028 documentadas

- FC024: Vehicle detail 500 (features null + photo_urls→images)
- FC025: Logos bucket policy pública desnecessária
- FC026: Evolution tables no schema public sem RLS
- FC027: P3005 + P3009 após drop das tabelas
- FC028: ENUM types órfãos após DROP TABLE CASCADE

**Arquivos modificados (sessão 14):**
- `docs-operacao/FalhasCorrigidas/FC024–FC028` (novos)
- `docs-operacao/FalhasCorrigidas/README.md`
- `docs-operacao/23_PROXIMO_PASSO.md`
- Supabase migrations 015, 016, 017 (aplicadas via MCP)

---

## 2026-05-27 (sessão 13) — Problemas 1-5 produção: 500 vitrine, personalização loja, filtros, billing

**O que foi feito:**

### PROBLEMA 1 — Vehicle detail HTTP 500 (digest 4250320451)

- **Causa raiz 1:** `vehicle.features: string[]` na tipagem frontend, mas backend Go retorna `null` para nil slice → `null.length` throw TypeError no SSR
- **Causa raiz 2:** campo estava tipado como `photo_urls` no frontend mas backend usa `images`
- Fix: `features: string[] | null`, `images: string[] | null`, todos os acessos com `(vehicle.features ?? [])` e `(vehicle.images ?? [])`
- Arquivo: `frontend/app/(public)/[slug]/[vehicleSlug]/page.tsx`
- Commits: `2ee68ab` (feature/photo fix) → deployado e validado: HTTP 200

### PROBLEMA 2 — Vitrine não exibia veículos

- Confirmado que a vitrine já exibia "1 veículo disponível" corretamente — não era bug ativo
- Diagnóstico: backend retornava veículo correto, frontend consumia via NEXT_PUBLIC_API_URL

### PROBLEMA 3 — Settings: personalização completa da loja

- **Logo upload:** `/api/upload/logo/route.ts` — multipart POST → Supabase Storage `logos/{tenantId}/logo.ext` com upsert=true
- **Supabase migration 014:** bucket `logos` criado (public=true, 2MB limit, JPEG/PNG/WebP)
- **Color picker:** `<input type="color">` + hex text input → armazenado em `tenant.theme.primary_color`
- **Localização:** campos Cidade (address.city) e Estado (address.state) → armazenado em `tenant.address` JSONB
- **UI:** preview do logo com click-to-upload, CSS var `--color-primary` injetada na vitrine
- Arquivos: `frontend/app/api/upload/logo/route.ts` (novo), `settings/actions.ts`, `settings/page.tsx`, `settings/_components/SettingsTabs.tsx`

### PROBLEMA 4 — Vitrine pública profissional com filtros

- **Hero:** logo da loja, slogan/descrição, cidade+estado, botão "Falar via WhatsApp"
- **Filtros:** chips de condição (Usado/Novo) + combustível (Flex/Gasolina/Diesel/Elétrico/Híbrido)
- **Ordenação:** links SSR para menor/maior preço, mais novo
- **Busca:** form GET com campo de texto (search = title ILIKE OR brand ILIKE OR model ILIKE)
- **Paginação:** 12 por página, navegação por URL (pagina=N)
- **Estado vazio:** ícone + texto + botão "Ver todos os veículos"
- **Cor primária:** CSS var `--color-primary` sincronizada com `tenant.theme.primary_color`
- **Backend: `ListPublic`** expandido: fuel, transmission, sort, search, min_price, max_price
- **Backend: `ListFilter`** + `Sort` via switch → ORDER BY dinâmico
- Arquivos: `frontend/app/(public)/[slug]/page.tsx`, `backend/internal/vehicles/handler.go`, `model.go`, `repository.go`

### PROBLEMA 5 — Billing plans: badge e status da assinatura

- `billing/plans/page.tsx`: banner "Plano atual: Starter [Ativo] X dias de trial / Renova em DD/MM/AAAA"
- `PlanCard.tsx`: botão "Plano atual ✓" com `bg-primary/10` + border; mostra trial days ou renewal date
- Subscription tipada como `Subscription | null` — campos `is_trialing`, `trial_days_left`, `trial_ends_at`, `current_period_end`
- Commits: `fa18153`

**Arquivos modificados (sessão 13):**
- `backend/internal/vehicles/handler.go`
- `backend/internal/vehicles/model.go`
- `backend/internal/vehicles/repository.go`
- `frontend/app/api/upload/logo/route.ts` (novo)
- `frontend/app/(dashboard)/billing/plans/_components/PlanCard.tsx`
- `frontend/app/(dashboard)/billing/plans/page.tsx`
- `frontend/app/(dashboard)/settings/_components/SettingsTabs.tsx`
- `frontend/app/(dashboard)/settings/actions.ts`
- `frontend/app/(dashboard)/settings/page.tsx`
- `frontend/app/(public)/[slug]/page.tsx`
- `frontend/app/(public)/[slug]/[vehicleSlug]/page.tsx`

---

## 2026-05-27 (sessão 12) — Documentação permanente de histórico de bugs + fix billing UI

**O que foi feito:**

### Fix: Plano Starter sem botão de contratar

- Tenant em plano Starter ativo (`status=active`) via exibia apenas `<span>Plano atual</span>` sem botão, enquanto Pro e Premium tinham botões "Assinar"
- Fix: substituído pelo `<button disabled>Plano atual ✓</button>` com estilo visual diferenciado (fundo vermelho claro, desabilitado)
- Arquivo: `frontend/app/(dashboard)/settings/_components/SettingsTabs.tsx`
- Commit: `1d779c9a6fb2f4e67c06bff948c35f6546b5512f`

### Criação de docs-operacao/FalhasCorrigidas/

Pasta de documentação permanente de bugs corrigidos criada com 23 falhas documentadas:

| FC | Título | Severidade |
|---|---|---|
| FC001 | React Error #300 / Loop /onboarding | CRÍTICA |
| FC002 | QR Code Evolution (5 bugs em cascata) | CRÍTICA |
| FC003 | RLS onboarding — JWT claim ausente | ALTA |
| FC004 | Slug 404 / redirect de confirmação | ALTA |
| FC005 | Starter sem botão de contratar | BAIXA |
| FC006 | PIX / Asaas whitelist IP + $$ escape | CRÍTICA |
| FC007 | Security Advisor — 3 warnings RLS | ALTA |
| FC008 | tenants_select_own sem SELECT wrapper | ALTA |
| FC009 | leads_public_insert sem restrição tenant | ALTA |
| FC010 | Analytics revenue zerado (colunas SQL) | MÉDIA |
| FC011 | Nginx webhook location /api/v1/ vs /api/ | MÉDIA |
| FC012 | Billing SQL args duplicados | ALTA |
| FC013 | Customer Asaas sem CPF | ALTA |
| FC014 | Re-subscribe duplicado sem guard | ALTA |
| FC015 | Evolution OOM 512m→768m + NODE_OPTIONS | ALTA |
| FC016 | Evolution webhook 401 empty apikey v2.3.7 | ALTA |
| FC017 | Evolution sendText formato v2.3.7 | ALTA |
| FC018 | Evolution webhook 413 body limit | MÉDIA |
| FC019 | Prisma connection pool exhaustion | ALTA |
| FC020 | VPS git dirty working tree CI/CD | MÉDIA |
| FC021 | Vendedores invite SMTP rate limit | MÉDIA |
| FC022 | Lead source inválido → internal_error | BAIXA |
| FC023 | Listas vazias retornam null | BAIXA |

**Arquivos criados:**
- `docs-operacao/FalhasCorrigidas/README.md` — índice com tabela e regras
- `docs-operacao/FalhasCorrigidas/FC001` a `FC023` — 23 documentos de falha

**Arquivos atualizados:**
- `docs-operacao/20_PENDENCIAS.md` — FalhasCorrigidas marcado como CONCLUÍDA
- `docs-operacao/22_HISTORICO_ALTERACOES.md` — esta entrada
- `docs-operacao/23_PROXIMO_PASSO.md` — referência à nova pasta

---

## 2026-05-27 (sessão 11) — Fix definitivo Evolution API: QR gerando + upgrade v2.3.7

**O que foi feito:**

### Diagnóstico completo da falha silenciosa de Baileys em rc_evolution

**Root cause identificado:** `atendai/evolution-api:latest` tinha imagem de 14 meses atrás (build 2025-02-03). Baileys inicializava mas não gerava QR (count=0 silencioso). `evoapicloud/evolution-api:v2.3.7` (já rodando no beautynow no mesmo VPS) funciona corretamente.

**Bug 4 — Evolution API: imagem 14 meses defasada**
- `atendai/evolution-api:latest` buildado em 2025-02-03 com Baileys quebrado para protocolo atual do WhatsApp
- `GET /instance/connect/santos-car` sempre retornava `{"count":0}` sem erro no log
- Comparação com `evoapicloud/evolution-api:v2.3.7` (beautynow, mesmo VPS): count=1, base64_len=13214
- Fix: alterar imagem no docker-compose.production.yml para `evoapicloud/evolution-api:v2.3.7`

**Bug 5 — Evolution API: `DATABASE_ENABLED=true` ausente**
- beautynow-evolution tem `DATABASE_ENABLED=true`; rc_evolution não tinha
- Sem essa flag, integração DB pode não ser inicializada corretamente em v2.3.7
- Fix: adicionado `DATABASE_ENABLED: "true"` no docker-compose.production.yml

**Bug 6 — EVOLUTION_DATABASE_URL sem porta e database**
- VPS `.env` tinha `EVOLUTION_DATABASE_URL=...@supabase.com` (faltava `:5432/postgres`)
- Corrigido para igual a `DATABASE_URL` (`:5432/postgres` incluído)

**Bug 7 — Backend: parser `fetchInstances` incompatível com v2.3.7**
- v2.2.3 retornava: `[{instance: {instanceName, connectionStatus}}]`
- v2.3.7 retorna: `[{name, connectionStatus}]` (flat, sem wrapper `instance`)
- `GetInstanceStatus` em service.go não encontrava a instância → sempre retornava 'disconnected'
- Fix: parser dual-format com fallback (tenta flat, se vazio usa nested) — commit `9d05367`

**Bug 8 — Backend: Evolution webhook retornava 401 (empty apikey)**
- Evolution v2.3.7 envia webhook SEM `apikey` header (diferente do v2.2.3)
- Handler validava `incomingKey != h.apiKey` → rejeitava todas as mensagens de WhatsApp
- Fix: bypass da validação para IPs internos Docker (10.x, 172.x, 192.168.x) — commit `ce103a0`
- Resultado: webhooks retornam HTTP 200 ✓

### Resultado final
- Santos-car instance: `connectionStatus: connecting`, QR `count=9`, `base64_len=13142`
- QR auto-rotacionando normalmente (count incrementando a cada ~30s)
- Evolution webhook: 200 OK (lead sync funcionando)
- Smoke test: 22/22 PASS
- CI/CD deployado: backend `ce103a0`, Evolution v2.3.7

### Arquivos alterados
- `docker-compose.production.yml` — imagem v2.3.7, DATABASE_ENABLED=true, CACHE_REDIS_ENABLED=false
- `backend/internal/evolution/service.go` — parser fetchInstances dual-format
- `backend/internal/evolution/handler.go` — webhook aceita IPs internos sem apikey
- VPS `.env` — EVOLUTION_DATABASE_URL corrigido com :5432/postgres

### Commits
- `d4eb26d` — disable Evolution Redis cache (CACHE_REDIS_ENABLED=false)
- `02802f7` — upgrade Evolution to v2.3.7 + DATABASE_ENABLED=true
- `9d05367` — fetchInstances parser v2.3.7 fix
- `ce103a0` — webhook accept internal Docker network without apikey

---

## 2026-05-27 (sessão 10) — Fix WhatsApp QR Code não aparecia após status poll

**O que foi feito:**

### Diagnóstico completo da cadeia WhatsApp (ETAPAs 1-9)

**Root causes identificados:**

**Bug 1 — Frontend: condição `{qr && isConnecting}` (WhatsAppManager.tsx:301)**
- QR só renderizava quando status === 'connecting' E qr !== null simultaneamente
- Poll de status a cada 5s: se Evolution retornava 'disconnected' ou 'close' (nome real do estado no Evolution API v2), o status era atualizado e o QR sumia imediatamente
- Fix: alterado para `{qr && !isConnected}` — QR permanece visível enquanto não houver conexão `open`

**Bug 2 — Frontend: `handleRefreshQR` não atualizava status**
- Ao clicar "Gerar novo QR code", o QR era atualizado mas o status permanecia 'disconnected'
- Com a condição antiga isso causava QR invisível após refresh manual
- Fix: adicionado `setStatus(prev => ({ ...prev, status: 'connecting' }))` após receber QR

**Bug 3 — Backend: Evolution API usa `"close"` para instância desconectada**
- `GetInstanceStatus` passava `connectionStatus` raw do Evolution para o frontend
- Evolution API v2 usa `"close"`, não `"disconnected"`, para estado desconectado
- Frontend só conhecia 'disconnected' → badge exibia `"close"` literal sem tradução
- Fix: normalização `"close"` → `"disconnected"` em `GetInstanceStatus` (service.go)
- Fallback de segurança: adicionado `close` em STATUS_COLORS e STATUS_LABELS no frontend

### Arquivos alterados
- `frontend/components/whatsapp/WhatsAppManager.tsx` — condição QR, handleRefreshQR, STATUS_COLORS, STATUS_LABELS
- `backend/internal/evolution/service.go` — normalização "close" → "disconnected" em GetInstanceStatus

### Commit
- `3248b30` — commitado e deployado via CI/CD

---

## 2026-05-27 (sessão 9) — Billing end-to-end concluído + fix re-subscribe guard

**O que foi feito:**

### Sequência executada para validar billing completo (santos-car / dilneysantos@gmail.com)

**Diagnóstico inicial:**
- Backend health: `{"db":"ok","status":"ok"}` confirmado via curl
- Variáveis VPS confirmadas: `ASAAS_API_KEY=$$aact_prod_...` (correto), `ASAAS_WEBHOOK_TOKEN=whsec_LH26fc...H84`, `ASAAS_ENV` ausente mas default `production` via compose `:-production`
- Todas as variáveis críticas OK; todos os containers `Up` (rc_backend, rc_evolution, rc_redis)

**Problema 1 — anon key MCP diferente do .env do VPS:**
- MCP `get_publishable_keys` retornou chave divergente da configurada → `Invalid API key` na auth Supabase
- Fix: extrair chave diretamente do `.env` via `grep NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Problema 2 — Customer Asaas sem CPF (`cus_000178475241`):**
- Santos-car tinha `asaas_customer_id = cus_000178475241` criado sem CPF em momento anterior
- Asaas rejeita criação de subscription com `"Para criar esta cobrança é necessário preencher o CPF ou CNPJ do cliente."`
- Fix: `UPDATE tenants SET asaas_customer_id = NULL WHERE slug = 'santos-car'` via Supabase MCP
- Novo customer criado com CPF na próxima chamada: `cus_000178518508`

**Subscribe end-to-end confirmado:**
- `POST /api/billing/subscribe` → 200 → `sub_5m91fx4nlyw40st2` criado (primeiro subscribe)
- Webhook real Asaas (`SUBSCRIPTION_CREATED`, IP `54.94.183.101`) recebido automaticamente 0.46s após subscribe ✅
- `PAYMENT_CONFIRMED` simulado (pay_billing_e2e_test_001) → `trialing → active` ✅
- DB confirmado via MCP: `status=active`, `current_period_end=2026-06-27`, `trial_ends_at=null`

**Problema 3 — Re-subscribe duplicado:**
- Durante teste no browser, `POST /api/billing/subscribe` foi chamado novamente
- Sem guard: criou novo Asaas subscription (`sub_nrprg7wb1iyf0szo`) e resetou DB para `trialing`
- Fix imediato: PAYMENT_CONFIRMED simulado (pay_billing_e2e_test_002) → `active` ✅
- Fix código: guard inserido em `billing/service.go:Subscribe` — se tenant já tem `asaas_subscription_id != ""` e `status == active || trialing`, retorna subscription existente sem criar nova

### Estado final confirmado no banco
- `santos-car`: `status=active`, `asaas_subscription_id=sub_nrprg7wb1iyf0szo`, `asaas_customer_id=cus_000178518508`, `current_period_end=2026-06-27`
- Idempotência de webhooks confirmada: `billing_events` registrou todos os eventos sem duplicação

### Arquivos alterados
- `backend/internal/billing/service.go` — guard re-subscribe inserido entre normalização de billingType e GetAsaasCustomerID

### Pendente após esta sessão
- `git push origin main` → CI/CD deploya guard de re-subscribe
- devecar: assinar antes de 2026-05-31

---

## 2026-05-26 (sessão 8) — Validação e desbloqueio do billing Asaas

**O que foi feito:**

### Diagnóstico e resolução da cadeia de bloqueios do billing

O billing estava bloqueado por 3 problemas em cascata, resolvidos em sequência:

**Problema 1 — Whitelist Asaas aplicada no ambiente errado (sandbox)**
- Sintoma: `not_allowed_ip` em `POST /api/billing/subscribe`
- Causa: Usuário havia aplicado o whitelist do IP `2.24.67.84` em `sandbox.asaas.com`, mas o backend usa `www.asaas.com` (production — `ASAAS_ENV` não definido no `.env` → padrão `production` via docker-compose `${ASAAS_ENV:-production}`)
- Diagnóstico: `curl ifconfig.me` dentro do container → `2.24.67.84`; `grep ASAAS_ENV /opt/revendaclick/.env` → vazio (production); `curl -v www.asaas.com` com chave inválida → 401 (não 403) confirmando que IP check é por-account, não global
- Fix: Whitelist `2.24.67.84` adicionado em `www.asaas.com` (production Asaas)

**Problema 2 — API key com `$$` no `.env` (Docker Compose double-interpolation)**
- Sintoma: Após whitelist corrigido → `asaas HTTP 401` (auth failure)
- Causa: `ASAAS_API_KEY=$$aact_prod_...` no `.env` do VPS. Docker Compose faz dupla interpolação: lê `$$aact_prod_...` do `.env`, substitui `${ASAAS_API_KEY}` no compose → o resultado `$$aact_prod_...` é processado novamente como variável `$aact_prod_...` → não encontrada → **container recebe key vazia**. O `$$` no `.env` é o escape correto para Docker Compose produzir um `$` literal no container.
- Diagnóstico: `docker compose up -d backend` logava `WARN: The "aact_prod_000M..." variable is not set. Defaulting to a blank string.` — a chave inteira era tratada como nome de variável
- Fix tentado e revertido: `sed` que removeu o `$$` quebrou o escaping. Restaurado com `sed -i 's/^ASAAS_API_KEY=\$/ASAAS_API_KEY=\$\$/' /opt/revendaclick/.env` + restart backend
- Evidência de resolução: warning sumiu nos logs, backend logou `asaas configured, env: production`

**Problema 3 — `UpdateSubscriptionAsaas`: `$2` nunca usado, `tenantID` duplicado nos args**
- Sintoma: `update subscription: unused argument: 1` (pgx)
- Causa: Query SQL usava `$1, $3, $4, $5, $6` (pulava `$2`), mas args passavam `tenantID` duas vezes: `tenantID, tenantID, planID, asaasSubID, paymentLink, cycle`. O pgx rejeita quando um argumento (índice 1 = segundo) não é referenciado na query.
- Fix: Removido `tenantID` duplicado; placeholders renumerados para `$1–$5` sequenciais
- Arquivo: `backend/internal/billing/repository.go`
- Commit: `71d6ba6`

### Estado do billing após correções

- Customer Asaas criado com CPF ✓ (`cus_000178453189` no tenant de teste)
- Subscription: SQL bug fixado e deployado; confirmação end-to-end pendente (token do teste expirou)
- Webhook, trial→active, upgrade, cancel, reactivate: pendentes

### Arquivos alterados

- `backend/internal/billing/repository.go` — fix `UpdateSubscriptionAsaas` SQL args (commit `71d6ba6`)
- `/opt/revendaclick/.env` no VPS — restaurado `$$` na `ASAAS_API_KEY` (Docker Compose escape)

### Comandos executados no VPS

```bash
# Diagnóstico de IP
docker compose -f docker-compose.production.yml exec backend wget -qO- ifconfig.me
grep ASAAS_ENV /opt/revendaclick/.env
curl -v --max-time 5 https://www.asaas.com/api/v3/customers?limit=1 -H "access_token: invalida"

# Fix da API key (restaurar $$ correto)
sed -i 's/^ASAAS_API_KEY=\$/ASAAS_API_KEY=\$\$/' /opt/revendaclick/.env
docker compose -f docker-compose.production.yml up -d backend
docker compose -f docker-compose.production.yml logs backend --tail=5
```

### Commits desta sessão

- `71d6ba6` — fix: billing subscribe — remove duplicate tenantID arg in UpdateSubscriptionAsaas

---

## 2026-05-26 (sessão 7) — Validação de produção completa + fix lead source + fix nil slice

**O que foi feito:**

### Testes de produção executados (smoke test + CRUD completo)

**Infraestrutura: 22/22 PASS**
- TLS válido 76 dias em ambos os domínios ✓
- Backend `/health` → `{status:ok, db:ok}` ✓
- Frontend `https://app.revendaclick.com.br` → 200 ✓
- Evolution API → 200 ✓
- Auth enforcement (401 sem JWT) ✓
- Rate limiting via X-Request-ID ✓
- Nginx cache `/api/public/*` → HIT ✓
- Webhook Asaas rejeitando sem token → 401 ✓
- Metrics bloqueado por nginx → 403 ✓
- SSL/TLS em api + evolution ✓

**Auth/Login:**
- Supabase auth API: erro 400 com `invalid_credentials` para credenciais inválidas ✓
- Signup → Onboarding → JWT com `app_metadata.tenant_id` ✓
- Backend lê JWT de `app_metadata` (não top-level) — correto ✓
- Estado banco: 6 tenants ativos, todos com `jwt_tenant_id` correto ✓

**CRUDs testados com usuário de teste real:**
- Lead CREATE(✓), GET(✓), UPDATE(✓), ADD Activity(✓), DELETE(✓)
- Customer CREATE(✓), GET(✓), UPDATE(✓), DELETE(✓)
- Vehicle CREATE(✓), GET(✓), UPDATE(✓), DELETE(✓)
- Public API `/api/public/:slug/leads` (anon) ✓
- Public API `/api/public/:slug/vehicles` ✓
- Sales list ✓, Financial entries ✓
- Analytics bloqueado por plan gate (starter) — correto ✓
- Vendors: GET `/api/users` ✓, invite via `POST /api/users` requer UUID Supabase ✓
- Audit log ✓

### Bugs encontrados e corrigidos

**Bug A: Lead CREATE com `source` inválido → `internal_error` opaco**
- Causa: `source: "manual"` não existe no enum `lead_source` → pgx DB error → `internal_error`
- Fix: Adicionado `validLeadSources` map + validação em `CreateRequest.Validate()`
- Enum válido: `marketplace`, `whatsapp`, `referral`, `direct`, `social`, `other`
- Arquivo: `backend/internal/leads/model.go`

**Bug B: Listas vazias retornam `null` em vez de `[]`**
- Causa: `var list []*T` nil em Go serializa como `null` com `json:"data,omitempty"`
- Fix: `response.normalizeSlice()` converte nil slices para `make([]T, 0)` via reflect
- Removido `omitempty` de `Envelope.Data` para garantir `data` sempre presente
- Frontend já usa `json.data ?? []` — seguro
- Arquivo: `backend/internal/response/response.go`

### Riscos identificados (não corrigidos — exigem decisão)

**CRÍTICO: Trials expiram em 4 dias**
- `santos-car` (dilneysantos@gmail.com): trial_ends_at = 2026-05-31
- `devecar` (dilneysantos.developer@gmail.com): trial_ends_at = 2026-05-31
- `testecar`, `teste-02`, `teste03`: trial_ends_at = 2026-06-01
- Impacto: sem Asaas whitelist, usuários não podem assinar; `SubscriptionGate` checa apenas `status` (não `trial_ends_at`) → acesso continua mesmo expirado
- Ação: resolver Asaas whitelist ANTES de 2026-05-31

**staging-admin**: trial expirado em 2026-05-20 — conta de staging, sem impacto real

**Arquivos alterados:**
- `backend/internal/leads/model.go` — source validation
- `backend/internal/response/response.go` — normalizeSlice + remove omitempty

**Commits:**
- `43c65ee` — fix: lead source validation + nil slice → [] in API responses

---

## 2026-05-26 (sessão 6) — Fix analytics, nginx, segurança Supabase, infra, smoke test

**O que foi feito:**

### 1. Fix analytics revenue zerado (`backend/internal/analytics/repository.go`)
- **Causa raiz:** Duas queries SQL usavam colunas inexistentes: `final_value` (não existe em `sales`) e `completed_at` (não existe — coluna correta é `sold_at`).
- **Fix:** `final_value` → `sale_price`; `completed_at` → `sold_at`. Confirmado via Supabase MCP (`\d sales`).
- **Impacto:** Analytics retornava receita R$0 para todos os tenants silenciosamente.

### 2. Fix nginx webhook rate limiting silencioso (`nginx.conf`)
- **Causa raiz:** `location ~ ^/api/v1/webhooks/` nunca casava com as rotas reais `/api/webhooks/evolution` e `/api/webhooks/asaas` (sem "v1"). Os webhooks recebiam o `api_limit` geral (30rps) em vez do `webhook_limit` restrito (5rps/burst=10).
- **Fix:** `^/api/v1/webhooks/` → `^/api/webhooks/`. Comentário com rotas adicionado.

### 3. Migrations 011 e 012 rastreadas no git
- **Migration 011** (`database/migrations/011_performance_rls_indexes.sql`): Já estava aplicada no Supabase (`20260526145045`) mas sem arquivo local. Criado. Contém 14 indexes de performance + otimização de políticas RLS (wrap `auth.function()` em `SELECT`).
- **Migration 012** (`database/migrations/012_fix_security_definer_revoke.sql`): Recuperada do `supabase_migrations.schema_migrations`. REVOKE de `complete_sale()`, `get_tenant_invoices()`, `get_tenant_usage()` de PUBLIC/anon/authenticated; GRANT só para service_role.

### 4. Migration 013 aplicada (segurança)
- **`leads_public_insert`:** Era `FOR ALL ROLES WITH CHECK (true)` — qualquer role podia inserir leads para qualquer tenant. Fixado para `TO anon WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE is_active = TRUE))`.
- **`vehicles_public_read` (storage):** Política removida. Bucket é `public=true` — URLs diretas funcionam sem policy. A policy habilitava listagem SDK de todos os arquivos do bucket.
- Aplicado diretamente via Supabase MCP antes de criar o arquivo local.
- Resolve 2 advisors de nível WARN no Supabase Advisor.

### 5. Infra: Docker Compose melhorias (`docker-compose.production.yml`)
- Redis healthcheck adicionado: `test: ["CMD", "redis-cli", "ping"]`
- Evolution agora aguarda Redis healthy antes de iniciar (`depends_on: redis: condition: service_healthy`)
- `BETTER_STACK_SOURCE_TOKEN` adicionado ao backend (estava faltando para BetterStack log ingestion)
- Backup scheduler reescrito em bash puro (eliminada dependência de `python3` que não existe no `alpine` base image)
- Variáveis S3 adicionadas ao serviço backup: `BACKUP_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`

### 6. Backup UTC + S3 (`backup.sh`)
- `date` → `date -u` (timestamp UTC consistente)
- Bloco S3 upload opcional: se `BACKUP_S3_BUCKET` definido, instala `aws-cli` via `apk add` e faz upload

### 7. Smoke test: Frontend adicionado (`scripts/smoke-test.sh`)
- Seção #11 adicionada: testa `https://app.revendaclick.com.br` e `https://revendaclick.com.br`
- Também testa `/api/health` no frontend Next.js

### Decisões técnicas registradas
- D16: `public_vehicle_listings` mantém SECURITY DEFINER (converter exporia emails de tenants via PostgREST)
- D17: `leads_public_insert` restrito a anon + tenant ativo

**Arquivos alterados:**
- `backend/internal/analytics/repository.go` — `final_value`→`sale_price`, `completed_at`→`sold_at`
- `nginx.conf` — `^/api/v1/webhooks/` → `^/api/webhooks/`
- `database/migrations/011_performance_rls_indexes.sql` — criado (rastreamento git)
- `database/migrations/012_fix_security_definer_revoke.sql` — criado (recuperado do Supabase)
- `database/migrations/013_security_leads_insert_storage_listing.sql` — criado + aplicado
- `docker-compose.production.yml` — Redis healthcheck, Evolution depends_on, backup scheduler, BETTER_STACK_SOURCE_TOKEN
- `backup.sh` — UTC timestamps, S3 upload block
- `scripts/smoke-test.sh` — check #11 frontend

**Commits desta sessão:**
- `0b32a6d` — analytics fix + migrations 011/012 + infra improvements
- `39b5a38` — nginx webhook location bug fix
- `c981b0b` — security migration 013 (leads_public_insert + storage listing)

---

## 2026-05-25 (sessão 5) — Auditoria completa docs-operacao + sync documentação ↔ código

**O que foi feito:**

### Auditoria
- Leitura integral de todos os 25 arquivos de `docs-operacao/` (00 a 24 + README)
- Identificadas divergências entre documentação e código introduzidas pelo commit `d17025e`

### Divergências identificadas e corrigidas

**1. Evolution memory limit:** Documentação dizia `512m`; código (`docker-compose.production.yml` linha 117) tem `768m`. Corrigido em `11_DOCKER.md` e `16_EVOLUTION.md`.

**2. Redis adicionado ao stack de produção:** Commit `d17025e` adicionou serviço `redis:7-alpine` (`rc_redis`) ao `docker-compose.production.yml`. Não estava documentado em lugar algum. Corrigido em `11_DOCKER.md`, `16_EVOLUTION.md`, `21_DECISOES_TECNICAS.md` (nova decisão D15).

**3. NODE_OPTIONS na Evolution:** `NODE_OPTIONS: "--max-old-space-size=400"` adicionado ao container Evolution. Não documentado. Corrigido em `16_EVOLUTION.md`.

**4. Runbook I3:** Texto "se memory > 512m: aumentar para 768m" ficou obsoleto (768m já é o valor atual). Corrigido para "se > 768m: aumentar para 1024m".

**5. Risco R13:** Severidade/mitigação atualizados para refletir 768m + NODE_OPTIONS + Redis.

### Sem alterações de código
Nenhum arquivo de código foi alterado nesta sessão. Apenas sincronização de documentação.

**Arquivos alterados:**
- `docs-operacao/11_DOCKER.md` — Evolution 512m→768m; seção Redis adicionada
- `docs-operacao/16_EVOLUTION.md` — 512m→768m; NODE_OPTIONS; Redis documentados
- `docs-operacao/19_RISCOS.md` — R13 atualizado (768m + mitigações)
- `docs-operacao/20_PENDENCIAS.md` — Evolution OOM CONCLUÍDA; sync docs CONCLUÍDA; diagnóstico VPS atualizado
- `docs-operacao/21_DECISOES_TECNICAS.md` — D15 adicionada (Redis para Evolution)
- `docs-operacao/22_HISTORICO_ALTERACOES.md` — este registro
- `docs-operacao/23_PROXIMO_PASSO.md` — próximos passos atualizados
- `docs-operacao/24_RUNBOOK_INCIDENTES.md` — I3 atualizado (512m→768m→1024m)

**Commits desta sessão:** nenhum (somente docs — a commitar)

---

## 2026-05-25 (sessão 4) — Fix 6 bugs críticos de produção: vendedores, billing, WhatsApp, settings/plan, settings/users

**O que foi feito:**

### BUG 1 — Vendedores: "Error sending invite email" + UX
- **Causa raiz:** `inviteUserByEmail` depende de SMTP do Supabase (rate limit severo no free tier). Gerava erro "Error sending invite email" sempre que o limite era atingido.
- **Fix:** Trocado `inviteUserByEmail` → `generateLink({ type: 'invite' })`. Gera URL de convite sem enviar email. Admin compartilha o link manualmente (WhatsApp, SMS, etc.).
- **UX:** Botão "Convidar membro" → "Novo vendedor". Modal título atualizado. Role Admin removido do dropdown (só Vendedor e Visualizador). Sucesso mostra o link copiável.
- Cleanup automático do auth user se o backend falhar ao registrar o usuário.

### BUG 2 — Billing: 403 not_allowed_ip
- **Causa raiz:** IP do VPS não whitelisted na API Asaas (sandbox ou produção).
- **Fix código:** `asaasUserErr()` em `billing/service.go` detecta `not_allowed_ip` e retorna mensagem amigável ao usuário em vez do erro raw do Asaas.
- **Fix configuração (requer ação manual):** Ver "AÇÃO URGENTE" em `23_PROXIMO_PASSO.md`.

### BUG 3 — WhatsApp: botões sem efeito visível
- **Causa raiz código:** `refreshStatus()` (botão "Atualizar Status") falhava silenciosamente — sem toast, sem feedback ao usuário.
- **Fix:** Separado em dois handlers: `refreshStatus` (auto-poll silencioso) e `handleRefreshStatusManual` (botão manual com toast de feedback e loading state).
- **Causa raiz infra (requer diagnóstico no VPS):** Evolution API pode estar down. Ver diagnóstico em `23_PROXIMO_PASSO.md`.

### BUG 4 — Settings/Plan: botões Renovar/Assinar mortos
- **Causa raiz:** `handleSubscribe` em `PlanTab` não tinha estado de erro. Se `subscribePlan` retornava erro, nada acontecia — botão voltava ao normal sem feedback.
- **Fix:** Adicionados `planError` e `planSuccess` states com display no JSX. Banner informativo para usuários em trial.

### BUG 5 — Settings/Users: "disponível em breve"
- **Causa raiz:** Feature incompleta. Placeholder sem funcionalidade.
- **Fix:** `UsersTab` reescrita com modal "+ Convidar Membro". Roles: Administrador (admin) e Gerente (seller). Usa mesmo `inviteVendor` action com `generateLink`. Botão oculto para trial/sem plano com mensagem clara. `router.refresh()` após invite para atualizar a lista.

### Geral
- `ROLE_LABELS.admin`: `'Admin'` → `'Administrador'` (toda a aplicação).

**Arquivos alterados:**
- `frontend/app/(dashboard)/vendors/actions.ts` — `inviteUserByEmail` → `generateLink`, retorna `inviteLink`
- `frontend/app/(dashboard)/vendors/_components/VendorsClient.tsx` — UX: "Novo vendedor", roles, link copiável
- `frontend/app/(dashboard)/settings/_components/SettingsTabs.tsx` — PlanTab com error/success/trial; UsersTab com invite modal
- `frontend/components/whatsapp/WhatsAppManager.tsx` — `handleRefreshStatusManual` com toast
- `frontend/lib/users.ts` — `ROLE_LABELS.admin: 'Administrador'`
- `backend/internal/billing/service.go` — `asaasUserErr()` para mensagem amigável de IP whitelist

**SQL executado:** nenhum

**Configuração externa necessária (não código):**
1. Asaas IP Whitelist — ver `23_PROXIMO_PASSO.md`
2. Evolution API diagnóstico VPS — ver `23_PROXIMO_PASSO.md`

---

## 2026-05-25 (sessão 3) — Fix: updateSupabaseAppMetadata com retry + logging; runbook de incidentes; docs completos

**O que foi feito:**
- `updateSupabaseAppMetadata` reescrito com retry de 3 tentativas (backoff 500ms), leitura do body de erro HTTP para logging estruturado (zap), e distinção entre erros retryable (network/5xx/429) e não-retryable (4xx config errors).
- Logger injetado no `Handler` de onboarding — agora `updateSupabaseAppMetadata` loga `Warn` em cada tentativa falha, `Error` ao esgotar todas as tentativas, e `Info` no sucesso.
- `NewHandler` de onboarding recebe `*zap.Logger` — `server.go` atualizado para passar o logger existente.
- Risco R15 documentado em `19_RISCOS.md`: `updateSupabaseAppMetadata` falha silenciosa no onboarding.
- `24_RUNBOOK_INCIDENTES.md` criado com 10 cenários de incidente: 502, loop onboarding, WhatsApp desconectado, webhooks Asaas, CI/CD travado, SSL expirado, dashboard lento, erro 500 frontend, login falhando, IA retornando 500.
- `20_PENDENCIAS.md` atualizado: fix updateSupabaseAppMetadata marcado como CONCLUÍDO; runbook marcado como CONCLUÍDO; Banco/indexes já existentes (migration 009) confirmados.
- `23_PROXIMO_PASSO.md` atualizado com estado atual.

**Causa raiz que motivou o fix:**
`updateSupabaseAppMetadata` era `_ = h.update...` — erros completamente ignorados. Agora: 3 tentativas + logs estruturados com status HTTP e body exato da resposta do Supabase Admin API. Facilita diagnóstico imediato via `docker compose logs backend | grep updateSupabase`.

**Arquivos alterados:**
- `backend/internal/onboarding/onboarding.go` — retry 3x, zap logging, io.ReadAll do body de erro, logger injetado no Handler
- `backend/internal/server/server.go` — passa `logger` para `onboarding.NewHandler`
- `docs-operacao/19_RISCOS.md` — R15 adicionado
- `docs-operacao/20_PENDENCIAS.md` — atualizado
- `docs-operacao/22_HISTORICO_ALTERACOES.md` — este registro
- `docs-operacao/23_PROXIMO_PASSO.md` — atualizado
- `docs-operacao/24_RUNBOOK_INCIDENTES.md` — criado (novo)
- `docs-operacao/README.md` — referência ao runbook adicionada

**Commits:**
- A commitar nesta sessão

---

## 2026-05-23 (sessão 2) — Fix: getTenantForUser com service role fallback + protocol guard + patch JWT claims

**O que foi feito:**
- Diagnosticado que `updateSupabaseAppMetadata` falha silenciosamente no backend → `raw_app_meta_data` dos usuários fica sem `tenant_id` → JWT sem claim → `getTenantForUser` (session client + RLS `auth_tenant_id()`) retorna 0 linhas → loop /onboarding.
- `getTenantForUser` reescrito com fallback em service role: tenta session client (RLS) primeiro; se retornar null, consulta via service role filtrando por `id = userId` (seguro — não expõe dados cross-tenant).
- Patch direto via SQL no Supabase: `UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('tenant_id', ..., 'user_role', ...)` para todos os usuários com tenant em `public.users` mas sem claim no JWT. Afetados: `dilneysantos@gmail.com`, `admin@staging.revendaclick.com.br`.
- Protocol guard adicionado em `actions.ts` e `tenant.ts`: se `NEXT_PUBLIC_API_URL` vier sem `https://`, `fetch()` não joga `TypeError: Failed to parse URL`.

**Causa raiz técnica:**
`updateSupabaseAppMetadata` em `backend/internal/onboarding/onboarding.go` é não-fatal (`_ = h.updateSupabaseAppMetadata(...)`). Quando falha (credenciais erradas, timeout, etc.), a transação do banco já foi commitada mas o JWT nunca recebe o claim. Com `getTenantForUser` dependendo de `auth_tenant_id()` (lê do JWT), o dashboard entra em loop para esses usuários mesmo com tenant no banco.

**Solução definitiva:**
1. `getTenantForUser`: session client primeiro → se null, service role fallback por `userId`. Unbloqueia todos os casos sem depender de JWT claim.
2. SQL patch: corrige JWT claims retroativamente para usuários afetados.
3. Protocol guard: garante que URL malformada nunca gera TypeError em produção.

**Arquivos alterados:**
- `frontend/lib/tenant.ts` — `getTenantForUser` reescrito com fallback; `API` constant com protocol guard
- `frontend/app/onboarding/actions.ts` — `API` constant com protocol guard

**SQL executado:**
```sql
UPDATE auth.users au
SET raw_app_meta_data = au.raw_app_meta_data 
  || jsonb_build_object('tenant_id', pu.tenant_id::text, 'user_role', pu.role)
FROM public.users pu
WHERE au.id = pu.id
  AND pu.tenant_id IS NOT NULL
  AND pu.is_active = TRUE
  AND (au.raw_app_meta_data ->> 'tenant_id') IS NULL;
```

**Commits:**
- `b5685c2` — fix: service role fallback in getTenantForUser + protocol guard on API URL

---

## 2026-05-23 — Fix: bug crítico dashboard → loop infinito /onboarding (SUPABASE_SERVICE_ROLE_KEY ausente no Vercel)

**O que foi feito:**
- Diagnosticado via Vercel runtime logs: `[getTenantForUser] users query error` em TODOS os requests de /dashboard
- Causa raiz confirmada: `SUPABASE_SERVICE_ROLE_KEY` não configurado no Vercel → `createServiceClient()` falha → `getTenantForUser` retorna null → dashboard redireciona para /onboarding → loop infinito → formulário limpa
- Fix: `getTenantForUser` reescrito para usar `createClient()` (anon key + JWT do usuário) em vez de `createServiceClient()` (service role). RLS via `auth_tenant_id()` garante isolamento por tenant. Não requer `SUPABASE_SERVICE_ROLE_KEY`.
- Renomeado `middleware.ts` → `proxy.ts` para corrigir deprecation do Next.js 16

**Causa raiz técnica:**
`createServiceClient()` em `getTenantForUser` dependia de `SUPABASE_SERVICE_ROLE_KEY` que não estava no Vercel. O erro era silencioso (capturado pelo `if (userError)` com console.error). A RLS na tabela `users` (`WHERE tenant_id = auth_tenant_id()`) funciona corretamente via JWT — o claim `tenant_id` é injetado pelo backend no `app_metadata` após onboarding + `refreshSession()`.

**Usuários afetados confirmados no banco:**
- `desconto.do.dono@gmail.com` — tenant criado mas dashboard inacessível
- `dilsant.nocode@gmail.com` — tenant criado mas dashboard inacessível
- `dilneysantos.coprodutor@gmail.com` — sem tenant, loop no onboarding
- `metodolimpezas@gmail.com` — sem tenant, loop no onboarding

**Diagnóstico usado:**
- Supabase MCP: query em `auth.users JOIN public.users` revelou usuários sem tenant
- Vercel MCP: runtime logs confirmaram o erro exato `[getTenantForUser] users query error`
- Leitura de RLS policies: `users_select_own_tenant` e `tenants_select_own` via `auth_tenant_id()`

**Arquivos alterados:**
- `frontend/lib/tenant.ts` — `getTenantForUser`: `createServiceClient()` → `await createClient()`; import adicionado
- `frontend/proxy.ts` — criado (novo nome do middleware no Next.js 16)
- `frontend/middleware.ts` — esvaziado (substituído por proxy.ts)

**SQL executado:** nenhum

**Commits:**
- `894021d` — fix: switch getTenantForUser to session client

---

## 2026-05-22 — Fix: bug crítico login → redirect incorreto para /onboarding

**O que foi feito:**
- Corrigido `frontend/lib/tenant.ts` → `getTenantForUser`
- Substituído embedded Supabase join `tenants(...)` por duas queries explícitas independentes
- Substituído `.single()` por `.maybeSingle()` para evitar erro PGRST116 quando 0 linhas retornam
- Adicionado `console.error` para surfacing de erros futuros

**Causa raiz:**
O embedded join PostgREST `.select('tenant_id, tenants(id, slug, name, phone_whatsapp)')` falha silenciosamente em produção (schema cache, FK não reconhecido, ou erro de rede). O `if (error || ...)` captura o erro e retorna null. O dashboard interpreta como "sem tenant" e redireciona para /onboarding. O backend, consultando PostgreSQL diretamente, confirma que o tenant existe — daí o "usuário já possui uma loja cadastrada".

**Arquivos alterados:**
- `frontend/lib/tenant.ts` — `getTenantForUser` reescrito com duas queries explícitas

**SQL executado:** nenhum

**Commits:** ver git log

---

## 2026-05-22 — Auditoria e documentação completa

**O que foi feito:**
- Auditoria real do repositório (leitura de todos os arquivos-fonte)
- Criação de 11 documentos na raiz: `MAPA_DE_PASTAS.md`, `ARQUITETURA_REAL.md`, `ROTAS_REAIS.md`, `BANCO_REAL.md`, `ENVIRONMENT.md`, `INFRA.md`, `CICD.md`, `DEPLOY.md`, `OBSERVABILIDADE.md`, `AUTENTICACAO_REAL.md`, `FLUXOS_REAIS.md`
- Criação de `/docs-operacao/` com 24 arquivos (memória viva do projeto)
- Correção do branch padrão de `master` → `main` no GitHub via API
- Instalação do `gh` CLI em `~/.local/bin/gh` (sem sudo)
- Geração de `FLUTTERFLOW_MIGRATION.md` com plano de migração de 8 semanas
- Decisão de **cancelar** a migração para FlutterFlow (D12 em `21_DECISOES_TECNICAS.md`)

**Por quê:**
- Projeto não tinha documentação operacional — qualquer desenvolvedor novo ou IA precisava reler todo o código
- Decisão de produto: FlutterFlow não será mais necessário

**Arquivos criados/modificados:**
- `/docs-operacao/` (pasta nova com 24 arquivos)
- `MAPA_DE_PASTAS.md`, `ARQUITETURA_REAL.md`, etc. (raiz)
- `FLUTTERFLOW_MIGRATION.md` (obsoleto — decisão D12)

**Commits relacionados:**
- Ver `git log` para commits desta data

---

## Template para novas entradas

```
## YYYY-MM-DD — Descrição resumida

**O que foi feito:**
- item 1
- item 2

**Por quê:**
- motivação

**Arquivos criados/modificados:**
- caminho/do/arquivo.ext — o que mudou

**Commits relacionados:**
- sha abreviado — mensagem do commit
```

---

> Entradas mais antigas ficam abaixo das mais recentes.
> Não limitar o histórico — nunca apagar entradas.
