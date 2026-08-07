# 23 — PRÓXIMO PASSO

> Atualizado em: 06/08/2026 (sessão 64 — troca da conta Asaas + reset de IDs órfãos (D37), limpeza de tenants e landing reformulada/descongelada (D38) — ver "Estado Atual" abaixo)
> Atualizar este arquivo ao final de cada sessão com o que deve ser feito na próxima.

---

## Guia de Leitura por Tipo de Tarefa

> Leia isso PRIMEIRO, antes de abrir qualquer outro arquivo.

| Tipo de tarefa | Arquivos para ler |
|---|---|
| Qualquer tarefa | `23_PROXIMO_PASSO.md` (este) + `20_PENDENCIAS.md` |
| Alterar banco / migrations | `05_SUPABASE.md` → aplicar → regenerar `database.types.ts` |
| Alterar backend Go | `04_BACKEND.md` + `08_API_ROTAS_REAIS.md` |
| Alterar infra / docker | `10_INFRA_VPS.md` + `11_DOCKER.md` |
| Fazer deploy | `13_DEPLOY.md` + `12_CICD.md` |
| Diagnosticar bug | `FalhasCorrigidas/README.md` → buscar padrão similar |
| Precisar de valor fixo (IP, ID, URL) | `REFERENCE.md` |
| Entender decisão arquitetural | `21_DECISOES_TECNICAS.md` |
| Ver estado atual de qualquer feature | `22_HISTORICO_ALTERACOES.md` (topo — ESTADO ATUAL) |

---

## Estado Atual do Projeto (sessão 64 — 06/08/2026)

| Componente | Status |
|---|---|
| **Landing reformulada + landings segmentadas (sessão 64, D38)** | ✓ **COMMITADA — AINDA NÃO EM PRODUÇÃO** — o congelamento da sessão 31 foi **revogado pelo usuário**. `components/marketing/` substituído por `components/landing/` (sobraram `PixelScripts`, `FloatingWhatsApp`, `ConversionLink`); `app/page.tsx` reescrita; 6 landings segmentadas em `/revendas-pequenas`, `/multimarcas`, `/premium`, `/crm-automotivo`, `/erp-automotivo`, `/site-para-revendas`, todas geradas por `SegmentPage.tsx` a partir de `segments/data.ts` e prerenderizadas como estáticas. `onboarding.go` passou a rejeitar slugs reservados para a rota estática não engolir a vitrine `[slug]`. Validado: `tsc --noEmit`, `next build`, `eslint`, `go build/vet/test` — todos limpos. **Falta push** (dispara deploy Vercel) e conferência visual das 7 rotas em produção. |
| **Conta Asaas nova + reset de IDs órfãos (sessão 64, D37)** | ✓ **EM PRODUÇÃO** — a conta anterior foi encerrada. Chaves novas em `/opt/revendaclick/.env` no VPS com escape `$$` (D18); validado que o container recebe `$aact_prod_...` com um único `$`. Chave testada direto contra a API a partir do VPS: HTTP 200 (IP `2.24.67.84` liberado). Migration 040 zerou `tenants.asaas_customer_id`, `subscriptions.asaas_subscription_id`/`asaas_payment_link`, `subscription_addons.asaas_addon_id` e esvaziou `billing_customers`; `billing_invoices` (26) e `billing_events` (128) preservados. Webhook validado: token errado/ausente → 401, correto → 400. **PENDENTE: teste ponta a ponta de assinatura real.** |
| **Limpeza de tenants (sessão 64)** | ✓ **EXECUTADA** — banco reduzido a **1 tenant** (`santos-car`). Excluídos `devecar`, `finalcar`, `auditoria-rc-s42` e `revenda-click`, com `auth.users` correspondentes, dados em cascata, 1 auth órfão de teste e 5 objetos órfãos de storage. Backup pré-operação: `/opt/revendaclick/backups/backup-2026-08-06T11-24-57Z.sql.gz`. |
| **CI/CD — paths-ignore (sessão 63, D36)** | ✓ **IMPLEMENTADO E VALIDADO EM PRODUÇÃO** — `.github/workflows/ci.yml` ignora `**.md`, `docs-operacao/**`, `docs-produto/**`, `prompts/**`, `templates/**`, `.claude/**` no gatilho `push`. Commits só de documentação não redeployam mais o backend. Validado nos dois sentidos: commit de código (`d7eb90f`) disparou o pipeline normalmente; commit de docs (`10f2123`) não apareceu em `gh run list`. Autorizado explicitamente pelo usuário antes da implementação. Pendência fechada em `20_PENDENCIAS.md`; decisão em D36 (`21_DECISOES_TECNICAS.md`). |
| **Comandos `/` e agentes (sessão 62)** | ✓ **EM PRODUÇÃO NO REPO** — 7 comandos (`.claude/commands/`) e 5 agentes (`.claude/agents/`) migrados do repositório de planejamento `RevendaClick` (descontinuado). Reescritos, não copiados: a governança de origem (máquina de 8 estados, `PROCESSOS.md`, `PERMISSOES.md`) foi **descartada** para não conflitar com a vigente; cada comando aponta para os documentos reais deste repo. Comandos: `/abrir-sessao`, `/encerrar-sessao`, `/checklist-dia`, `/auditoria`, `/novo-modulo`, `/registrar-decisao`, `/registrar-pendencia`. Substituem a cópia manual de `prompts/`, que seguem válidos como referência. Commit `7f544ec`. |
| **`.gitignore` — `.claude/*` escondia commands/agents (sessão 62)** | ✓ **CORRIGIDO** — a regra `.claude/*` (linha 80) excluía tudo em `.claude/` exceto os 4 `.md` nomeados; `commands/` e `agents/` seriam invisíveis ao git. **Mesma classe do FC057** (regra de `.gitignore` escondendo código real → decisão D35). Exceções adicionadas para os dois diretórios; `settings.local.json` segue ignorado. Validado com `git check-ignore` e com arquivo de teste real. Commit `7f544ec`. |
| **Caminho errado de `database.types.ts` (sessão 62)** | ✓ **CORRIGIDO** — `.claude/04_VALIDACAO.md` mandava gerar os tipos em `src/types/database.types.ts` e `.claude/01_CONTEXTO.md` mandava conferir `frontend/src/types/database.types.ts`. `frontend/src/` **não existe**; o arquivo real é `frontend/lib/database.types.ts`. Seguir a instrução criaria arquivo órfão e deixaria o real desatualizado após migration. Commit `73a5191`. |
| **Repositório de planejamento `RevendaClick` (sessão 62)** | ✓ **DESCARTADO** — movido para `~/Projetos/descartar/RevendaClick.planejamento-descontinuado`. Nunca teve commit; os 4 docs não migrados (`08-decisoes-tecnicas`, `09-integracoes`, `10-prompts`, `CHANGELOG`) eram modelos de estrutura vazios, já cobertos por documentos reais daqui. Elimina o risco de abrir sessão na pasta errada. |
| **Billing — trial 30d/carência 7d/lembrete de vencimento (sessão 61)** | ✓ **PRODUÇÃO** — trial e carência alterados (migrations 038/039, afeta só novos eventos); worker diário `StartDueReminderWorker` envia e-mail via Resend 7 dias antes do vencimento; testado em produção sem cair em spam. |
| **FC062 — Preço FIPE bloqueado por CSP (sessão 61)** | ✓ **CORRIGIDO** — rota proxy `/api/fipe/price`, mesmo padrão de brands/models/versions. Commit `2a8de19`. |
| **FC063 — Convite de vendedor redirecionava para login (sessão 61)** | ✓ **CORRIGIDO E VALIDADO EM PRODUÇÃO** — `redirectTo` de `/auth/callback` (server, não lê fragmento) para `/reset-password` (client, já tratava o fluxo). Commit `c7d27a6`. Complementar: convite agora envia e-mail automático via Resend (commit `5e14748`), testado sem spam. |
| **FC064 — RESEND_API_KEY ausente do docker-compose (sessão 61)** | ✓ **CORRIGIDO** — env var faltava na allowlist `environment:` do backend, perdida a cada redeploy. Corrigido também: query do worker de lembrete usava igualdade exata de data (perderia o envio se o worker caísse um dia) → trocada para janela. Commits `aaf16f2`, `fae5c58`. |
| **FC065 — SSL a 10 dias de expirar (sessão 61)** | ✓ **CORRIGIDO — CRÍTICO** — certbot usava `standalone` (conflito de porta 80 com Nginx) há semanas, renovação automática falhando silenciosamente. Renovado manualmente (válido até 2026-10-30) e mecanismo trocado para `webroot` — `--dry-run` validado. **Pendência:** `api.beautynow.app.br` (mesma VPS) tem o mesmo bug, não corrigido. |
| **docs-produto/ (sessão 61)** | ✓ **NOVO** — visão, requisitos, modelagem, regras de negócio, glossário e roadmap trazidos de um repositório de planejamento separado (descontinuado). Complementa `docs-operacao/` — ver `docs-produto/README.md`. |
| **FC061 — "Página da Loja" sem destaque na UX (sessão 60)** | ✓ **IMPLEMENTADO** — Nova rota dedicada `/store` (server component) com header + badge de status, CTA âmbar condicional "Sua Página da Loja ainda não está publicada." + "Configurar Agora" → `/settings?tab=contact` quando `!published`. Sub-componentes: `StoreActions.tsx` (URL pública + Copiar + Abrir + Compartilhar WhatsApp via `api.whatsapp.com`) + `StoreMetrics.tsx` (Status / Leads gerados / Origem principal). Sidebar: novo item "Página da Loja" entre Dashboard e Veículos (NAV_BASE, visível todos os planos). Dashboard: substituído `CopyStoreLink` por `StoreCard` (gradient `primary/[0.06]`, pill de status, URL com Copiar, Abrir Loja + Editar Loja/Configurar Agora); bloco "Acesso rápido" lateral com "Ver Minha Loja" + "Página da Loja". `CopyStoreLink.tsx` removido (bug de domínio `revendaclick.com.br` → `app.revendaclick.com.br` corrigido). Métricas de visitas/conversão **deferidas** (requerem migration `store_visits` + tracking pixel — fora do escopo deste FC). TypeScript validado (`tsc --noEmit` exit 0). |
| **FC060 — Auditoria operacional sessão 60 (sessão 60)** | ✓ **VALIDADO** — Zero divergências código↔docs; nenhum bug encontrado; checkpoints confirmados (backend health, migrations, nomenclatura, backups, uptime, JWT normalizado) |
| **FC059 — Super Admin defense-in-depth (sessão 59)** | ✓ **IMPLEMENTADO** — `resolveUserRole()` em `frontend/lib/tenant.ts` com semântica JWT-first + DB-fallback via `createServiceClient`. Atualizado: `(dashboard)/layout.tsx`, `(admin)/layout.tsx`, `api/admin/[...path]/route.ts`, `login/page.tsx`. Novo endpoint `app/api/me/role/route.ts` para o login resolver destino. Causa raiz revelada: `dilneysantos.developer@gmail.com` tem `public.users.role='super_admin'` mas `auth.users.app_metadata.user_role` ausente (promoção SQL não sincroniza Auth server). Defense-in-depth cobre o gap sem requerer migração manual. |
| **FC058 — Super Admin redirecionado para `/onboarding` (sessão 58)** | ✓ **PARCIAL** — Layout do dashboard distinguia role + redirect `www→app`. Mas a checagem dependia do JWT claim `user_role` que estava ausente — bug só completamente coberto após FC059. Adendo em FC058 explica a causa raiz completa. |
| **FC057 — /admin/logs 404 definitivo — .gitignore bloqueava rota (sessão 57)** | ✓ **CONCLUÍDA** — CAUSA RAIZ: `.gitignore` linha 40 tinha `logs/` (recursivo) que impedia `frontend/app/(admin)/admin/logs/page.tsx` de ser rastreado pelo git. Página existia apenas localmente — NUNCA commitada/deployada. Fix: `logs/` → `/logs/` (root-anchored); página adicionada ao git pela 1ª vez + `dynamic='force-dynamic'`. Login: `router.push()` → `window.location.href` + `redirect` param respeitado. Commit `0e3538c` → Vercel `dpl_53YWmJSxofTVHqnWjjf4xbJS8hbW` → **READY**. |
| **FC056 — Divergências pós-FC054/FC055 (sessão 57)** | ✓ **CONCLUÍDA** — (1) /admin/logs 404: 200 nos logs Vercel era de deploy antigo — rota de fato inexistente (corrigida em FC057). (2) Botão "Reativar" ausente em `/admin/tenants`: estava apenas em SubscriptionsTable; corrigido em `AdminTenantsTable` com label condicional por `sub_status === 'canceled'`. Commit `184bd09`. |
| **FC055 — middleware.ts conflito proxy.ts — 4 deploys ERROR (sessão 57)** | ✓ **CONCLUÍDA** — `middleware.ts` criado no FC053 causou conflito fatal: `"Both middleware file ./middleware.ts and proxy file ./proxy.ts are detected."` Next.js 16.2.6 usa `proxy.ts` como middleware nativo — `middleware.ts` era desnecessário. Fix: `rm frontend/middleware.ts`. Deploy `ff00b46` → Vercel `dpl_9XuhFKQrkP7WahDqkdV1gs755wXZ` → **READY** em `app.revendaclick.com.br`. |
| **FC054 — 3 bugs produção: /admin/logs 404, reativar assinatura, copiar email (sessão 56)** | ✓ **CONCLUÍDA** — (1) `layout.tsx` usava `getSession()` → JWT stale → super_admin redirecionado ao `/dashboard` → 404; fix: `getUser()`. (2) `SubscriptionsTable`: botão "Reativar" para rows canceled + `clear_canceled_at` automático no handleSave + `handleReactivate` (+30d). (3) `SupportContact` client component: email `app.revendaclick@gmail.com` + clipboard + feedback visual + fallback. Commit `4e22465`. Em produção após FC055. |
| **FC053 — Super Admin DELETE tenant "Acesso negado" (sessão 55)** | ✓ **CONCLUÍDA** — 3 causas raiz: (1) `proxy.ts` não wired como middleware Next.js → sem refresh de sessão por request; (2) `getSession()` usava JWT cacheado sem validar `app_metadata` no servidor; (3) DELETE body nunca encaminhado ao backend (`reason` sempre vazio). Fix: `middleware.ts` criado (wire proxy.ts), `getUser()` em route.ts, `if (method !== 'GET')`. Commit `cfc060f`. Deploy Vercel automático. |
| **FC052 — Teste de aceitação dos fluxos admin (sessão 54)** | ✓ **CONCLUÍDA** — 4/4 fluxos aprovados em produção. Hotfix crítico: `audit_logs` nunca gravava (pgx SimpleProtocol `[]byte` → bytea hex; fix: `string(json.Marshal())` + `::jsonb` cast em `admin/repository.go` + `audit/repository.go`). Audit validado: 5 entradas gravadas. Frontend `/conta-suspensa` requer validação manual com browser. |
| **FC051 — Validação de serviços externos por status (sessão 54)** | ✓ **CONCLUÍDA** — Auditoria completa: 2 divergências (WA connection persiste para QUARENTENA/EXCLUÍDO). Correção: `QuarantineTenant` e `DeleteTenant` (soft+hard) chamam `DisconnectInstance` após DB update. BLOQUEADO mantém conexão (correto). Billing webhook, IA, CRM: sem divergência. |
| **FC050 — Hardening status de tenant (sessão 53)** | ✓ **IMPLEMENTADO** — `getTenantStatusForUser` sem filtro is_active; dashboard layout redireciona para `/conta-suspensa` por status (bloqueado/quarentena/excluído); página `/conta-suspensa` autônoma com motivo, assinatura (BLOQUEADO), logout; rota `/api/auth/logout`; `database.types.ts` regenerado. TypeScript limpo. Aguarda CI/CD. |
| **FC049 — Tenants: quarentena e exclusão controlada (sessão 53)** | ✓ **IMPLEMENTADO** — Migration 037 aplicada (+quarantined_at/reason/deleted_at/reason em tenants). 5 novos endpoints backend. 4 novos handlers. Middleware atualizado (deleted_at IS NULL). Frontend: tooltips CSS puro, modal quarentena (motivo obrigatório), modal exclusão (resumo + modo lógico/físico + confirmação dupla). TypeScript limpo. Aguarda CI/CD. |
| **FC048 — Validação propagação global de planos (sessão 53)** | ✓ **CONCLUÍDA** — 9/9 critérios validados. Nenhum bug encontrado. Propagação imediata confirmada (GetUsage() sem cache). Billing inalterado. RLS intacta. audit_logs com tenant_id=NULL funcional. Valores restaurados. |
| **FC047 — Validação pós-deploy Super Admin (sessão 52)** | ✓ **CONCLUÍDA** — 3 bugs corrigidos: (1) `evoSvcInst` use-before-declaration compile error [commit `4b27afb`]; (2) `audit_logs.tenant_id NOT NULL` — `ALTER COLUMN DROP NOT NULL` aplicado no Supabase; (3) `entity_id` não-UUID em WhatsApp audit [commit `e094b85`]. Backend em produção com imagem `e094b85`. |
| **FC046 — Super Admin CRUD Completo (sessão 52)** | ✓ **CONCLUÍDA** — 10 novos endpoints backend + 5 componentes frontend + audit logging. Em produção após fix FC047. |
| **FC045 — Contagem documental de FCs desatualizada (sessão 51)** | ✓ **CONCLUÍDA** — `23_PROXIMO_PASSO.md` + `FalhasCorrigidas/README.md` atualizados; FC044 adicionado ao índice; seção Documentação criada; contadores sincronizados. Apenas documentação. |
| **FC043 — Backup S3 Automatizado (sessão 49)** | ✓ **CONCLUÍDA** — `backup.sh` refatorado; compose atualizado; `restore-from-s3.sh` + `configure-s3-lifecycle.sh` criados |
| **FC042 — E2E Playwright selectors + skip guards (sessão 48)** | ✓ **CONCLUÍDA** — 7 arquivos corrigidos; `getByLabel` → `locator('#email')`; `isCredentialReady()`; spec 01 skip guard; tabs `a[href]`; display_names reais do DB; 9/9 aprovados em produção |
| **FC041 — Saneamento documental final (sessão 48)** | ✓ **CONCLUÍDA** — 4 arquivos corrigidos; count FC 38→40; próximo FC039→FC041; seções obsoletas removidas |
| **Auditoria comercial E2E** | ✓ **PRONTO PARA OPERAÇÃO COMERCIAL** — fluxo completo 12 etapas aprovadas |
| **santos-car billing** | ⚠️ `canceled` — `cpf_cnpj` preenchido na sessão 64 (`022.668.269-21`) para viabilizar o teste de assinatura na conta Asaas nova |
| **Tenants no banco (sessão 64)** | ✓ **APENAS `santos-car`** — `devecar`, `finalcar`, `auditoria-rc-s42` e `revenda-click` excluídos definitivamente (todos de teste, confirmado pelo usuário). Nenhum cliente real na plataforma hoje |
| **Landing lead real** | ⚠️ "Joaõ" — São José/SC, 48998232010 — status `novo` — não atendido |
| **Super Admin — 8 páginas (sessão 45)** | ✓ **COMPLETO** — /users /subscriptions /billing /features /whatsapps /analytics /logs /settings — dados reais — commit `ad87d37` |
| **FC038 — Auditoria ESLint (sessão 46)** | ✓ **CONCLUÍDA** — 13 erros → 0; 5x `<a>→<Link>`; entities; eslint-disable; comentário obsoleto — commit `4ff2d3e` |
| **FC039 — Hardening Final (sessão 47)** | ✓ **CONCLUÍDA** — 500 ListTenants (enum cast), NavItem `<a>`→`<Link>`, proxy.ts /automations+/campaigns, sitemap /privacidade, REVOKE EXECUTE 6 funções, landing_leads RLS — commit `0be8b4e` |
| **FC040 — Supabase search_path + REVOKE PUBLIC (sessão 47)** | ✓ **CONCLUÍDA** — `SET search_path = public` em 8 funções; REVOKE FROM PUBLIC em 6 trigger functions; advisor 0 warnings de funções |
| Correções visuais s43 | ✓ CONCLUÍDAS — C1 suporte card, C2 topbar sólida, C3 auth bg #010F21, C5 reset-password |
| Premium topbar redesign | ✓ IMPLEMENTADO — desktop topbar removida; mobile h-14; "Ver loja" na sidebar |
| Migration 036 | ✓ aplicada — trigger `trg_mark_store_published` |
| Migration 035 | ✓ aplicada — `cpf_cnpj VARCHAR(18)` em tenants |
| database.types.ts | ✓ atualizado |
| FC037 — Billing CPF/CNPJ | ✓ COMPLETO |
| 08_API_ROTAS_REAIS.md | ✓ ATUALIZADO — add-on routes, admin routes, landing-lead webhook adicionados |

---

## Estado Anterior (sessão 36 — 02/06/2026)

| Componente | Status |
|---|---|
| Backend Go | ✓ CI/CD automático — VPS atualizado |
| Frontend Next.js | ✓ Vercel — auto-deploy ativado via push para main |
| Migration 022 | ✓ aplicada — performance→premium, features por plano, add-ons features |
| Migration 023 | ✓ aplicada — fix get_tenant_usage: branch tenant_features restaurado |
| Migration 024 | ✓ aplicada — RLS plan_addons + rename premium→performance |
| Migration 025 | ✓ aplicada — users.tenant_id nullable (super_admin sem tenant) |
| database.types.ts | ✓ regenerado pós-024 — 131.307 chars |
| Planos públicos | ✓ Starter/Pro/Premium (3 cards); Scale oculto (CTA Enterprise) |
| Add-ons | ✓ user_extra(R$20) / whatsapp_automation(R$39) / ia_recovery(R$39) — endpoints ativos |
| Sidebar | ✓ **REFATORADA** — Starter/Pro/Premium por feature flag; sub-navs Financeiro+Billing |
| Feature flags 3-way | ✓ plan.features UNION tenant_features UNION addon.features |
| plan_gate.go | ✓ 3 UNION ALL — plano + tenant_features + add-on features |
| Admin panel | ✓ /admin — super_admin protegido, ações por tenant |
| AdminSimulateEvent | ✓ POST /api/admin/billing/simulate-event — super_admin injeta eventos fake sem Asaas |
| DevActivate | ✓ POST /api/billing/dev/activate — ativo apenas fora de produção |
| OnboardingChecklist | ✓ widget no dashboard (4 obrigatórios + 1 WhatsApp opcional) |
| super_admin | ✓ dilneysantos.developer@gmail.com — tenant_id=NULL, role=super_admin |
| Central de Atendimento santos-car | ✓ instância Evolution `open` (554888482877); feature central_atendimento concedida |
| /automations | ✓ placeholder gated has_automation (BUG-02 corrigido sessão 29) |
| /campaigns | ✓ placeholder gated has_campaigns (BUG-02 corrigido sessão 29) |
| Testes unitários billing | ✓ +4 funções: webhookAsaasID, asaasUserErr, capitalize, event key |
| Prompts operacionais | ✓ /prompts/ (raiz) — 5 arquivos; procedimento oficial de sessão |
| Migration 026 | ✓ performance → premium (definitivo); DB + código + docs sincronizados |
| FC030 | ✓ SettingsTabs name:'premium' vs DB 'performance' — corrigido via migration 026 |
| **Billing santos-car (sessão 36 — fix invalid_action)** | ✓ `sub_b3y3xwo9s18g50xc` ativo; fallback cria nova assinatura quando deletada; 6/6 cenários upgrade/downgrade/ciclo testados e aprovados |
| D29 | ✓ plan.name = 'premium' definitivo — decisão técnica registrada |
| **FC031 — ActivateByAsaasSubID** | ✓ `canceled_at = NULL` corrigido em `repository.go` (sessão 28) |
| **Nomenclatura add-ons** | ✓ "Add-on" → "Recurso"; chips técnicos removidos; ia_recovery = "Recuperação por IA" (sessão 29) |
| **E2E auth.ts + simulate-event** | ✓ proOwner/sandbox/superAdmin; body simulate-event correto; .env.e2e vars alinhadas |
| CI/CD GitHub Actions | ✓ automático |
| Evolution API v2.3.7 | ✓ healthy |
| Billing Asaas | ✓ subscribe + upgrade end-to-end |
| Supabase security advisors | ✓ limpos |
| FalhasCorrigidas | ✓ 35 FCs documentadas (FC001–FC035) |
| PRODUCT_ARCHITECTURE.md | ✓ criado — fonte única da arquitetura de negócio |
| DEPENDENCIES.md | ✓ criado — mapa de dependências por módulo |
| ENVIRONMENTS.md | ✓ criado — produção / homologação / desenvolvimento |
| Testes E2E (Playwright) | ✓ estrutura criada — 5 specs / 6 fluxos; Playwright instalado |
| Auditoria devecar | ✓ removido como tenant operacional; Coolify → Vercel corrigido em docs |
| Memory OBSOLETO | ✓ seção OBSOLETO criada em MEMORY.md (8 itens) |
| Governança sessão | ✓ protocolo de fim de sessão em 23_PROXIMO_PASSO.md |
| **Saneamento documental (sessão 26)** | ✓ 4 divergências corrigidas; docs-operacao/prompts/ removido; referências prompts/ (raiz) corrigidas |
| **BUG-01/02/03 — Feature flags Premium (sessão 29)** | ✓ Sidebar Premium `has_automation`; /whatsapp copy correto; flags mapeadas no frontend |
| **FC032 — Add-ons sem billing Asaas** | ✓ Corrigido (sessão 30 — Etapa 5) |
| **FC033 — Cancel sub cancela add-ons em cascata** | ✓ Corrigido (sessão 30 — Opção A) |
| **Migration 027** | ✓ aplicada — `grace_until` + `asaas_payment_link` + índices |
| **Billing Asaas add-ons** | ✓ `pending_payment` → `active` via webhook; grace period 3d; `is_redundant` |
| **sandbox-revendaclick** | ✓ criado — Pro active, tenant_id: `e72eb104-98b7-4a71-946d-15e680496fc3` |
| **E2E .env.e2e** | ✓ template criado em `frontend/.env.e2e` |
| **METRICS_TOKEN** | ✓ confirmado presente e funcional no VPS (nginx bloqueia externo — correto) |
| **santos-car plano** | ✓ Atualizado: santos-car está em Pro (corrigido em REFERENCE.md + ENVIRONMENTS.md) |
| **Landing page** | ✓ **Congelamento REVOGADO** (sessão 64 — D38) | Reformulada + 6 landings segmentadas. O **fluxo de captura de leads segue congelado** e intocado. Ver D38 |
| **Migrations 030–031** | ✓ aplicadas (sessão 31) | Pipeline comercial leads: status, notes, last_contact_at, next_action |
| **Admin leads pipeline** | ✓ Produção (sessão 31) | `/admin/leads` — filtros, paginação, alerta 4h; `/admin/leads/[id]` — detalhe |
| **Webhook landing lead** | ✓ Deployado (sessão 31) | `POST /api/webhooks/landing-lead` — opcional; Evolution/WA opcionais (D31) |
| **D34 — Arquitetura WhatsApp** | ✓ Documentada (sessão 32) | WhatsApp da Loja = base; Central de Atendimento = add-on Evolution; sem ambiguidade |
| **Auditoria final homologação (sessão 33)** | ✓ APROVADO | build/tsc/vet/test limpos; infra saudável; fluxos validados; divergências docs corrigidas |
| **Feature flags docs corrigidas (sessão 33)** | ✓ Corrigida | `has_api_access` Scale-only; gate Premium = `has_automation`; REFERENCE/MEMORY/D28/snapshots atualizados |
| **Bugs billing/planos + add-ons + RLS (sessão 34)** | ✓ Corrigidos | 3 bugs billing + 2 bugs add-ons + migration 032 RLS deny-all Evolution API |
| **asaas_subscription_id santos-car (sessão 35)** | ✓ Corrigido | `dev_test_...` → `sub_gqu4uiro0sisshxt`; assinatura deletada no Asaas; corrigido definitivamente na sessão 36 |
| **Fix invalid_action upgrade/downgrade (sessão 36)** | ✓ Corrigido | Fallback em `UpgradeSubscription`; nova assinatura `sub_b3y3xwo9s18g50xc`; FC034 documentado |
| **Rebuild VPS (sessão 36)** | ✓ Executado | `docker compose down` + `up -d --build`; backend healthy; DB ok |
| **Uptime monitoring (sessão 37)** | ✓ Ativo | Cron job `*/5 * * * *` no VPS; checa 3 endpoints; falhas → `/var/log/rc_health.log` + BetterStack |
| **Auditoria documental (sessão 37)** | ✓ Concluída | 9 arquivos corrigidos; `has_api_access` → `has_automation`; FC count 33→34; flags Premium/Scale sincronizadas |
| **Fix rc_backup (sessão 37)** | ✓ Operacional | `alpine:3.20` → `postgres:17-alpine`; pg_dump 17.10 ✓; backup 2.2M gerado; cleanup executou |
| **FC035 — forgot-password appUrl (sessão 38)** | ✓ Corrigido | `window.location.origin` substitui fallback `localhost:3000`; commit `234abe4` |
| **Auth audit — 6 fluxos (sessão 38)** | ✓ AUTH APROVADO | Email confirmation ON; password "No requirements"; login "Email not confirmed" msg corrigida |
| **Landing hero (sessão 38)** | ✓ Reformulado | Formulário → CTA direto /register; logo tipográfico; subtítulo e benefícios atualizados |
| **UX ativação lojista (sessão 39)** | ✓ 9 problemas corrigidos | /vehicles/new→/vehicles; tab=contact; pré-fill; erros amigáveis; logo 80px; spam — commit `ee85f9c` |
| **Navegação dark theme (sessão 40)** | ✓ Sidebar `bg-gray-900`; topbars `bg-gray-900/90 backdrop-blur`; logo com frame `border-primary/30` — commit `cb03ab2` |
| **Auditoria branding fluxo Landing→Lead (sessão 40)** | ✓ 3 correções: focus ring onboarding; bg-primary/8→/10; --primary em vehicle detail — commit `1dc7460` |
| **Auditoria ativação lojista (sessão 41)** | ✓ ATIVAÇÃO APROVADA — 5 correções UX: checklist step 4 CTA `/leads`; step 3 copy; Termos `/terms`; leads empty state; CopyStoreLink — commit `d6307b2` |

---

## REGRA OBRIGATÓRIA — Após cada migration Supabase

Sempre regenerar `frontend/lib/database.types.ts` antes de qualquer commit que referencie novas tabelas:

```bash
# Via MCP ou CLI Supabase:
supabase gen types typescript --project-id ibgaywezfcbbiiziaoac > frontend/lib/database.types.ts
```

**Origem:** FC029 — 8 deploys consecutivos falharam por este motivo.

---

## Nova Estrutura da Sidebar (sessão 23 fim — DEFINITIVA)

```
Dashboard
Veículos
Interessados
Clientes              ← todos os planos (antes era Pro+)

─── Pro ───────────── gated has_crm
Atendimento (CRM)
Analytics

─── Premium ────────── gated has_automation
Automações
Campanhas

Assinatura            ← sub-nav: Assinatura / Add-ons / Cobranças / Planos
Configurações         ← sub-nav tabs: Loja / Contato Público / Usuários / Plano / WhatsApp
```

**Financeiro** tem sub-nav interno: Resumo / Vendas / Comissões

---

## Próximos Passos (por prioridade)

### 0-A. ~~Push pendente~~ — DEPLOYADO em 07/08/2026

Os 7 commits da sessão 64 foram enviados por autorização explícita do usuário.
`origin/main` = **`2ff7a96a8e3c2feccce5a17ef4db1fdd47152f96`**.

| Deploy | Resultado |
|---|---|
| **VPS / backend** (CI/CD run `31139702588`) | ✓ sucesso — test, build, deploy, containers healthy e smoke test aprovados |
| **Vercel / frontend** | ✓ no ar |
| `api.revendaclick.com.br/health` | ✓ `{"db":"ok","status":"ok"}` |
| 7 rotas da landing | ✓ todas HTTP 200 (`/`, `/revendas-pequenas`, `/multimarcas`, `/premium`, `/crm-automotivo`, `/erp-automotivo`, `/site-para-revendas`) |

> Anotação do pipeline (já conhecida, não bloqueia): actions com target Node.js 20 sendo forçadas
> para Node.js 24 — pendência registrada em `20_PENDENCIAS.md`.

**Ainda não verificado:** as rotas responderam 200, mas **nenhuma foi vista em browser**. A
conferência visual continua pendente.

### 0-B. ~~DECISÃO PENDENTE~~ — RESOLVIDO em D39, aguardando deploy

**Decidido pelo usuário (07/08/2026): canonizar em `app.revendaclick.com.br`.** Ver **D39** em
`21_DECISOES_TECNICAS.md`. Corrigido e commitado — **falta enviar**. Até o deploy, produção segue
com o defeito.

O que foi feito:

- Fonte única do host em `frontend/lib/site.ts` (`SITE_URL`, de `NEXT_PUBLIC_APP_URL`)
- `page.tsx`, `SegmentPage.tsx`, `sitemap.ts`, `robots.ts`, `layout.tsx` e `privacidade/page.tsx`
  passaram a consumir `SITE_URL` — nenhum host literal restou nos metadados
- Sitemap gera as 6 rotas de `Object.values(SEGMENTOS)`, sem lista paralela
- Achado extra: `privacidade/page.tsx` tinha o **mesmo defeito** de canonical, independente das
  landings novas

Registro do problema original (para contexto histórico):
Três defeitos, todos verificados ao vivo em 06/08/2026:

1. **As 6 rotas novas não estão no sitemap.** `frontend/app/sitemap.ts:9-13` tem lista estática com
   apenas `/`, `/privacidade`, `/terms` + vitrines dos tenants.
2. **Canonical e sitemap declaram hosts diferentes.** `SegmentPage.tsx:20` e `app/page.tsx:23` fixam
   `SITE = 'https://revendaclick.com.br'`; `sitemap.ts:7` usa `NEXT_PUBLIC_APP_URL`, que em produção
   é `https://app.revendaclick.com.br`.
3. **O canonical aponta para URL que nunca responde 200.** Testado:
   `revendaclick.com.br/privacidade` → 307 → `www.revendaclick.com.br/privacidade` → →
   `app.revendaclick.com.br/...` (redirect canônico do FC058).

**Decisão necessária do usuário — dois caminhos:**

| Opção | O que envolve |
|---|---|
| **(a) Canonizar em `app.`** | Só código: trocar `SITE` em `page.tsx` e `SegmentPage.tsx` para `NEXT_PUBLIC_APP_URL` e incluir as 6 rotas no `sitemap.ts` |
| **(b) Servir a landing no apex** | Mexe em domínio/Vercel: parar de redirecionar `revendaclick.com.br` → `app.` — exige autorização e cuidado com o FC058 (sessão entre subdomínios) |

### 0-C. AÇÃO COMERCIAL IMEDIATA — Landing lead real não atendido

Lead "Joaõ" (48998232010, São José/SC) em `landing_leads` com status `novo` desde 2026-06-04.
Acessar `/admin/leads` e atualizar status para `contatado` após primeiro contato.

---

### 1. ~~Verificar sidebar no browser em produção~~ (CONCLUÍDA — sessão 33)

Auditoria de código confirmou sidebar correta para santos-car (Pro):
- Pro section (Atendimento/Analytics) via `has_crm` ✓
- Premium section oculta (Pro não tem `has_automation`) ✓
- Sub-navs Financeiro/Assinatura/Configurações corretos ✓

### ~~1a. Uptime monitoring~~ (CONCLUÍDA — sessão 37)

Cron job `*/5 * * * *` ativo no VPS. Script `/opt/revendaclick/scripts/health-check.sh`.
Log em `/var/log/rc_health.log` + alertas via BetterStack.

### 1b. Verificar sidebar visualmente no browser (MÉDIA)

santos-car está em plano Pro. Testar:

| Perfil | Esperado |
|---|---|
| **santos-car (Pro)** | Dashboard/Veículos/Interessados/Clientes/Financeiro + seção Pro (Atendimento/Analytics) + Assinatura/Configurações |

Verificar:
- Financeiro → sub-nav mostrando Resumo/Vendas/Comissões
- Assinatura → sub-nav mostrando Assinatura/Add-ons/Cobranças/Planos
- Configurações → aba WhatsApp visível (5ª aba)

### 2. Preencher senhas no .env.e2e e executar E2E (Média)

Template criado em `frontend/.env.e2e`. Preencher `PREENCHER` com senhas reais:
- `E2E_PRO_PASSWORD` — senha do dilneysantos@gmail.com (santos-car)
- `E2E_SUPER_ADMIN_PASSWORD` — senha do dilneysantos.developer@gmail.com

> As variáveis `E2E_SANDBOX_*` foram removidas na sessão 64 junto com `TEST_USERS.sandbox`
> em `frontend/e2e/helpers/auth.ts` — nenhum spec as usava e o tenant nunca existiu.

Ver `frontend/e2e/README.md`.

### 3. Itens que exigem ação manual (Baixa)

**3a. Rotação de Secrets (política semestral):**
```
ASAAS_API_KEY, EVOLUTION_API_KEY, METRICS_TOKEN
Atualizar: /opt/revendaclick/.env no VPS + Asaas Dashboard + reiniciar containers
```

### 4. Etapas comerciais (próximas sessões)

- **FC048** — Próxima falha a registrar (se identificada)
- **Etapa 5 follow-up** — `AdminSimulateEvent` suportar `addon_type` param para simular webhooks de add-on direto pelo painel admin
- **Etapa 10** — Auditoria final (RLS, tenant isolation, TypeScript strict, Go vet)

### Backlog de Infraestrutura (adiado — FC044 — 13/06/2026)

> Itens abaixo foram deliberadamente adiados por decisão de negócio.
> Não bloqueiam operação, comercialização, onboarding ou estabilidade.
> Retomar quando houver justificativa comercial ou técnica.

| Item | Estado | Quando retomar |
|---|---|---|
| **Backup S3** | Container `rc_backup` pronto; scripts existem. Falta: vars no `.env` do VPS | Quando crescimento de dados justificar offsite |
| **BetterStack Alerts HTTP 500** | BetterStack ativo (logs); falta criar alerta de status >= 500 | Quando volume de usuários reais justificar monitoramento ativo |
| **Leaked Password Protection** | Requer Supabase Pro (HaveIBeenPwned.org) | Quando upgrade Supabase Pro for decidido por outros motivos |

### 5. Evolution schema isolado (Baixa — D19)

Configurar `DATABASE_SCHEMA=evolution` no docker-compose da Evolution. Ver D19 em `21_DECISOES_TECNICAS.md`.

---

## Documentação de Falhas

Pasta `docs-operacao/FalhasCorrigidas/` — **64 arquivos (FC001–FC059, FC061–FC066)**; não existe arquivo FC060. Além deles, o bug published_store (sem número FC — corrigido via migration 036, não foi incidente de produção).
Próximo número disponível: **FC067**.

Antes de diagnosticar qualquer problema: consultar primeiro o [README de FalhasCorrigidas](FalhasCorrigidas/README.md).

---

## GOVERNANÇA — Protocolo Obrigatório de Sessão

### Prompts operacionais oficiais

Localização: **pasta `/prompts/` na raiz do repositório**

| Arquivo | Quando usar |
|---|---|
| `prompts/00_PROMPT_INICIO_SESSAO.md` | **Obrigatório** no início de toda sessão |
| `prompts/01_PROMPT_ENCERRAMENTO_SESSAO.md` | **Obrigatório** ao encerrar toda sessão |
| `prompts/02_PROMPT_AUDITORIA.md` | Ao revisar módulo ou suspeitar de divergência |
| `prompts/03_PROMPT_BUG_CRITICO.md` | Imediatamente ao identificar bug/incidente |
| `prompts/04_PROMPT_DEPLOY.md` | Antes e após qualquer deploy em produção |

### Protocolo de Fim de Sessão

Toda sessão encerrada **deve** executar os seguintes passos antes do último commit:

### 1. Atualizar 22_HISTORICO_ALTERACOES.md
- Adicionar entrada com data, sessão e resumo das alterações
- Atualizar a tabela **ESTADO ATUAL POR FEATURE** no topo

### 2. Atualizar 23_PROXIMO_PASSO.md (este arquivo)
- Atualizar data no topo
- Atualizar tabela "Estado Atual do Projeto"
- Atualizar seção "Próximos Passos" com prioridades corretas

### 3. Atualizar Snapshot de Features
A tabela ESTADO ATUAL em `22_HISTORICO_ALTERACOES.md` deve refletir o estado real.
Nunca deixar features como "⚠ 404" se já foram implementadas.

### 4. Atualizar Memory (project_status.md)
Atualizar `/home/dilneysantos/.claude/projects/.../memory/project_status.md` com:
- Migrações aplicadas
- Features concluídas
- Pendências atuais

### 5. Mover itens obsoletos
Se algo deixou de ser válido (plano renomeado, serviço trocado, rota removida):
- Mover para a seção **OBSOLETO** em `MEMORY.md`
- Incluir: data, motivo, substituto

### 6. Verificar consistência
- `REFERENCE.md` reflete valores reais (migrations, FCs, URLs)?
- `CLAUDE.md` CURRENT STATUS ainda aponta para docs corretos?
- Algum arquivo diz "Coolify" quando deveria dizer "Vercel"?

---

## Contexto para a Próxima Sessão

**Desde a sessão 62, basta digitar o comando** (não é mais preciso copiar prompt):

```
/abrir-sessao      → inicia a sessão (equivale a prompts/00_PROMPT_INICIO_SESSAO.md)
/encerrar-sessao   → encerra a sessão (equivale a prompts/01_PROMPT_ENCERRAMENTO_SESSAO.md)
```

Demais comandos: `/checklist-dia`, `/auditoria`, `/novo-modulo`, `/registrar-decisao`, `/registrar-pendencia`.
Agentes: `revisor-codigo`, `auditor-governanca`, `documentador`, `gestor-memoria`, `planejador-arquitetura`.
Ver tabela completa em `CLAUDE.md`. Os arquivos de `prompts/` seguem válidos como referência.

**Os comandos não concedem autorização** — `.claude/02_AUTORIZACOES.md` continua valendo integralmente.

Ao iniciar uma nova sessão:

1. Executar `prompts/00_PROMPT_INICIO_SESSAO.md` (leitura + diagnóstico completo)
2. Ler `20_PENDENCIAS.md` — o que está pendente
3. Ler este arquivo (`23_PROXIMO_PASSO.md`) — o que fazer agora
4. Se for alterar banco: ver `05_SUPABASE.md` primeiro **e regenerar `database.types.ts` após migration**
5. Se for alterar infra: ver `10_INFRA_VPS.md` e `11_DOCKER.md`
6. Se for alterar backend: ver `04_BACKEND.md` e `08_API_ROTAS_REAIS.md`
7. Se for fazer deploy: executar `prompts/04_PROMPT_DEPLOY.md`

**ATENÇÃO landing em produção:** deploy feito em 07/08/2026 (`2ff7a96`). As 6 landings segmentadas
estão no ar, porém com o canonical apontando para um host que responde 307 e ausentes do sitemap.
Ver item 0-B acima — é a primeira coisa a resolver.

**ATENÇÃO chaves Asaas:** o billing depende **exclusivamente** de `/opt/revendaclick/.env` no VPS,
lido por `backend/internal/config/config.go:58-60`. O frontend **não lê `ASAAS_*`** (verificado:
zero `process.env.*ASAAS*` em `frontend/`). As variáveis existentes na Vercel não têm efeito — não
concluir que o billing depende delas. Ver D37.

**ATENÇÃO .env VPS:** Variáveis com `$` literal devem usar `$$`. Ver D18 em `21_DECISOES_TECNICAS.md`.

**ATENÇÃO Tailwind primary:** Agora usa `rgb(var(--primary) / α)`. Store layout injeta canais RGB do tenant. Ver D20 em `21_DECISOES_TECNICAS.md`.

**ATENÇÃO database.types.ts:** Regenerar após cada migration. Ver FC029.

**ATENÇÃO sidebar:** Nova estrutura definitiva — ver D28 em `21_DECISOES_TECNICAS.md`. Nunca usar `plan_name` hardcoded.
