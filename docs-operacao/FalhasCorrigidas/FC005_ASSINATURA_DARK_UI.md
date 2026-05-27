# FC005 — Assinatura / Billing UI — Plano Starter sem botão de contratar

## Data

2026-05-27

## Severidade

BAIXA

## Sintoma

Na página de billing (`/settings` → aba Plano), o card do plano **Starter** não exibia nenhum botão de ação. Os cards de Pro e Premium tinham o botão "Assinar" normalmente. Parecia que o plano Starter estava quebrado ou indisponível.

> **Nota:** Este documento cobre também o comportamento geral de UI de billing que pode parecer "broken" para usuários do plano ativo. Para bug de assinatura dark mode (tema escuro), ver FC006 se criado futuramente.

## Contexto

O tenant `santos-car` tinha assinatura Starter **ativa** (`status=active`). A UI mostrava "Plano atual" apenas como texto simples sem qualquer elemento interativo, enquanto Pro e Premium tinham botões, criando assimetria visual.

## Causa Raiz

A condição de render do botão de plano:

```tsx
{isCurrentPlan && subscription?.status === 'active' ? (
  <span className="block text-center text-xs font-medium text-red-600">Plano atual</span>
) : (
  <button ...>Assinar</button>
)}
```

Quando `isCurrentPlan = true` e `status = 'active'`, o card exibia apenas um `<span>` de texto. Visualmente, o card do Starter ficava sem elemento interativo enquanto os outros dois tinham botões — aparência de bug para o usuário.

## Arquivos Afetados

- `frontend/app/(dashboard)/settings/_components/SettingsTabs.tsx` — componente `PlanTab`, render do card de plano

## Banco/Migrations

Nenhuma.

## Correção Aplicada

Substituído o `<span>` por um `<button disabled>` com estilo diferenciado, mantendo a semântica de "plano ativo" mas com consistência visual:

```tsx
// ANTES: texto simples sem botão
{isCurrentPlan && subscription?.status === 'active' ? (
  <span className="block text-center text-xs font-medium text-red-600">Plano atual</span>
) : (
  <button onClick={() => handleSubscribe(plan.name)} ...>Assinar</button>
)}

// DEPOIS: botão desabilitado com estilo de "ativo"
{isCurrentPlan && subscription?.status === 'active' ? (
  <button
    disabled
    className="w-full rounded-lg border border-red-300 bg-red-50 py-2 text-sm font-semibold text-red-700 cursor-default select-none"
  >
    Plano atual ✓
  </button>
) : (
  <button onClick={() => handleSubscribe(plan.name)} ...>Assinar</button>
)}
```

## Commit(s)

- `1d779c9a6fb2f4e67c06bff948c35f6546b5512f` — fix: plano atual mostra botao desabilitado em vez de texto simples

## Como Validar

```bash
# 1. Login com tenant em plano ativo (santos-car)
# https://app.revendaclick.com.br/settings → aba "Plano"

# 2. Verificar que:
# - Card Starter: botão desabilitado "Plano atual ✓" (fundo vermelho claro)
# - Card Pro: botão "Assinar" ativo
# - Card Premium: botão "Assinar" ativo

# 3. Login com tenant em trial (devecar)
# - Card Starter: botão "Renovar" ativo
# - Card Pro: botão "Assinar" ativo
# - Card Premium: botão "Assinar" ativo
```

## Resultado Final

Todos os três cards de plano exibem um elemento botão. O plano ativo exibe "Plano atual ✓" com estilo visual diferenciado (desabilitado, fundo vermelho claro). Outros planos exibem "Assinar" para upgrade.

## Risco de Regressão

**BAIXO.** A condição é simples. Risco: se alguém inverter a lógica por engano ao adicionar funcionalidade de "downgrade".

## Prevenção Futura

1. Ao alterar componentes de billing, verificar visualmente todos os estados: trial, active (cada plano), past_due, canceled.
2. Nunca renderizar `<span>` em lugar de um elemento interativo esperado pelo usuário — use `<button disabled>` com estilo adequado.
3. Ao adicionar plano de upgrade: o endpoint `/api/billing/upgrade` é necessário para trocar de plano sem cancelar — ver pendência em `20_PENDENCIAS.md`.
