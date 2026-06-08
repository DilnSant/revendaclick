# Feature Flags — Snapshot Atual

> Última atualização: 2026-06-08 (sessão 46 — FC038: auditoria final, correções ESLint, comentário Performance→Premium)
> Fonte de verdade: função `get_tenant_usage()` no Supabase (3-way UNION)

---

## Como as Flags São Calculadas

```sql
-- get_tenant_usage() faz 3-way UNION:
SELECT jsonb_agg(f) FROM plan.features          -- 1. features do plano
UNION ALL
SELECT jsonb_agg(f) FROM tenant_features        -- 2. overrides do tenant (admin)
UNION ALL
SELECT jsonb_agg(f) FROM active_addon.features  -- 3. features de add-ons ativos
```

O resultado é consolidado em um array único. A presença do nome já indica acesso.

---

## Mapa de Flags por Plano

| Feature Flag | Starter | Pro | Premium | Scale | Add-on |
|---|---|---|---|---|---|
| `has_financial` | ✓ | ✓ | ✓ | ✓ | — |
| `has_vendors` | ✓ | ✓ | ✓ | ✓ | — |
| `has_crm` | — | ✓ | ✓ | ✓ | — |
| `has_analytics` | — | ✓ | ✓ | ✓ | — |
| `has_whatsapp` | — | ✓ | ✓ | ✓ | — |
| `has_kanban` | — | ✓ | ✓ | ✓ | — |
| `has_automation` | — | — | ✓ | ✓ | — |
| `has_campaigns` | — | — | ✓ | ✓ | — |
| `has_central_atendimento` | — | — | ✓ | ✓ | `whatsapp_automation` |
| `has_whatsapp_qr` | — | — | ✓ | ✓ | (add-on futuro) |
| `has_ai_assistance` | — | — | ✓ | ✓ | — |
| `has_lead_recovery` | — | — | ✓ | ✓ | `ia_recovery` |
| `has_api_access` | — | — | — | ✓ | — |
| `has_white_label` | — | — | — | ✓ | — |

---

## Add-ons Disponíveis

| type (banco) | Feature concedida | Preço |
|---|---|---|
| `user_extra` | `max_users +1` | R$20/mês |
| `whatsapp_automation` | `has_central_atendimento` | R$39/mês |
| `ia_recovery` | `has_lead_recovery` | R$39/mês |

---

## Gates de Acesso na Sidebar

| Seção | Gate | Fallback se não tem |
|---|---|---|
| Base (Dashboard, Veículos, Interessados, Clientes, Financeiro) | Sempre | — |
| Pro (Atendimento, Analytics) | `has_crm` | Upgrade prompt "Desbloqueie com Pro" |
| Premium (Automações, Campanhas) | `has_automation` | Oculto (sem prompt) |
| Assinatura, Configurações | Sempre | — |

> **CORREÇÃO (sessão 33):** Gate Premium era `has_api_access` na documentação mas o código usa `has_automation`.
> `api_access` é feature exclusiva do plano Scale. `automation` está em Premium e Scale.
> Fonte: `DashboardShell.tsx` linha 259 + banco `plans.features`.

---

## Overrides Administrativos

O super_admin pode conceder flags individualmente via `/admin`:

```
POST /api/admin/tenant-features
{ "tenant_id": "...", "feature": "has_central_atendimento", "enabled": true }
```

Isso insere na tabela `tenant_features` e fica disponível via 3-way UNION imediatamente.

---

## Limites por Plano (estado atual)

| Limite | Starter | Pro | Premium | Scale |
|---|---|---|---|---|
| `max_vehicles` | 15 | 50 | 120 | -1 (ilimitado) |
| `max_users` | 2 | 5 | 15 | -1 |
| `max_leads` | 100 | 500 | -1 | -1 |

`-1` = sem limite. Verificado em tempo real via `get_tenant_usage()`.
