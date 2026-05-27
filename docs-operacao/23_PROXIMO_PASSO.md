# 23 — PRÓXIMO PASSO

> Atualizado em: 27/05/2026 (sessão 13)
> Atualizar este arquivo ao final de cada sessão com o que deve ser feito na próxima.

---

## Estado Atual do Projeto (sessão 13 — 27/05/2026)

**ALERTA: devecar trial expira 2026-05-31 (4 dias)**

- Backend Go → `https://api.revendaclick.com.br` ✓ (commit fa18153 — filtros públicos + backend search/sort/fuel)
- Frontend Next.js → `https://www.revendaclick.com.br` ✓ (vitrine profissional + settings personalização)
- CI/CD GitHub Actions → automático ✓
- Vehicle detail → ✓ HTTP 200 (features null fix — commit 2ee68ab)
- Public store → ✓ filtros chip + busca + ordenação + paginação + logo hero
- Settings loja → ✓ logo upload + cor primária + cidade/estado
- Billing plans → ✓ badge status + trial days + renewal date
- Evolution API → `https://evolution.revendaclick.com.br` ✓ v2.3.7
- Billing Asaas → ✓ subscribe end-to-end | ✓ guard re-subscribe OK
- WhatsApp QR → ✓ FUNCIONAL
- Supabase → ✓ migration 014 (logos bucket) aplicada

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

### AÇÃO 2 — Validar QR Code WhatsApp no browser

QR está sendo gerado (confirmado via API). Validar fluxo visual:
```
1. https://app.revendaclick.com.br/whatsapp
2. Clicar "Conectar WhatsApp"
3. QR deve aparecer e permanecer visível (não sumir após 5s)
4. Badge deve mostrar "Conectando…"
5. Escanear com WhatsApp → status muda para "Conectado"
```

### AÇÃO 3 — Inicializar devecar instance no Evolution

O tenant `devecar` (dilneysantos.developer@gmail.com) tem instance `close` na Evolution.
Após login e assinatura, conectar WhatsApp em /whatsapp.

```bash
# Diagnóstico VPS se necessário:
curl -s http://localhost:8081/instance/fetchInstances -H "apikey: revendaclick123" | python3 -m json.tool
curl -s http://localhost:8081/instance/connect/devecar -H "apikey: revendaclick123" | python3 -c "import json,sys; d=json.load(sys.stdin); print('count:', d.get('count'), 'len:', len(d.get('base64','')))"
```

---

## Documentação de Falhas

Pasta `docs-operacao/FalhasCorrigidas/` criada na sessão 12 com **23 falhas documentadas (FC001–FC023)**.

Antes de diagnosticar qualquer problema: consultar primeiro o [README de FalhasCorrigidas](FalhasCorrigidas/README.md).

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

## Diagnóstico desta Sessão (sessão 11)

**8 bugs em cascata na Evolution API — todos resolvidos:**

**Bug 4 — CACHE_REDIS_ENABLED=true com Redis vazio:**
- Redis estava habilitado mas vazio → hypothesis foi invalidada (não era a causa raiz)
- Fix: `CACHE_REDIS_ENABLED=false` (correto mesmo que não fosse a causa)

**Bug 5 — DATABASE_ENABLED=true ausente:**
- beautynow tem `DATABASE_ENABLED=true`; rc_evolution não tinha → instance status sem efeito
- Fix: adicionado `DATABASE_ENABLED: "true"` no docker-compose.production.yml

**Bug 6 — EVOLUTION_DATABASE_URL incompleto (faltava :5432/postgres):**
- Fix: `sed -i` no VPS .env para incluir porta e database name

**Bug 7 — Imagem Evolution 14 meses defasada:**
- `atendai/evolution-api:latest` buildado em 2025-02-03 → Baileys não inicializava (silent failure)
- beautynow usa `evoapicloud/evolution-api:v2.3.7` (mesmo VPS) → funciona
- Fix: alterar imagem para `evoapicloud/evolution-api:v2.3.7`

**Bug 8 — parser fetchInstances incompatível com v2.3.7 (flat vs nested):**
- v2.2.3: `[{instance:{instanceName,...}}]`, v2.3.7: `[{name,...}]`
- Fix: parser dual-format em GetInstanceStatus (service.go)

**Bug 9 — webhook 401 (Evolution v2.3.7 envia empty apikey header):**
- Fix: bypass validação para IPs internos Docker (10.x, 172.x, 192.168.x)

**Bug 10 — VPS docker-compose com changes sujos bloqueando git pull do CI/CD:**
- Deploy steps falhando em 5-6s por dirty working tree
- Fix: `git checkout docker-compose.production.yml && git pull` no VPS

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
