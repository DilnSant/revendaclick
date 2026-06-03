# MEMORY — Nomenclatura e Estado do RevendaClick

> Arquivo in-repo para referência de agentes IA e desenvolvedores.
> Complementa `REFERENCE.md` (valores fixos) com nomenclatura e evolução histórica.
> Atualizar ao final de cada sessão conforme protocolo em `prompts/01_PROMPT_ENCERRAMENTO.md`.

---

## OBSOLETO

> Itens abaixo deixaram de ser válidos. Não usar para decisões técnicas ou de produto.
> Mantidos apenas como histórico para rastreabilidade.

| Data | Item obsoleto | Motivo | Substituído por |
|---|---|---|---|
| 2026-05-22 | Coolify como hospedagem do frontend | Migração descartada antes de ir a produção | Vercel (auto-deploy via GitHub push para `main`) |
| 2026-05-22 | `middleware.ts` no Next.js | Removido para corrigir loop de SSR (ver FC) | `frontend/lib/proxy.ts` |
| 2026-05-22 | Migração para FlutterFlow | Descartada antes de iniciar | Next.js continua como stack oficial (ver D12) |
| 2026-05-28 | Plano "Start" | Renomeado via migration 019 | `starter` (DB) / "Starter" (display) |
| 2026-05-28 | Plano "Performance" como display_name comercial | migration 024 reverteu renomeação; nome comercial oficial agora é "Premium" | `performance` (DB `plan.name` até migration 026) |
| 2026-05-30 | `performance` como `plan.name` no banco | migration 026 renomeou definitivamente para `premium` | `premium` — DB e nome comercial agora coincidem |
| 2026-05-30 | "Enterprise" como nome de plano | Nunca foi plan.name no banco; era apenas label de CTA no grid de planos | CTA "Enterprise" = grade pública; plan.name real = `scale` (oculto) |
| 2026-05-29 | super_admin com tenant_id preenchido | migration 025 tornou nullable para super_admin | `super_admin` tem `tenant_id = NULL` |
| 2026-05-30 | devecar como tenant operacional de referência | Evolution desconectado 28/05 (device_removed); não é loja real | Histórico apenas; novo tenant de ref.: `sandbox-revendaclick` (a criar) |
| 2026-05-30 | Central de Atendimento como item de menu principal | Removida da sidebar; WhatsApp é add-on separado | Aba "WhatsApp" em Configurações + `/whatsapp` via add-on |
| 2026-05-30 | Sidebar com Vendas/Comissões/Vendedores no nav | Sidebar refatorada | FinancialSubNav (sub-nav em /financial, /sales, /financial/commissions) |
| 2026-05-30 | "Compradores" como label de módulo | Renomeado para alinhamento com linguagem do domínio | "Clientes" — rota `/customers` |

---

## NOMENCLATURA ATUAL (2026-05-30)

### Planos

| DB name | Nome comercial (display) | Gate sidebar | Nota |
|---|---|---|---|
| `starter` | Starter | — (base) | Funcionalidades básicas |
| `pro` | Pro | `has_crm` | Seção Pro na sidebar |
| `premium` | **Premium** | `has_automation` | `plan.name = 'premium'` (migration 026 — definitivo) |
| `scale` | Scale | `has_api_access` | Oculto do grid; CTA "Enterprise" é label de grade, não plan.name |

> **CRÍTICO:** `plan.name` no banco é `premium` (migration 026 — definitivo). Nome comercial e nome interno coincidem.
> "Enterprise" nunca foi e nunca deve ser usado como `plan.name` — é apenas texto de CTA no grid público para o plano `scale`.

### Feature Flags (nomes exatos)

| Flag | Concedida por |
|---|---|
| `has_financial` | Starter+ |
| `has_vendors` | Starter+ |
| `has_crm` | Pro+ |
| `has_analytics` | Pro+ |
| `has_whatsapp` | Pro+ |
| `has_kanban` | Pro+ |
| `has_automation` | **Premium+** (gate do sidebar Premium) |
| `has_campaigns` | Premium+ |
| `has_central_atendimento` | Premium+ OU Add-on `whatsapp_automation` OU tenant_feature |
| `has_whatsapp_qr` | Premium+ OU Add-on |
| `has_ai_assistance` | Premium+ |
| `has_lead_recovery` | Premium+ OU Add-on `ia_recovery` |
| `has_api_access` | **Scale only** (não está em Premium) |
| `has_white_label` | Scale only |

> **CORREÇÃO (sessão 33):** `has_api_access` é Scale-only. Gate do sidebar Premium é `has_automation`.
> Verificado no banco: `plans.features` — Premium não contém `api_access`.

**Regra:** Nunca usar `plan_name === X` no frontend. Sempre feature flags.

### Módulos e Labels (corretos)

| Label correto | Label obsoleto | Rota | Nota |
|---|---|---|---|
| Clientes | Compradores | `/customers` | — |
| Interessados | Leads (como label de nav) | `/leads` | — |
| Atendimento | CRM (como label de nav) | `/crm` | — |
| Financeiro | — | `/financial` | Sub-nav: Resumo / Vendas (`/sales`) / Comissões (`/financial/commissions`) |
| Assinatura | Billing (como label de nav) | `/billing` | Sub-nav: Assinatura / Add-ons / Cobranças / Planos |
| Central de Atendimento | WhatsApp (menu principal) | `/whatsapp` | Add-on; Evolution API; distinto do WhatsApp da Loja |
| WhatsApp da Loja | — | Configurações → Contato Público | Número público; link `wa.me`; **não usa Evolution** |
| Automações | — | `/automations` | — |
| Campanhas | — | `/campaigns` | — |

### WhatsApp — dois conceitos distintos

| Conceito | Acesso | Tecnologia | Quem vê |
|---|---|---|---|
| **WhatsApp da Loja** | Configurações → Contato Público | Link `wa.me/{telefone}` (sem Evolution) | Qualquer visitante da vitrine `/:slug` |
| **Central de Atendimento** | `/whatsapp` (add-on ativo) | Evolution API v2.3.7 | Operadores internos; requer `has_central_atendimento` |

### Sidebar — Estrutura Definitiva

```
Dashboard
Veículos
Interessados
Clientes

─── Pro (has_crm) ──────────
Atendimento
Analytics

─── Premium (has_automation) ─
Automações
Campanhas

─── sempre visível ─────────
Assinatura   → sub-nav: Assinatura / Add-ons / Cobranças / Planos
Configurações → tabs: Loja / Contato Público / Usuários / Plano / WhatsApp
```

Financeiro sub-nav: Resumo (`/financial`) | Vendas (`/sales`) | Comissões (`/financial/commissions`)

### Infraestrutura

| Correto | Obsoleto |
|---|---|
| Vercel (frontend hosting) | Coolify |
| `frontend/lib/proxy.ts` | `frontend/middleware.ts` |
| `docker compose` (V2) | `docker-compose` (legado) |

---

## REGRAS QUE NÃO MUDAM

1. **Nunca usar `plan_name === X` no frontend** — sempre feature flags
2. **Regenerar `database.types.ts` após cada migration** (ver FC029)
3. **Variáveis com `$` literal no .env VPS devem usar `$$`** (ver D18)
4. **RLS obrigatório** em todas as tabelas de negócio
5. **tenant_id em toda tabela de negócio** (nunca cross-tenant)
6. **Sidebar gate Pro = `has_crm`; Premium = `has_automation`** (ver D28)
7. **Add-ons são cobrados separadamente** da assinatura principal
8. **WhatsApp automação é add-on**, não funcionalidade de plano
9. **`plan.name = 'premium'` no banco (migration 026 — definitivo)** — DB e nome comercial coincidem; nunca usar `performance` como plan.name
10. **WhatsApp da Loja** (Contato Público) ≠ **Central de Atendimento** (Evolution/add-on) — são conceitos distintos
11. **Financeiro incorpora Vendas e Comissões** via sub-nav — não são módulos separados na sidebar
12. **Assinatura incorpora Add-ons** via sub-nav — `/billing/addons` é acessado pelo BillingSubNav
13. **Leaked Password Protection indisponível no Supabase Free** — requer upgrade para Supabase Pro (HaveIBeenPwned.org). Não é erro de implementação; sem correção necessária no RevendaClick.
