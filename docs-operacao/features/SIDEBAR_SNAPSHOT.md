# Sidebar — Snapshot Atual

> Última atualização: 2026-06-05 (sessão 41 enc. — logo sidebar 64px→110px, mobile 40px→56px)
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

## Tema Visual (sessão 40)

| Elemento | Classe Tailwind | Valor |
|---|---|---|
| Sidebar background | `bg-gray-900` | `#111827` |
| Sidebar border | `border-white/[0.07]` | branco 7% opacidade |
| Mobile topbar | `bg-gray-900/90 backdrop-blur` | 90% + blur |
| Desktop topbar | `bg-gray-900/90 backdrop-blur` | 90% + blur |
| Logo container (sidebar) | `border border-primary/30 rounded-xl p-1.5 bg-white/[0.04]` | frame elegante |
| Logo container (mobile) | `border border-primary/30 rounded-lg p-1 bg-white/[0.04]` | frame menor |
| Logo height sidebar | `110px` | +72% vs anterior 64px (sessão 41 enc.) |
| Logo height mobile | `56px` | +40% vs anterior 40px (sessão 41 enc.) |
| Nav item ativo | `bg-primary/20 text-primary` | cor da loja (via --primary) |
| Nav item hover | `hover:bg-white/10 hover:text-white` | efeito discreto |
| User footer border | `border-white/10` | separador sutil |

---

## Regras de Implementação

1. **Nunca usar `plan_name` para gate de acesso** — usar feature flags
2. **Upgrade prompt só para seção Pro** — seção Premium é oculta se não tem acesso
3. **Vendedores não está mais no nav** — acessível via Configurações → Usuários → "Vendedores →"
4. **WhatsApp não está mais no nav** — acessível via Configurações → aba WhatsApp
5. **Central de Atendimento** — requer add-on `whatsapp_automation` (`has_central_atendimento`)
6. **Dark theme** — sidebar/topbars sempre escuros independente do tema do tenant; apenas cor primária varia
