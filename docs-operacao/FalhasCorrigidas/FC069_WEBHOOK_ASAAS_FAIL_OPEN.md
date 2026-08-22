# FC069 — Webhook Asaas aceitava requisição não autenticada se o token não estivesse configurado

**Área:** Backend / Billing / Segurança
**Severidade:** MÉDIA
**Data:** 22/08/2026
**Sessão:** 65 (continuação — risco documentado na auditoria, resolvido mediante autorização)

---

## Sintoma

Nenhum sintoma observado em produção — `ASAAS_WEBHOOK_TOKEN` está configurado corretamente no VPS
hoje. O achado é de **risco de configuração**: se a variável de ambiente algum dia ficasse vazia
(env perdida num redeploy, erro de digitação, etc. — mesma classe de risco do FC064), o endpoint
passaria a aceitar **qualquer payload não autenticado** como evento de billing real, sem que nada
sinalizasse o problema.

---

## Causa Raiz

`Handler.Webhook` só validava o header `asaas-access-token` **se** `h.asaasToken != ""`:

```go
// antes
if h.asaasToken != "" {
    if c.GetHeader("asaas-access-token") != h.asaasToken {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
        return
    }
}
```

Token vazio pulava a validação inteira — comportamento **fail-open**: ausência de configuração
virava ausência de segurança, em vez de rejeição segura.

---

## Arquivos Afetados

`backend/internal/billing/handler.go`, `backend/internal/billing/billing_test.go`.

---

## Banco / Migrations

Nenhuma alteração de banco.

---

## Correção Aplicada

Invertida a lógica para **fail-closed**: se o token não está configurado, o endpoint responde
**500** e rejeita a requisição, em vez de aceitar tudo.

```go
// depois
if h.asaasToken == "" {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "webhook not configured"})
    return
}
if c.GetHeader("asaas-access-token") != h.asaasToken {
    c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
    return
}
```

Sem mudança de comportamento em produção — o token já está configurado corretamente lá; a correção
só muda o que acontece se ele um dia deixar de estar.

Dois testes novos cobrindo os dois casos (`TestWebhookFailsClosedWhenTokenNotConfigured`,
`TestWebhookRejectsInvalidToken`), construindo `Handler` diretamente por struct literal (sem
depender de `Service`/banco), possível porque a checagem de token agora retorna antes de tocar em
`h.svc`.

---

## Commit(s)

```
43f7d0d fix(billing): webhook Asaas falha fechado se token não estiver configurado
```

---

## Como Validar

```bash
cd backend && go test ./internal/billing/... -run TestWebhook -v
```

---

## Resultado Final

`go build`/`go vet`/`go test ./...` limpos antes e depois. Nenhuma mudança de comportamento
observável em produção (token continua configurado); rede de segurança para o cenário de
configuração perdida agora existe.

---

## Risco de Regressão

**Nenhum conhecido.** Mudança estritamente mais restritiva num caso que hoje nunca ocorre em
produção (token sempre presente).

---

## Prevenção

1. Qualquer verificação de segurança condicionada a "se a env estiver configurada" deve ser
   fail-closed por padrão — ausência de configuração é motivo para rejeitar, não para pular a
   verificação.
2. Mesma classe de risco do FC064 (env perdida num redeploy) — reforça a importância de validar,
   em qualquer endpoint com token de webhook, o que acontece quando a env não existe.

---

## Relacionados

- Achado pela auditoria técnica completa da sessão 65 (`AUDITORIA_COMPLETA.md`), Fase 6
  (segurança), documentado como risco e resolvido nesta sessão mediante autorização explícita do
  usuário para os riscos pendentes da auditoria.
- **FC064** — mesma classe de risco (env perdida em redeploy), projeto BeautyNow.
