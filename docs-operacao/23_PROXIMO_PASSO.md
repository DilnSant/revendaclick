# 23 — PRÓXIMO PASSO

> Atualizado em: 27/05/2026 (sessão 10)
> Atualizar este arquivo ao final de cada sessão com o que deve ser feito na próxima.

---

## Estado Atual do Projeto (sessão 10 — 27/05/2026)

Billing e WhatsApp QR Code **corrigidos e deployados**. Commit `3248b30` em CI/CD.

**ALERTA: devecar trial expira 2026-05-31 (4 dias)**

- Backend Go → `https://api.revendaclick.com.br` ✓ (22/22 smoke test — sessão 7)
- Frontend Next.js → `https://app.revendaclick.com.br` ✓ (200 OK)
- CI/CD GitHub Actions → automático ✓
- Analytics → ✓ (revenue corrigido, plan gate OK)
- Nginx webhooks → ✓ rate limiting OK
- Evolution API → `https://evolution.revendaclick.com.br` ✓ (200 + 401 sem key)
- Billing Asaas → ✓ whitelist OK | ✓ API key OK | ✓ SQL bug fixado | ✓ subscribe end-to-end confirmado | ✓ guard re-subscribe OK
- WhatsApp QR → ✓ 3 bugs corrigidos: condição frontend, handleRefreshQR, normalização "close"→"disconnected"
- Redis → ✓ (evolution depends_on healthcheck)
- Auth/Onboarding → ✓ signup → onboarding → JWT OK
- CRUDs → ✓ leads, vehicles, customers, users, sales, financial, audit
- Supabase → ✓ 0 advisors WARN
- Docs → ✓ sincronizadas

---

## ⚠️ AÇÃO PRIORITÁRIA (Primeira Coisa da Próxima Sessão)

### AÇÃO 1 — Assinar devecar antes de 2026-05-31 (URGENTE)

Trial de `dilneysantos.developer@gmail.com` expira **2026-05-31**. Sem `asaas_customer_id` — será criado no primeiro subscribe.

```
1. https://app.revendaclick.com.br/login
2. Login com dilneysantos.developer@gmail.com
3. Menu → Billing/Planos → Assinar Starter → PIX → informar CPF
4. Esperado: subscription criada, status trialing/active
```

### AÇÃO 2 — Validar QR Code WhatsApp no browser (pós-deploy commit 3248b30)

Após CI/CD deployar:
```
1. https://app.revendaclick.com.br/whatsapp
2. Clicar "Conectar WhatsApp"
3. QR deve aparecer e permanecer visível (não sumir após 5s)
4. Badge deve mostrar "Conectando…"
5. Escanear com WhatsApp → status muda para "Conectado"
```

### AÇÃO 3 — Verificar VPS Evolution (diagnóstico complementar, se QR ainda não aparecer)

```bash
# No VPS:
docker logs rc_evolution --tail 100 | grep -i "santos-car\|error\|qr"
curl -s http://localhost:8081/instance/fetchInstances -H "apikey: $EVOLUTION_API_KEY" | python3 -m json.tool
curl -s http://localhost:8081/instance/connect/santos-car -H "apikey: $EVOLUTION_API_KEY" | python3 -m json.tool
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
