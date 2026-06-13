# 23 — PRÓXIMO PASSO

> Atualizado em: 13/06/2026 (sessão 49 — FC043: Backup S3 Automatizado)
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

## Estado Atual do Projeto (sessão 48 — 11/06/2026)

| Componente | Status |
|---|---|
| **FC043 — Backup S3 Automatizado (sessão 49)** | ✓ **CONCLUÍDA** — `backup.sh` refatorado; compose atualizado; `restore-from-s3.sh` + `configure-s3-lifecycle.sh` criados |
| **FC042 — E2E Playwright selectors + skip guards (sessão 48)** | ✓ **CONCLUÍDA** — 7 arquivos corrigidos; `getByLabel` → `locator('#email')`; `isCredentialReady()`; spec 01 skip guard; tabs `a[href]`; display_names reais do DB; 9/9 aprovados em produção |
| **FC041 — Saneamento documental final (sessão 48)** | ✓ **CONCLUÍDA** — 4 arquivos corrigidos; count FC 38→40; próximo FC039→FC041; seções obsoletas removidas |
| **Auditoria comercial E2E** | ✓ **PRONTO PARA OPERAÇÃO COMERCIAL** — fluxo completo 12 etapas aprovadas |
| **santos-car billing** | ✓ **RESTAURADO** — estava `past_due`/`starter`; corrigido para `active`/`pro` via SQL (sessão 44) |
| **Tenants reais em produção** | ⚠️ `finalcar` (canceled) + `revenda-click` (trialing) — usuários reais identificados |
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
| **Landing page** | ✓ **CONGELADA** (sessão 31) | Fluxo principal completo; não adicionar features |
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

### 0. AÇÃO COMERCIAL IMEDIATA — Landing lead real não atendido

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
| **sandbox-revendaclick (Pro)** | Mesmo comportamento — tenant isolado para testes agressivos |

Verificar:
- Financeiro → sub-nav mostrando Resumo/Vendas/Comissões
- Assinatura → sub-nav mostrando Assinatura/Add-ons/Cobranças/Planos
- Configurações → aba WhatsApp visível (5ª aba)

### 2. Preencher senhas no .env.e2e e executar E2E (Média)

Template criado em `frontend/.env.e2e`. Preencher `PREENCHER` com senhas reais:
- `E2E_PRO_PASSWORD` — senha do dilneysantos@gmail.com (santos-car)
- `E2E_SUPER_ADMIN_PASSWORD` — senha do dilneysantos.developer@gmail.com
- `E2E_SANDBOX_PASSWORD` — criar usuário para sandbox-revendaclick via /register

Ver `frontend/e2e/README.md`.

### 3. Itens que exigem ação manual (Baixa)

**3a. Leaked Password Protection:**
```
Supabase Dashboard → Authentication → Settings → Security → "Leaked Password Protection" → ON
```

**3b. Uptime Monitoring:**
```
UptimeRobot ou BetterStack Uptime
URL: https://api.revendaclick.com.br/health
Alerta por email
```

**3c. Backup S3 (opcional — rc_backup container já existe):**
```bash
# No VPS /opt/revendaclick/.env:
BACKUP_S3_BUCKET=meu-bucket-s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=sa-east-1
```

**3d. Rotação de Secrets (política semestral):**
```
ASAAS_API_KEY, EVOLUTION_API_KEY, METRICS_TOKEN
Atualizar: /opt/revendaclick/.env no VPS + Asaas Dashboard + reiniciar containers
```

### 4. Etapas comerciais (próximas sessões)

- **FC044** — Próxima falha a registrar (se identificada)
- **Etapa 5 follow-up** — `AdminSimulateEvent` suportar `addon_type` param para simular webhooks de add-on direto pelo painel admin
- **Etapa 10** — Auditoria final (RLS, tenant isolation, TypeScript strict, Go vet)

### 5. Evolution schema isolado (Baixa — D19)

Configurar `DATABASE_SCHEMA=evolution` no docker-compose da Evolution. Ver D19 em `21_DECISOES_TECNICAS.md`.

---

## Documentação de Falhas

Pasta `docs-operacao/FalhasCorrigidas/` — **43 falhas documentadas (FC001–FC043)** + bug published_store (sem número FC — corrigido via migration 036, não foi incidente de produção).
Próximo número disponível: **FC044**.

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

**Copiar e executar ao iniciar:**

```
prompts/00_PROMPT_INICIO_SESSAO.md
```

**Copiar e executar ao encerrar:**

```
prompts/01_PROMPT_ENCERRAMENTO_SESSAO.md
```

Ao iniciar uma nova sessão:

1. Executar `prompts/00_PROMPT_INICIO_SESSAO.md` (leitura + diagnóstico completo)
2. Ler `20_PENDENCIAS.md` — o que está pendente
3. Ler este arquivo (`23_PROXIMO_PASSO.md`) — o que fazer agora
4. Se for alterar banco: ver `05_SUPABASE.md` primeiro **e regenerar `database.types.ts` após migration**
5. Se for alterar infra: ver `10_INFRA_VPS.md` e `11_DOCKER.md`
6. Se for alterar backend: ver `04_BACKEND.md` e `08_API_ROTAS_REAIS.md`
7. Se for fazer deploy: executar `prompts/04_PROMPT_DEPLOY.md`

**ATENÇÃO .env VPS:** Variáveis com `$` literal devem usar `$$`. Ver D18 em `21_DECISOES_TECNICAS.md`.

**ATENÇÃO Tailwind primary:** Agora usa `rgb(var(--primary) / α)`. Store layout injeta canais RGB do tenant. Ver D20 em `21_DECISOES_TECNICAS.md`.

**ATENÇÃO database.types.ts:** Regenerar após cada migration. Ver FC029.

**ATENÇÃO sidebar:** Nova estrutura definitiva — ver D28 em `21_DECISOES_TECNICAS.md`. Nunca usar `plan_name` hardcoded.
