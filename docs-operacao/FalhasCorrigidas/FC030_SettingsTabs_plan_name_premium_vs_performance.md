# FC030 — SettingsTabs: name:'premium' não casava com DB 'performance'

**Data:** 2026-05-30 (sessão 25)
**Severidade:** Médio — funcionalidade de renovação/assinatura silenciosamente quebrada

---

## Sintoma

Na tela Configurações → aba Plano, o botão de renovação/assinatura para o plano Performance nunca exibia o estado "Plano atual" nem "Renovar" para tenants com plano Performance ativo.

O botão aparecia como "Começar agora" mesmo para o tenant já assinante do plano.

---

## Causa Raiz

**Arquivo:** `frontend/app/(dashboard)/settings/_components/SettingsTabs.tsx`
**Linha:** 670
**Expressão:**

```tsx
const PLANS_LOCAL = [
  { name: 'starter', ... },
  { name: 'pro', ... },
  { name: 'premium', ... },  // ← 'premium' hardcoded
]
// ...
const isCurrentPlan = subscription?.plan_name === plan.name
// subscription.plan_name = 'performance'  (vinha do banco)
// plan.name = 'premium'                   (hardcoded local)
// resultado: false — nunca ativo
```

O banco retornava `plan_name = 'performance'` mas o objeto local usava `name: 'premium'`. A comparação sempre retornava `false`.

**Tabela afetada:** `plans` (`name TEXT`)
**Função afetada:** comparação `subscription?.plan_name === plan.name`

---

## Impacto

- Tenant com plano Performance via Asaas: botão de renovação nunca mostrava "Plano atual"
- UX enganosa: parecia que o tenant poderia assinar novamente o mesmo plano
- Sem impacto em dados ou billing — apenas exibição incorreta

---

## Correção

Migration 026 renomeou `plans.name` de `'performance'` para `'premium'` no banco.

Após a migration, `subscription.plan_name = 'premium'` e `plan.name = 'premium'` — a comparação passa a ser correta sem alteração de código no SettingsTabs.

---

## Prevenção

- Nunca usar strings de plan_name hardcoded em objetos locais de frontend
- Carregar lista de planos sempre via API (`GET /api/billing/plans`) em vez de objetos estáticos
- Regra D29: `plan.name` = `plan.display_name` = `'premium'` — sem divergência DB/UX
