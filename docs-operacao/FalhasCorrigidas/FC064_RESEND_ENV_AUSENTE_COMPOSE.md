# FC064 — RESEND_API_KEY não chegava ao container (ausente no docker-compose)

**Área:** Billing / Infra / Deploy
**Severidade:** MÉDIA
**Data:** 31/07/2026 – 01/08/2026
**Sessão:** 61

---

## Sintoma

Worker de lembrete de vencimento (`billing.StartDueReminderWorker`) ficava desabilitado
silenciosamente após qualquer redeploy do backend, mesmo com `RESEND_API_KEY` presente no `.env`
da VPS. Log: `"billing: RESEND_API_KEY not set, due-date reminder worker disabled"`.

## Causa Raiz

**Arquivo:** `docker-compose.production.yml`, serviço `backend`

O serviço `backend` usa uma **allowlist explícita** de variáveis em `environment:` — apenas o que
está listado ali chega ao container, independente do que existe em `.env`. `RESEND_API_KEY` e
`RESEND_FROM_EMAIL` foram adicionadas ao `.env` da VPS mas nunca à allowlist. Todo redeploy
(manual ou via CI, que sempre recria o container com `--force-recreate`/`up -d`) perdia as
variáveis silenciosamente — sem erro de deploy, só o log de warning no início do processo.

Mascarou o problema: um `docker compose ... up -d --force-recreate backend` manual, feito uma vez,
funcionou "por acaso" — não, na verdade não funcionou; o log não foi conferido a tempo e o
container seguinte (recriado automaticamente pelo pipeline de CI/CD no próximo push) voltou a
ficar sem a variável, revelando o problema real.

## Correção Aplicada

**Commit:** `aaf16f2`

```yaml
environment:
  # ...existentes...
  RESEND_API_KEY:         "${RESEND_API_KEY:-}"
  RESEND_FROM_EMAIL:      "${RESEND_FROM_EMAIL:-cobranca@revendaclick.com.br}"
```

## Como Validar

```bash
docker logs rc_backend --since 1m | grep -i resend
```
Não deve haver linha `RESEND_API_KEY not set`.

## Prevenção

Toda nova variável de ambiente usada pelo backend precisa ser adicionada tanto ao `.env` da VPS
**quanto** à allowlist `environment:` do serviço correspondente em `docker-compose.production.yml`
— checklist a seguir sempre que uma feature nova introduzir uma env var.
