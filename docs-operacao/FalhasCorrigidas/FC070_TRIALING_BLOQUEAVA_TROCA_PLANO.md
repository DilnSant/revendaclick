# FC070 — Assinatura em trial travava troca de plano e mostrava status desatualizado

**Área:** Backend / Billing / Frontend
**Severidade:** ALTA
**Data:** 23/08/2026
**Sessão:** 66

---

## Sintoma

Testando uma assinatura real na conta Asaas nova (`santos-car`, `sub_uz29bjmjf136znwx`, plano
Premium em `trialing`): todos os botões de troca de plano em `/billing/plans` abriam o **mesmo
link de pagamento** da assinatura já existente, em vez de iniciar upgrade para o plano clicado.
Além disso, o banner de status do dashboard continuava mostrando "Assinatura cancelada" mesmo
depois da assinatura já estar `trialing`.

---

## Causa Raiz

Três problemas encadeados:

1. `Subscription.ComputeFlags()` só marcava `IsActive = true` para `status == "active"`.
   `SubscriptionGate` (middleware) já tratava `trialing` como liberado, mas o struct não — então
   qualquer fluxo que checasse `IsActive` (ex.: elegibilidade de upgrade) rejeitava assinaturas em
   trial.
2. `Service.Subscribe()` tinha uma guarda contra assinatura duplicada que devolvia a assinatura
   **existente** em silêncio sempre que havia uma `active`/`trialing`, **mesmo se o plano pedido
   fosse diferente** do atual. Resultado: clicar em qualquer plano reabria o link de pagamento da
   assinatura antiga em vez de sinalizar que era preciso usar upgrade.
3. `PlanCard` (client component) não chamava `router.refresh()` após assinar/upgradar com sucesso
   — o banner de status, um Server Component no layout, continuava servindo a resposta cacheada da
   renderização anterior.

---

## Arquivos Afetados

`backend/internal/billing/model.go`, `backend/internal/billing/service.go`,
`frontend/app/(dashboard)/billing/plans/_components/PlanCard.tsx`.

---

## Banco / Migrations

Nenhuma alteração de banco.

---

## Correção Aplicada

1. `IsActive` passa a ser `status == "active" || status == "trialing"`.
2. A guarda de `Subscribe()` só devolve a assinatura existente em silêncio se for o **mesmo**
   plano (idempotência para clique duplo/retry). Para plano diferente, retorna erro explicando que
   é preciso usar upgrade ou cancelar a assinatura atual primeiro.
3. `PlanCard` chama `router.refresh()` depois de `handleSubscribe`/`handleUpgrade` bem-sucedidos.

---

## Commit(s)

```
915576e fix(billing): assinatura trialing travava troca de plano e enganava usuário
```

---

## Como Validar

```bash
cd backend && go test ./internal/billing/... -v
cd frontend && npm run type-check
```

Manual: com uma assinatura em `trialing`, clicar em outro plano em `/billing/plans` deve iniciar
upgrade (não reabrir o link antigo); o banner de status deve refletir o novo estado sem precisar
recarregar a página manualmente.

---

## Resultado Final

`go build`/`go vet`/`go test` limpos. Validado contra a conta Asaas real de produção
(`sub_uz29bjmjf136znwx`).

---

## Risco de Regressão

Baixo. `IsActive` incluir `trialing` alinha o struct com o que `SubscriptionGate` já fazia — não
introduz uma liberação nova, só remove uma inconsistência interna. A guarda de `Subscribe()` fica
mais estrita (antes deixava passar silenciosamente), então o único comportamento observável que
muda é: pedir um plano diferente do atual durante `active`/`trialing` agora retorna erro em vez de
reabrir o link antigo — que era exatamente o bug.

---

## Prevenção

Ao adicionar um novo status de assinatura (`ComputeFlags`), conferir se todos os pontos que
checam `IsActive`/`IsTrialing`/etc. concordam entre si — `SubscriptionGate` (middleware),
`Service` e frontend não podem ter três definições divergentes do que conta como "assinatura
liberada".

---

## Relacionados

- Descoberto durante o teste ponta a ponta de assinatura na conta Asaas nova, pendência aberta
  desde a sessão 64 (ver `20_PENDENCIAS.md`).
- **D40** (`21_DECISOES_TECNICAS.md`) — mesma sessão, estratégia de preços "Atratividade Máxima".
