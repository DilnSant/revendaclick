# Sidebar — Snapshot Atual

> Última atualização: 2026-06-03 (sessão 37 — gate Premium corrigido: has_api_access → has_automation)
> Implementado em: `frontend/components/layout/DashboardShell.tsx`
> Decisão técnica: D28 em `21_DECISOES_TECNICAS.md`

---

## Estrutura Definitiva

```
┌─────────────────────────────────────────┐
│  [Logo do tenant]                       │
│                                         │
│  Dashboard            /dashboard        │
│  Veículos             /vehicles         │
│  Interessados         /leads            │
│  Clientes             /customers        │
│  Financeiro           /financial        │  → sub-nav: Resumo / Vendas / Comissões
│                                         │
│  ─── Pro ─────────── (has_crm) ───────  │
│  Atendimento          /crm              │
│  Analytics            /analytics        │
│                                         │
│  ─── Premium ─────── (has_automation)── │
│  Automações           /automations      │
│  Campanhas            /campaigns        │
│                                         │
│  ─── sempre visível ─────────────────── │
│  Assinatura           /billing          │  → sub-nav: Assinatura / Add-ons / Cobranças / Planos
│  Configurações        /settings         │  → tabs: Loja / Contato Público / Usuários / Plano / WhatsApp
└─────────────────────────────────────────┘
```

---

## Gates de Acesso

| Seção | Condição | Comportamento sem acesso |
|---|---|---|
| Base | Qualquer plano ativo | Sempre visível |
| Pro | `features.has_crm === true` | Substituído por upgrade prompt |
| Premium | `features.has_automation === true` | Seção oculta (sem prompt) |
| Assinatura / Configurações | Sempre | Sempre visível |

---

## Sub-navegações

### FinancialSubNav
Componente: `frontend/components/financial/FinancialSubNav.tsx`

| Tab | Rota | Active key |
|---|---|---|
| Resumo | `/financial` | `resumo` |
| Vendas | `/sales` | `vendas` |
| Comissões | `/financial/commissions` | `comissoes` |

Usado em: `/financial`, `/sales`, `/financial/commissions`

### BillingSubNav
Componente: `frontend/components/billing/BillingSubNav.tsx`

| Tab | Rota | Active key |
|---|---|---|
| Assinatura | `/billing` | `subscription` |
| Add-ons | `/billing/addons` | `addons` |
| Cobranças | `/billing/history` | `history` |
| Planos | `/billing/plans` | `plans` |

Usado em: `/billing`, `/billing/addons`, `/billing/history`, `/billing/plans`

### SettingsTabs
Componente: `frontend/app/(dashboard)/settings/_components/SettingsTabs.tsx`

| Tab | Conteúdo |
|---|---|
| Loja | Nome, logo, cor, slug |
| Contato Público | Telefone, WhatsApp público da vitrine |
| Usuários | Equipe + link "Vendedores →" |
| Plano | Status da assinatura |
| WhatsApp | Link Central de Atendimento + CTA add-on |

---

## Regras de Implementação

1. **Nunca usar `plan_name` para gate de acesso** — usar feature flags
2. **Upgrade prompt só para seção Pro** — seção Premium é oculta se não tem acesso
3. **Vendedores não está mais no nav** — acessível via Configurações → Usuários → "Vendedores →"
4. **WhatsApp não está mais no nav** — acessível via Configurações → aba WhatsApp
5. **Central de Atendimento** — requer add-on `whatsapp_automation` (`has_central_atendimento`)
