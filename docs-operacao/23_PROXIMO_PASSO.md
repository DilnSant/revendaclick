# 23 — PRÓXIMO PASSO

> Atualizado em: 26/05/2026 (sessão 8)
> Atualizar este arquivo ao final de cada sessão com o que deve ser feito na próxima.

---

## Estado Atual do Projeto (sessão 8 — 26/05/2026)

Billing desbloqueado: 3 bugs em cascata identificados e corrigidos. Customer Asaas criado com CPF confirmado no DB. Confirmação end-to-end do subscribe pendente (token de teste expirou).

**ALERTA: trials expiram em 5 dias (2026-05-31) para santos-car e devecar**

- Backend Go → `https://api.revendaclick.com.br` ✓ (22/22 smoke test — sessão 7)
- Frontend Next.js → `https://app.revendaclick.com.br` ✓ (200 OK)
- CI/CD GitHub Actions → automático ✓
- Analytics → ✓ (revenue corrigido, plan gate OK)
- Nginx webhooks → ✓ rate limiting OK
- Evolution API → `https://evolution.revendaclick.com.br` ✓ (200 + 401 sem key)
- Billing Asaas → ✓ whitelist OK (production) | ✓ API key `$$` OK | ✓ SQL bug fixado | ⏳ subscribe end-to-end pendente
- Redis → ✓ (evolution depends_on healthcheck)
- Auth/Onboarding → ✓ signup → onboarding → JWT OK
- CRUDs → ✓ leads, vehicles, customers, users, sales, financial, audit
- Supabase → ✓ 0 advisors WARN
- Docs → ✓ sincronizadas

---

## ⚠️ AÇÃO PRIORITÁRIA (Primeira Coisa da Próxima Sessão)

### AÇÃO 1 — Confirmar billing subscribe end-to-end

O SQL bug (`UpdateSubscriptionAsaas`) foi corrigido e deployado (commit `71d6ba6`). O customer Asaas foi criado com CPF (`cus_000178453189`). Precisa de uma confirmação final com token fresco.

```bash
# 1. Fazer login com o usuário de teste (ou criar novo)
# O usuário billing-val-1779826935@revendaclick.dev existe no Supabase
# mas a senha não está salva — use dilneysantos@gmail.com ou crie novo usuário

# 2. Via API:
TOKEN="<jwt-fresco>"
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan_name":"pro","billing_cycle":"monthly","billing_type":"PIX","cpf_or_cnpj":"24971563792"}' \
  "https://api.revendaclick.com.br/api/billing/subscribe"

# Esperado: {"data": {"asaas_subscription_id": "sub_...", "asaas_payment_link": "..."}}
```

**IMPORTANTE:** O tenant de teste (`4d7845ac-7a15-4334-b49c-3d61eb3ee8cb`) já tem `asaas_customer_id = "cus_000178453189"`. O próximo subscribe vai direto para criação da subscription (sem recriar o customer).

Se retornar `asaas_subscription_id` preenchido → billing 100% funcional.

---

### AÇÃO 2 — Testar webhook Asaas (pós-subscribe)

Após confirmar subscribe, simular evento de pagamento para validar transição trial → active:

```bash
# Obter ASAAS_WEBHOOK_TOKEN no VPS
grep ASAAS_WEBHOOK_TOKEN /opt/revendaclick/.env

# Simular PAYMENT_CONFIRMED
WEBHOOK_TOKEN="<valor acima>"
ASAAS_SUB_ID="<asaas_subscription_id retornado no subscribe>"

curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: $WEBHOOK_TOKEN" \
  -d "{\"event\":\"PAYMENT_CONFIRMED\",\"payment\":{\"subscription\":\"$ASAAS_SUB_ID\",\"status\":\"CONFIRMED\",\"value\":97.00}}" \
  "https://api.revendaclick.com.br/api/webhooks/asaas"

# Verificar transição
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.revendaclick.com.br/api/billing/subscription" | python3 -m json.tool
# Esperado: "status": "active"
```

---

### AÇÃO 3 — Testar trials prestes a expirar (URGENTE — antes de 2026-05-31)

Tenants em risco:
- `santos-car` (dilneysantos@gmail.com): trial_ends_at = 2026-05-31
- `devecar` (dilneysantos.developer@gmail.com): trial_ends_at = 2026-05-31

Com billing agora funcional, estes usuários podem assinar. Confirmar no browser:
```
1. https://app.revendaclick.com.br/login
2. Login com dilneysantos@gmail.com
3. Menu → Billing/Planos → Assinar plano
4. Deve processar sem erro
```

---

## Próximos Passos (por prioridade)

### 1. Confirmar billing subscribe (Alta — próxima sessão)

Ver AÇÃO 1 acima. Um teste com token fresco é suficiente.

### 2. Testar fluxo completo de webhook (Alta)

Ver AÇÃO 2 acima. Necessário para validar transição de status.

### 3. Cancelamento e Reativação (Média)

```bash
# Cancel
curl -s -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  "https://api.revendaclick.com.br/api/billing/subscription"

# Reactivate
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "https://api.revendaclick.com.br/api/billing/reactivate"
```

### 4. Testar login em produção no browser (Baixa)

```
https://app.revendaclick.com.br/login → dilneysantos@gmail.com → /dashboard sem loop
```

### 5. Leaked Password Protection (Baixa — Supabase Dashboard)

```
Supabase Dashboard → Authentication → Settings → Security → "Leaked Password Protection" → ON
```

### 6. Backup S3 (Baixa)

```bash
# No VPS — adicionar ao .env
BACKUP_S3_BUCKET=meu-bucket-s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=sa-east-1
```

### 7. Uptime Monitoring (Baixa)

UptimeRobot ou BetterStack Uptime → URL: `https://api.revendaclick.com.br/health`

### 8. Rotação de Secrets (Baixa)

Política semestral: `ASAAS_API_KEY`, `EVOLUTION_API_KEY`, `METRICS_TOKEN`.

---

## Diagnóstico desta Sessão (sessão 8)

**3 bugs em cascata no billing — todos resolvidos:**

**Bug 1 — Whitelist no ambiente errado:**
- Whitelist aplicado em `sandbox.asaas.com` → backend usa `www.asaas.com` (production)
- Fix: adicionar `2.24.67.84` em `www.asaas.com`

**Bug 2 — Docker Compose double-interpolation da API key:**
- `.env` com `$$aact_prod_...` é correto. `sed` da sessão anterior havia removido um `$`, causando key vazia no container
- Diagnóstico: warning `The "aact_prod_000M..." variable is not set` nos logs do `docker compose up`
- Fix: `sed -i 's/^ASAAS_API_KEY=\$/ASAAS_API_KEY=\$\$/' /opt/revendaclick/.env` + restart
- Regra documentada em D18 em `21_DECISOES_TECNICAS.md`

**Bug 3 — `UpdateSubscriptionAsaas`: args SQL errados:**
- Query usava `$1, $3, $4, $5, $6` sem `$2`; args passavam `tenantID` duplicado
- pgx erro: `unused argument: 1` (índice 1 = segundo arg não referenciado)
- Fix: renumerar para `$1–$5`, remover `tenantID` duplicado
- Arquivo: `backend/internal/billing/repository.go` — commit `71d6ba6`

---

## Contexto para a Próxima Sessão

Ao iniciar uma nova sessão:

1. Ler `00_LEIA_PRIMEIRO.md` — visão geral do sistema
2. Ler `20_PENDENCIAS.md` — o que está pendente
3. Ler este arquivo (`23_PROXIMO_PASSO.md`) — o que fazer agora
4. Se for alterar banco: ver `05_SUPABASE.md` primeiro
5. Se for alterar infra: ver `10_INFRA_VPS.md` e `11_DOCKER.md`
6. Se for alterar backend: ver `04_BACKEND.md` e `08_API_ROTAS_REAIS.md`
7. Se for fazer deploy: ver `13_DEPLOY.md` e `12_CICD.md`

**ATENÇÃO .env VPS:** Variáveis que contêm `$` literal devem usar `$$` no `.env`. Ver D18 em `21_DECISOES_TECNICAS.md`.
