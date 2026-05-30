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
| 2026-05-28 | Plano "Performance" como nome do plano 3 | Renomeado de volta via migration 024 (revert do 022) | `performance` (DB name) / "Premium" (label sidebar gate) |
| 2026-05-29 | super_admin com tenant_id preenchido | migration 025 tornou nullable para super_admin | `super_admin` tem `tenant_id = NULL` |
| 2026-05-30 | devecar como tenant operacional de referência | Evolution desconectado 28/05 (device_removed); não é loja real | Histórico apenas; novo tenant de ref.: `sandbox-revendaclick` (a criar) |
| 2026-05-30 | Central de Atendimento como item de menu principal | Removida da sidebar; WhatsApp é add-on separado | Aba "WhatsApp" em Configurações + `/whatsapp` via add-on |
| 2026-05-30 | Sidebar com Vendas/Comissões/Vendedores no nav | Sidebar refatorada | FinancialSubNav (sub-nav em /financial, /sales, /financial/commissions) |
| 2026-05-30 | "Compradores" como label de módulo | Renomeado para alinhamento com linguagem do domínio | "Clientes" — rota `/customers` |

---

## NOMENCLATURA ATUAL (2026-05-30)

### Planos

| DB name | Display name (UI) | Gate sidebar | Nota |
|---|---|---|---|
| `starter` | Starter | — (base) | Funcionalidades básicas |
| `pro` | Pro | — | Gate `has_crm` libera seção Pro na sidebar |
| `performance` | Performance (billing) / "Premium" (sidebar label) | `has_api_access` | Nome DB = `performance`; sidebar chama de "Premium" |
| `scale` | Scale | — | Oculto do grid público |

> **ATENÇÃO:** O banco usa `performance` como `plan.name`. O label de UX da seção sidebar é "Premium".
> Nunca confundir: `plan_name === 'performance'` (banco) vs `has_api_access` (gate de feature).

### Feature Flags (nomes exatos)

| Flag | Concedida por |
|---|---|
| `has_financial` | Starter+ |
| `has_vendors` | Starter+ |
| `has_crm` | Pro+ |
| `has_analytics` | Pro+ |
| `has_whatsapp` | Pro+ |
| `has_kanban` | Pro+ |
| `has_api_access` | Performance+ |
| `has_white_label` | Performance+ |
| `has_central_atendimento` | Add-on `whatsapp_automation` |
| `has_whatsapp_qr` | Add-on |
| `has_lead_recovery` | Add-on `ia_recovery` |

**Regra:** Nunca usar `plan_name === X` no frontend. Sempre feature flags.

### Módulos e Labels (corretos)

| Label correto | Label obsoleto | Rota |
|---|---|---|
| Clientes | Compradores | `/customers` |
| Interessados | Leads (como label de nav) | `/leads` |
| Atendimento | CRM (como label de nav) | `/crm` |
| Financeiro | — | `/financial` |
| Central de Atendimento | WhatsApp (menu principal) | `/whatsapp` |
| Automações | — | `/automations` |
| Campanhas | — | `/campaigns` |

### Sidebar — Estrutura Definitiva

```
Dashboard
Veículos
Interessados
Clientes

─── Pro (has_crm) ──────────
Atendimento
Analytics

─── Premium (has_api_access) ─
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
6. **Sidebar gate Pro = `has_crm`**, Premium = `has_api_access`** (ver D28)
7. **Add-ons são cobrados separadamente** da assinatura principal
8. **WhatsApp automação é add-on**, não funcionalidade de plano
