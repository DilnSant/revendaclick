# 23 — PRÓXIMO PASSO

> Atualizado em: 28/05/2026 (sessão 18)
> Atualizar este arquivo ao final de cada sessão com o que deve ser feito na próxima.

---

## Estado Atual do Projeto (sessão 18 — 28/05/2026)

**⚠️ ALERTA: devecar trial expira 2026-05-31 (3 dias)**
**⚠️ ALERTA: commit da sessão 18 pendente (alterações locais sem push)**

| Componente | Status |
|---|---|
| Backend Go | ⚠️ alterações locais — commit + CI/CD pendente |
| Frontend Next.js | ⚠️ alterações locais — commit + Vercel deploy pendente |
| Migration 019 | ✓ aplicada ao Supabase (planos reestruturados) |
| Planos | ✓ Start / Pro / Performance / Scale com tagline + features corretas |
| Central de Atendimento gate | ✓ `central_atendimento` feature flag em todas rotas Evolution operacionais |
| `/whatsapp` page | ✓ Start → upgrade prompt; Pro+ → WhatsAppManager |
| Billing plans page | ✓ redesign premium — PlansGrid global toggle + PlanCard com badges e feature sections |
| Migration 018 | ✓ aplicada ao Supabase (tenant_public_contacts + tenant_whatsapp_sessions) |
| CI/CD GitHub Actions | ✓ automático |
| Evolution API v2.3.7 | ✓ healthy |
| Billing Asaas | ✓ subscribe + upgrade end-to-end |
| Central de Atendimento santos-car | ⚠️ reconectar — instância perdida na sessão 14 |
| Supabase security advisors | ✓ limpos |
| FalhasCorrigidas | ✓ 28 FCs documentadas (FC001–FC028) |

---

## ⚠️ AÇÕES PRIORITÁRIAS

### AÇÃO 0 — Commit + Deploy sessão 18 (FAZER AGORA)

Arquivos alterados localmente aguardando commit:

```
database/migrations/019_plans_restructure_start_pro_performance_scale.sql
backend/internal/plans/model.go
backend/internal/plans/repository.go
backend/internal/server/server.go
backend/internal/billing/model.go
frontend/lib/billing-utils.ts
frontend/lib/tenant.ts
frontend/app/(dashboard)/whatsapp/page.tsx
frontend/app/(dashboard)/billing/plans/page.tsx
frontend/app/(dashboard)/billing/plans/_components/PlansGrid.tsx
frontend/app/(dashboard)/billing/plans/_components/PlanCard.tsx
docs-operacao/22_HISTORICO_ALTERACOES.md
docs-operacao/20_PENDENCIAS.md
docs-operacao/23_PROXIMO_PASSO.md
```

```bash
git add <arquivos acima>
git commit -m "feat: reestruturação de planos Start/Pro/Performance/Scale + billing premium redesign"
git push origin main
# CI/CD dispara automaticamente → backend VPS + frontend Vercel
```

### AÇÃO 1 — Reconectar Central de Atendimento santos-car (URGENTE)

As instâncias Evolution foram perdidas durante a limpeza do banco (sessão 14 — ver FC028).
**Nota:** o plano santos-car é Pro ou superior — a página `/whatsapp` liberará o WhatsAppManager.

```
1. https://app.revendaclick.com.br/whatsapp  (menu → "Central de Atendimento")
2. Login com dilneysantos@gmail.com (conta santos-car)
3. Clicar "Conectar canal"
4. QR aparece → escanear com o celular
5. Status muda para "Canal conectado"
```

```bash
# Diagnóstico VPS se necessário:
ssh root@2.24.67.84
curl -s http://localhost:8081/instance/fetchInstances -H "apikey: revendaclick123" | python3 -m json.tool
```

### AÇÃO 2 — Assinar devecar antes de 2026-05-31 (URGENTE — 3 dias)

Trial de `dilneysantos.developer@gmail.com` expira **2026-05-31**.
**Nota:** plano Start não inclui Central de Atendimento — assinar Pro+ para ter acesso ao QR.

```
1. https://app.revendaclick.com.br/login
2. Login com dilneysantos.developer@gmail.com
3. Menu → Billing → Planos
4. Badge "Trial" visível no plano Start
5. Clicar "Antecipar assinatura" no plano desejado (Pro recomendado) → PIX → informar CPF
6. Esperado: redirect para link Asaas → pagar → status active após confirmação
```

Após assinar: acessar Central de Atendimento → conectar canal (instância `devecar`).

---

## Próximos Passos (por prioridade)

### 3. Leaked Password Protection (Baixa — Supabase Dashboard)

Não acessível via SQL ou MCP — apenas via interface:
```
Supabase Dashboard → Authentication → Settings → Security → "Leaked Password Protection" → ON
```

### 4. Testar login em produção no browser (Baixa)

```
https://app.revendaclick.com.br/login → dilneysantos@gmail.com → /dashboard sem loop
```

### 5. Uptime Monitoring (Baixa)

UptimeRobot ou BetterStack Uptime → `https://api.revendaclick.com.br/health` → alerta por email

### 6. Backup S3 (Baixa)

```bash
# No VPS — adicionar ao .env:
BACKUP_S3_BUCKET=meu-bucket-s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=sa-east-1
```

### 7. METRICS_TOKEN ausente no .env VPS (Baixa)

Endpoint `/metrics` retorna 403 porque `METRICS_TOKEN` não está configurado.
Adicionar no VPS `/opt/revendaclick/.env` e reiniciar container.

### 8. Rotação de Secrets (Baixa — política semestral)

`ASAAS_API_KEY`, `EVOLUTION_API_KEY`, `METRICS_TOKEN` — atualizar no .env VPS + reiniciar containers.

### 9. Evolution schema isolado (Baixa — D19)

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
