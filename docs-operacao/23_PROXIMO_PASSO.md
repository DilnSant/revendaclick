# 23 — PRÓXIMO PASSO

> Atualizado em: 28/05/2026 (sessão 15)
> Atualizar este arquivo ao final de cada sessão com o que deve ser feito na próxima.

---

## Estado Atual do Projeto (sessão 15 — 28/05/2026)

**⚠️ ALERTA: devecar trial expira 2026-05-31 (3 dias)**

| Componente | Status |
|---|---|
| Backend Go | ✓ healthy — `https://api.revendaclick.com.br` |
| Frontend Next.js | ✓ deploy commit `81eceb5` — `https://app.revendaclick.com.br` |
| Vitrine pública | ✓ sem header duplo, cores tenant dinâmicas |
| CI/CD GitHub Actions | ✓ automático — 22/22 smoke test PASS |
| Vehicle detail `/[slug]/[vehicleSlug]` | ✓ HTTP 200 |
| Settings loja | ✓ logo + cor primária + cidade/estado |
| Billing plans | ✓ trial permite assinar (fix sessão 15) |
| Evolution API v2.3.7 | ✓ healthy — migrations Prisma aplicadas |
| Billing Asaas | ✓ subscribe end-to-end + guard re-subscribe |
| WhatsApp instâncias | ⚠️ resetadas na sessão 14 — reconectar santos-car |
| Supabase security advisors | ✓ limpos (migrations 015-017) |
| FalhasCorrigidas | ✓ 28 FCs documentadas (FC001–FC028) |

---

## ⚠️ AÇÕES PRIORITÁRIAS

### AÇÃO 1 — Reconectar WhatsApp santos-car (URGENTE)

As instâncias Evolution foram perdidas durante a limpeza do banco (sessão 14 — ver FC028).
Reconectar antes de qualquer teste de fluxo de leads.

```
1. https://app.revendaclick.com.br/whatsapp
2. Login com dilneysantos@gmail.com (conta santos-car)
3. Clicar "Conectar WhatsApp"
4. QR aparece → escanear com o celular
5. Status muda para "Conectado"
```

```bash
# Diagnóstico VPS se necessário:
ssh root@2.24.67.84
curl -s http://localhost:8081/instance/fetchInstances -H "apikey: revendaclick123" | python3 -m json.tool
```

### AÇÃO 2 — Assinar devecar antes de 2026-05-31 (URGENTE — 3 dias)

Trial de `dilneysantos.developer@gmail.com` expira **2026-05-31**. Sem `asaas_customer_id` — será criado no primeiro subscribe.
O botão de assinatura durante trial está agora habilitado (fix sessão 15 — D21).

```
1. https://app.revendaclick.com.br/login
2. Login com dilneysantos.developer@gmail.com
3. Menu → Billing/Planos
4. Badge "Trial ativo" visível no plano Starter
5. Clicar "Antecipar assinatura" → forma de pagamento PIX → informar CPF
6. Esperado: redirect para link Asaas → pagar → status active após confirmação
```

Após assinar: conectar WhatsApp em /whatsapp (instância `devecar` a ser criada pelo app).

---

## Próximos Passos (por prioridade)

### 3. Endpoint de upgrade de plano (Média)

Usuários com `status=active` que quiserem trocar de plano recebem erro (guard bloqueia re-subscribe).
Necessário criar endpoint `/api/billing/upgrade` no backend Go.

Ver: `backend/internal/billing/service.go` — guard atual bloqueia quando `asaas_subscription_id != ""`

### 4. Leaked Password Protection (Baixa — Supabase Dashboard)

Não acessível via SQL ou MCP — apenas via interface:
```
Supabase Dashboard → Authentication → Settings → Security → "Leaked Password Protection" → ON
```

### 5. Testar login em produção no browser (Baixa)

```
https://app.revendaclick.com.br/login → dilneysantos@gmail.com → /dashboard sem loop
```

### 6. Uptime Monitoring (Baixa)

UptimeRobot ou BetterStack Uptime → `https://api.revendaclick.com.br/health` → alerta por email

### 7. Backup S3 (Baixa)

```bash
# No VPS — adicionar ao .env:
BACKUP_S3_BUCKET=meu-bucket-s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=sa-east-1
```

### 8. METRICS_TOKEN ausente no .env VPS (Baixa)

Endpoint `/metrics` retorna 403 porque `METRICS_TOKEN` não está configurado.
Adicionar no VPS `/opt/revendaclick/.env` e reiniciar container.

### 9. Rotação de Secrets (Baixa — política semestral)

`ASAAS_API_KEY`, `EVOLUTION_API_KEY`, `METRICS_TOKEN` — atualizar no .env VPS + reiniciar containers.

### 10. Evolution schema isolado (Baixa — D19)

Configurar `DATABASE_SCHEMA=evolution` no docker-compose da Evolution para isolar tabelas Prisma do schema `public`. Ver D19 em `21_DECISOES_TECNICAS.md`.

---

## Documentação de Falhas

Pasta `docs-operacao/FalhasCorrigidas/` — **28 falhas documentadas (FC001–FC028)**.
Próximo número disponível: **FC029**.

Antes de diagnosticar qualquer problema: consultar primeiro o [README de FalhasCorrigidas](FalhasCorrigidas/README.md).

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

**ATENÇÃO .env VPS:** Variáveis com `$` literal devem usar `$$`. Ver D18 em `21_DECISOES_TECNICAS.md`.

**ATENÇÃO Tailwind primary:** Agora usa `rgb(var(--primary) / α)`. Store layout injeta canais RGB do tenant. Ver D20 em `21_DECISOES_TECNICAS.md`.
