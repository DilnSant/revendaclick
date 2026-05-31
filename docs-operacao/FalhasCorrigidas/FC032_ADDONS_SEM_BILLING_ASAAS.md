---
id: FC032
título: Add-ons ativados sem cobrança Asaas — billing não integrado
área: Billing / Add-ons
severidade: ALTA
data: 2026-05-31
status: DOCUMENTADO (não corrigido — gap intencional)
---

# FC032 — Add-ons sem cobrança Asaas

## Sintoma

Ao clicar em "Adicionar" em `/billing/addons`, o add-on é ativado imediatamente
sem gerar cobrança no Asaas. O campo `asaas_addon_id` na tabela `subscription_addons`
é sempre `NULL`.

## Causa Raiz

`ActivateAddon` em `backend/internal/billing/service.go` insere diretamente
na tabela `subscription_addons` sem chamar nenhum endpoint do Asaas.
Não existe implementação de `CreateAddonCharge` ou `CreateAddonSubscription`
no gateway Asaas.

```go
// service.go:ActivateAddon — nenhuma chamada ao Asaas
_, err := s.repo.ActivateAddon(ctx, sub.ID, addonType, 1)
// asaas_addon_id = NULL — campo nunca preenchido
```

## Impacto

- Add-ons `whatsapp_automation` (R$39/mês) e `ia_recovery` (R$39/mês) e
  `user_extra` (R$20/mês) são ativados sem cobrança.
- Receita potencial não é capturada no Asaas.
- `CancelAddon` também não cancela nada no Asaas.

## Estado Atual

Descoberto em auditoria da sessão 28 (31/05/2026).
Decisão operacional: **não corrigir agora** — requer Etapa 5 (billing gateway abstraction).
Santos-car está em modo dev_test_* sem cobrança real, então impacto imediato é zero.

## Correção Futura (Etapa 5)

1. Implementar `CreateAddonSubscription(addonType, tenantID) → asaasAddonID` no gateway Asaas
2. Chamar antes de `repo.ActivateAddon`; gravar `asaas_addon_id` retornado
3. Implementar `CancelAddonSubscription(asaasAddonID)` chamado por `CancelAddon`
4. Criar webhook handler para `PAYMENT_RECEIVED` de add-on (ativar após pagamento confirmado)
5. Idempotência: verificar se `asaas_addon_id` já existe antes de criar nova subscription

## Como Validar (Regressão)

```sql
-- Verificar se add-ons ainda têm asaas_addon_id NULL
SELECT addon_type, status, asaas_addon_id
FROM subscription_addons
WHERE tenant_id = 'fd1172f6-11e7-4555-8fe3-082fd1849587';
-- Esperado enquanto gap existe: asaas_addon_id IS NULL
-- Esperado após correção: UUID Asaas preenchido
```
