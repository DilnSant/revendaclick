# FC068 — `GET /api/usage` retornava 500 para tenant com assinatura cancelada

**Área:** Backend / Billing
**Severidade:** ALTA
**Data:** 21/08/2026
**Sessão:** 65 (auditoria técnica completa)

---

## Sintoma

`GET /api/usage` respondia **HTTP 500** para o tenant `santos-car` — o único tenant real em
produção hoje, com assinatura `canceled`. O frontend trata `!res.ok` como `null`, então o
dashboard (KPIs de uso, `PlanAlertBanner`) ficava **mudo silenciosamente**: nenhum erro visível na
tela, só ausência de dado.

---

## Causa Raiz

A query de `GetUsage` filtrava `subscriptions.status IN ('active', 'trialing', 'past_due')`. Um
tenant com assinatura `canceled` não batia nenhuma linha — `pgx.ErrNoRows` era repassado direto
para `response.InternalError(c)`, virando 500 em vez de um dado válido (o `subscription_status`
`canceled` é um estado de negócio legítimo, não um erro).

---

## Arquivos Afetados

`backend/internal/plans/handler.go`, `backend/internal/plans/repository.go`.

---

## Banco / Migrations

Nenhuma alteração de banco.

---

## Correção Aplicada

1. **Repository:** a query passou a buscar a assinatura **mais recente** do tenant, independente
   do status (`ORDER BY s.updated_at DESC LIMIT 1`, sem o `WHERE status IN (...)`), preservando o
   `subscription_status` real (`canceled` etc.) — o frontend já sabia exibi-lo, só nunca recebia o
   dado.
2. **Handler:** `pgx.ErrNoRows` genuíno (tenant sem nenhuma linha em `subscriptions`) agora
   responde **404 `no_subscription`**, em vez de 500 — só ocorre se um tenant não tiver passado
   pelo onboarding, mas deixa de ser tratado como erro interno.

---

## Commit(s)

```
5470998 fix(billing): GET /api/usage retornava 500 para assinatura cancelada
```

---

## Como Validar

```bash
# Antes: 500. Depois: 200 com subscription_status=canceled e contagens corretas.
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $JWT_SANTOS_CAR" \
  https://api.revendaclick.com.br/api/usage
```

---

## Resultado Final

Validado contra produção (leitura), com JWT real do tenant `santos-car`: antes **500**, depois
**200** com `subscription_status=canceled` e contagens de veículos/usuários/leads corretas.

---

## Risco de Regressão

**Baixo.** A mudança é estritamente mais permissiva (deixa de excluir um estado de negócio válido)
e o caso de erro genuíno (`ErrNoRows`) passou a ter tratamento explícito em vez de cair no genérico.

---

## Prevenção

1. Filtrar por status numa query de leitura de "estado atual" é um padrão arriscado quando o
   próprio status filtrado é parte do dado que se quer mostrar — se o status real cai fora do
   filtro, o resultado desaparece silenciosamente em vez de refletir a realidade.
2. `pgx.ErrNoRows` nunca deveria propagar direto para um 500 genérico sem primeiro considerar se é
   um estado esperado (nenhum registro ainda) — como já corrigido aqui.

---

## Relacionados

- Achado pela auditoria técnica completa da sessão 65 (`AUDITORIA_COMPLETA.md`), Fase 3 (execução
  real contra produção).
