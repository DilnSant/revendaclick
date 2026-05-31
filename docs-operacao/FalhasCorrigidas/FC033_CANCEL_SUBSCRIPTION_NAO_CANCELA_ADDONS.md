---
id: FC033
título: Cancelamento da assinatura principal não cancela automaticamente subscription_addons
área: Billing / Add-ons
severidade: MÉDIA
prioridade: MÉDIA
bloqueante: NÃO
data: 2026-05-31
status: DOCUMENTADO (aguarda decisão de negócio)
---

# FC033 — CancelSubscription não cancela add-ons automaticamente

## Sintoma

Quando um tenant cancela a assinatura principal via `DELETE /api/billing/subscription`,
os add-ons ativos continuam com `status='active'` em `subscription_addons` e continuam
gerando cobranças recorrentes no Asaas.

## Causa Raiz

`CancelSubscription` chama `repo.CancelByTenantID` que executa:

```sql
UPDATE subscriptions SET status='canceled', canceled_at=NOW() WHERE tenant_id=$1
```

`subscription_addons` não é tocada. É uma decisão de arquitetura deliberada — add-ons e
assinatura principal são entidades independentes — mas falta a lógica de cascata.

## Impacto

- Tenant com assinatura cancelada pode continuar sendo cobrado pelos add-ons ativos.
- As features dos add-ons continuam disponíveis enquanto `subscription_addons.status='active'`.
- O `GetUsage` filtra por `subscriptions.status IN ('active','trialing','past_due')` — se a
  subscription principal estiver cancelada, o tenant não tem acesso ao dashboard de qualquer
  forma. O risco financeiro (cobrança Asaas) é real; o risco de acesso indevido é baixo.

## Decisão de Negócio Necessária

Três opções disponíveis:

**Opção A — Cancelar add-ons automaticamente com a assinatura**
```
CancelSubscription → CancelAddon para cada addon ativo do tenant
```
Risco: usuário perde add-ons sem aviso explícito.

**Opção B — Suspender add-ons (não cancelar no Asaas)**
```
CancelSubscription → subscription_addons.status='paused'
Se reativar assinatura → subscription_addons.status='active'
```
Add-ons pausados não cobram (Asaas subscription cancelada) mas podem ser restaurados.

**Opção C — Não fazer nada automaticamente**
```
Exibir aviso ao cancelar: "Você tem X add-ons ativos. Cancele-os manualmente para
evitar cobranças adicionais."
```
Usuário é responsável por cancelar cada add-on.

## Estado Atual

Nenhuma opção implementada. Decisão de negócio pendente.
Gap não bloqueia Etapa 5 — afeta apenas o fluxo de cancelamento total da conta,
que é raro e pode ser tratado manualmente pelo admin.

## Como Validar (Regressão)

```sql
-- Verificar se add-ons persistem após cancelamento do plano
SELECT sa.status, sa.asaas_addon_id
FROM subscription_addons sa
JOIN subscriptions s ON s.tenant_id = sa.tenant_id
WHERE s.status = 'canceled' AND sa.status = 'active';
-- Se retornar linhas: gap ainda existe
```

## Correção Futura

Implementar na Etapa de "Offboarding / Account Cancellation" (a definir).
Requer decisão entre Opção A, B ou C acima.
