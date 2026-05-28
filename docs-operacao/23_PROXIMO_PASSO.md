# 23 — PRÓXIMO PASSO

> Atualizado em: 28/05/2026 (sessão 19)
> Atualizar este arquivo ao final de cada sessão com o que deve ser feito na próxima.

---

## Estado Atual do Projeto (sessão 19 — 28/05/2026)

| Componente | Status |
|---|---|
| Backend Go | ⚠️ alterações locais — commit + CI/CD pendente |
| Frontend Next.js | ⚠️ alterações locais — commit + Vercel deploy pendente |
| Migration 020 | ✓ aplicada ao Supabase (tenant_features, super_admin, onboarding v2) |
| Migration 019 | ✓ aplicada ao Supabase (planos reestruturados) |
| Planos | ✓ Start / Pro / Performance / Scale com tagline + features corretas |
| Feature flags | ✓ PlanGate usa UNION ALL (plans.features OR tenant_features) |
| Admin panel | ✓ /admin — super_admin protegido, ações por tenant |
| OnboardingChecklist | ✓ widget no dashboard (4 obrigatórios + 1 WhatsApp opcional) |
| devecar billing | ✓ ativado diretamente no Supabase (Pro, period_end 2026-06-27) |
| Central de Atendimento santos-car | ⚠️ reconectar — instância perdida na sessão 14 |
| CI/CD GitHub Actions | ✓ automático |
| Evolution API v2.3.7 | ✓ healthy |
| Billing Asaas | ✓ subscribe + upgrade end-to-end |
| Supabase security advisors | ✓ limpos |
| FalhasCorrigidas | ✓ 28 FCs documentadas (FC001–FC028) |

---

## ⚠️ AÇÃO IMEDIATA — Commit + Deploy sessão 19

```bash
git add \
  backend/internal/admin/ \
  backend/internal/middleware/plan_gate.go \
  backend/internal/onboarding/onboarding.go \
  backend/internal/server/server.go \
  backend/internal/billing/repository.go \
  backend/internal/billing/service.go \
  backend/internal/billing/handler.go \
  database/migrations/020_tenant_features_super_admin_onboarding_v2.sql \
  frontend/app/\(admin\)/ \
  frontend/app/api/admin/ \
  frontend/components/onboarding/ \
  frontend/app/\(dashboard\)/dashboard/page.tsx \
  frontend/app/\(dashboard\)/whatsapp/page.tsx \
  docs-operacao/22_HISTORICO_ALTERACOES.md \
  docs-operacao/20_PENDENCIAS.md \
  docs-operacao/23_PROXIMO_PASSO.md

git commit -m "feat: FASE 2 — feature flags reais, onboarding v2, painel admin super_admin, checklist widget"
git push origin main
```

---

## Próximos Passos (por prioridade)

### 1. Reconectar Central de Atendimento santos-car (URGENTE)

```
1. https://app.revendaclick.com.br/whatsapp  (menu → "Central de Atendimento")
2. Login com dilneysantos@gmail.com (conta santos-car, plano Pro)
3. Clicar "Conectar canal" → QR aparece → escanear
```

```bash
# Diagnóstico VPS se necessário:
ssh root@2.24.67.84
curl -s http://localhost:8081/instance/fetchInstances -H "apikey: revendaclick123" | python3 -m json.tool
```

### 2. Configurar super_admin no Supabase para acesso ao /admin

Para usar o painel admin em produção, atualizar `app_metadata` do usuário admin:

```sql
-- Executar no Supabase SQL editor (service_role):
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"user_role": "super_admin"}'::jsonb
WHERE email = 'dilneysantos.developer@gmail.com';
```

Após isso: acessar `https://app.revendaclick.com.br/admin` com esse usuário.

### 3. FASE 2 — Etapas pendentes (próximas sessões)

- **Etapa 5** — Billing gateway abstraction (desvincular do Asaas → interface BillingGateway)
- **Etapa 9** — Add-ons architecture (WhatsApp extra, IA extra, leads extras — tabelas DB)
- **Etapa 10** — Auditoria final (RLS, tenant isolation, TypeScript strict, Go vet)

### 4. Leaked Password Protection (Baixa — Supabase Dashboard)

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
BACKUP_S3_BUCKET=meu-bucket-s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=sa-east-1
```

### 8. METRICS_TOKEN ausente no .env VPS (Baixa)

Endpoint `/metrics` retorna 403. Adicionar no VPS `/opt/revendaclick/.env` e reiniciar container.

### 9. Rotação de Secrets (Baixa — política semestral)

`ASAAS_API_KEY`, `EVOLUTION_API_KEY`, `METRICS_TOKEN` — atualizar no .env VPS + reiniciar containers.

### 10. Evolution schema isolado (Baixa — D19)

Configurar `DATABASE_SCHEMA=evolution` no docker-compose da Evolution. Ver D19 em `21_DECISOES_TECNICAS.md`.

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
