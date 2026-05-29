# 23 — PRÓXIMO PASSO

> Atualizado em: 28/05/2026 (sessão 22)
> Atualizar este arquivo ao final de cada sessão com o que deve ser feito na próxima.

---

## Estado Atual do Projeto (sessão 22 — 28/05/2026)

| Componente | Status |
|---|---|
| Backend Go | ✓ CI/CD automático — VPS atualizado |
| Frontend Next.js | ✓ Vercel READY — deploy `bdefe75` ao vivo |
| Migration 022 | ✓ aplicada — performance→premium, features por plano, add-ons features |
| database.types.ts | ⚠️ desatualizado — migration 022 adicionou coluna em plan_addons; regenerar antes do próximo deploy |
| Planos públicos | ✓ Starter/Pro/Premium (3 cards); Scale oculto (CTA Enterprise) |
| Add-ons | ✓ user_extra(R$20) / whatsapp_automation(R$39) / ia_recovery(R$39) — endpoints ativos |
| Sidebar | ✓ Financeiro/Comissões/Vendedores: Starter+; CRM/Compradores: Pro+; Add-ons nav item |
| /billing/addons | ✓ página ao vivo — ativar/cancelar add-ons |
| Feature flags 3-way | ✓ plan.features UNION tenant_features UNION addon.features |
| plan_gate.go | ✓ 3 UNION ALL — plano + tenant_features + add-on features |
| Admin panel | ✓ /admin — super_admin protegido, ações por tenant |
| OnboardingChecklist | ✓ widget no dashboard (4 obrigatórios + 1 WhatsApp opcional) |
| devecar billing | ✓ ativado diretamente no Supabase (Pro, period_end 2026-06-27) |
| Central de Atendimento santos-car | ⚠️ reconectar — instância perdida na sessão 14 |
| CI/CD GitHub Actions | ✓ automático |
| Evolution API v2.3.7 | ✓ healthy |
| Billing Asaas | ✓ subscribe + upgrade end-to-end |
| Supabase security advisors | ✓ limpos |
| FalhasCorrigidas | ✓ 29 FCs documentadas (FC001–FC029) |

---

## REGRA OBRIGATÓRIA — Após cada migration Supabase

Sempre regenerar `frontend/lib/database.types.ts` antes de qualquer commit que referencie novas tabelas:

```bash
# Via MCP ou CLI Supabase:
supabase gen types typescript --project-id <id> > frontend/lib/database.types.ts
```

**Origem:** FC029 — 8 deploys consecutivos falharam por este motivo.

---

## Próximos Passos (por prioridade)

### 1. Regenerar `database.types.ts` após Migration 022 (URGENTE)

Migration 022 adicionou a coluna `features JSONB` em `plan_addons`. O arquivo de tipos precisa ser atualizado:

```bash
# Via MCP Supabase (generate_typescript_types) ou CLI:
supabase gen types typescript --project-id <id> > frontend/lib/database.types.ts
```

Não regenerar pode causar falha de build no próximo deploy que referencie `plan_addons`.

### 2. Reconectar Central de Atendimento santos-car (URGENTE)

```
1. https://app.revendaclick.com.br/whatsapp  (menu → "Central de Atendimento")
2. Login com dilneysantos@gmail.com (conta santos-car, plano Starter)
3. Clicar "Conectar canal" → QR aparece → escanear
```

**Atenção:** santos-car usa plano Starter — sem feature `central_atendimento`. Central de Atendimento requer Premium ou add-on `whatsapp_automation`. Opções:
- Ativar add-on `whatsapp_automation` (R$39/mês) — concede `central_atendimento` via add-on
- Conceder feature temporária via painel admin (`/admin` com dilneysantos.developer@gmail.com)

```bash
# Diagnóstico VPS se necessário:
ssh root@2.24.67.84
curl -s http://localhost:8081/instance/fetchInstances -H "apikey: revendaclick123" | python3 -m json.tool
```

### 3. Verificar comportamento em produção no browser (FASE 4)

- **santos-car (Starter):** sidebar com Dashboard, Veículos, Leads, Financeiro, Comissões, Vendedores + banner "Desbloqueie CRM, Kanban, Analytics"
- **devecar (Pro):** sidebar com CRM, Compradores/Atendimento (CRM), Kanban, Analytics
- **`/billing/addons`:** lista add-ons disponíveis (user_extra, whatsapp_automation, ia_recovery)
- **`/billing/plans`:** 3 cards (Starter/Pro/Premium) + seção Enterprise ao fundo (sem card Scale)

### 4. Etapas comerciais pendentes (próximas sessões)

- **Etapa 5** — Billing gateway abstraction (desvincular do Asaas → interface BillingGateway)
- **Etapa 10** — Auditoria final (RLS, tenant isolation, TypeScript strict, Go vet)

### 5. Leaked Password Protection (Baixa — Supabase Dashboard)

```
Supabase Dashboard → Authentication → Settings → Security → "Leaked Password Protection" → ON
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

Pasta `docs-operacao/FalhasCorrigidas/` — **29 falhas documentadas (FC001–FC029)**.
Próximo número disponível: **FC030**.

Antes de diagnosticar qualquer problema: consultar primeiro o [README de FalhasCorrigidas](FalhasCorrigidas/README.md).

---

## Contexto para a Próxima Sessão

Ao iniciar uma nova sessão:

1. Ler `00_LEIA_PRIMEIRO.md` — visão geral do sistema
2. Ler `20_PENDENCIAS.md` — o que está pendente
3. Ler este arquivo (`23_PROXIMO_PASSO.md`) — o que fazer agora
4. Se for alterar banco: ver `05_SUPABASE.md` primeiro **e regenerar `database.types.ts` após migration**
5. Se for alterar infra: ver `10_INFRA_VPS.md` e `11_DOCKER.md`
6. Se for alterar backend: ver `04_BACKEND.md` e `08_API_ROTAS_REAIS.md`
7. Se for fazer deploy: ver `13_DEPLOY.md` e `12_CICD.md`

**ATENÇÃO .env VPS:** Variáveis com `$` literal devem usar `$$`. Ver D18 em `21_DECISOES_TECNICAS.md`.

**ATENÇÃO Tailwind primary:** Agora usa `rgb(var(--primary) / α)`. Store layout injeta canais RGB do tenant. Ver D20 em `21_DECISOES_TECNICAS.md`.

**ATENÇÃO database.types.ts:** Regenerar após cada migration. Ver FC029.
