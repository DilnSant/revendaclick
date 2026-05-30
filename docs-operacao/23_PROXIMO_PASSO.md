# 23 — PRÓXIMO PASSO

> Atualizado em: 30/05/2026 (sessão 23 — fim)
> Atualizar este arquivo ao final de cada sessão com o que deve ser feito na próxima.

---

## Guia de Leitura por Tipo de Tarefa

> Leia isso PRIMEIRO, antes de abrir qualquer outro arquivo.

| Tipo de tarefa | Arquivos para ler |
|---|---|
| Qualquer tarefa | `23_PROXIMO_PASSO.md` (este) + `20_PENDENCIAS.md` |
| Alterar banco / migrations | `05_SUPABASE.md` → aplicar → regenerar `database.types.ts` |
| Alterar backend Go | `04_BACKEND.md` + `08_API_ROTAS_REAIS.md` |
| Alterar infra / docker | `10_INFRA_VPS.md` + `11_DOCKER.md` |
| Fazer deploy | `13_DEPLOY.md` + `12_CICD.md` |
| Diagnosticar bug | `FalhasCorrigidas/README.md` → buscar padrão similar |
| Precisar de valor fixo (IP, ID, URL) | `REFERENCE.md` |
| Entender decisão arquitetural | `21_DECISOES_TECNICAS.md` |
| Ver estado atual de qualquer feature | `22_HISTORICO_ALTERACOES.md` (topo — ESTADO ATUAL) |

---

## Estado Atual do Projeto (sessão 23 fim — 29/05/2026)

| Componente | Status |
|---|---|
| Backend Go | ✓ CI/CD automático — VPS atualizado |
| Frontend Next.js | ✓ Vercel — auto-deploy ativado via push para main |
| Migration 022 | ✓ aplicada — performance→premium, features por plano, add-ons features |
| Migration 023 | ✓ aplicada — fix get_tenant_usage: branch tenant_features restaurado |
| Migration 024 | ✓ aplicada — RLS plan_addons + rename premium→performance |
| Migration 025 | ✓ aplicada — users.tenant_id nullable (super_admin sem tenant) |
| database.types.ts | ✓ regenerado pós-024 — 131.307 chars |
| Planos públicos | ✓ Starter/Pro/Performance (3 cards); Scale oculto (CTA Enterprise) |
| Add-ons | ✓ user_extra(R$20) / whatsapp_automation(R$39) / ia_recovery(R$39) — endpoints ativos |
| Sidebar | ✓ **REFATORADA** — Starter/Pro/Premium por feature flag; sub-navs Financeiro+Billing |
| Feature flags 3-way | ✓ plan.features UNION tenant_features UNION addon.features |
| plan_gate.go | ✓ 3 UNION ALL — plano + tenant_features + add-on features |
| Admin panel | ✓ /admin — super_admin protegido, ações por tenant |
| AdminSimulateEvent | ✓ POST /api/admin/billing/simulate-event — super_admin injeta eventos fake sem Asaas |
| DevActivate | ✓ POST /api/billing/dev/activate — ativo apenas fora de produção |
| OnboardingChecklist | ✓ widget no dashboard (4 obrigatórios + 1 WhatsApp opcional) |
| super_admin | ✓ dilneysantos.developer@gmail.com — tenant_id=NULL, role=super_admin |
| devecar billing | ✓ ativado diretamente no Supabase (Pro, period_end 2026-06-27) |
| Central de Atendimento santos-car | ✓ instância Evolution `open` (554888482877); feature central_atendimento concedida |
| CI/CD GitHub Actions | ✓ automático |
| Evolution API v2.3.7 | ✓ healthy |
| Billing Asaas | ✓ subscribe + upgrade end-to-end |
| Supabase security advisors | ✓ limpos |
| FalhasCorrigidas | ✓ 29 FCs documentadas (FC001–FC029) |
| Evolution webhook 401 | ✓ corrigido — `RemoteAddr` em vez de `ClientIP()` (X-Forwarded-For bypass) |
| rc_backup OOM (98%) | ✓ corrigido — 128m → 256m; variáveis shell `$$` escapadas |
| CI/CD `git pull` vs local changes | ✓ corrigido — `git fetch + git reset --hard origin/main` |
| devecar Evolution | ⚠ desconectado (device_removed 28/05) — requer rescan QR pelo usuário |

---

## REGRA OBRIGATÓRIA — Após cada migration Supabase

Sempre regenerar `frontend/lib/database.types.ts` antes de qualquer commit que referencie novas tabelas:

```bash
# Via MCP ou CLI Supabase:
supabase gen types typescript --project-id ibgaywezfcbbiiziaoac > frontend/lib/database.types.ts
```

**Origem:** FC029 — 8 deploys consecutivos falharam por este motivo.

---

## Nova Estrutura da Sidebar (sessão 23 fim — DEFINITIVA)

```
Dashboard
Veículos
Interessados
Clientes              ← todos os planos (antes era Pro+)

─── Pro ───────────── gated has_crm
Atendimento (CRM)
Analytics

─── Premium ────────── gated has_api_access
Automações
Campanhas

Assinatura            ← sub-nav: Assinatura / Add-ons / Cobranças / Planos
Configurações         ← sub-nav tabs: Loja / Contato Público / Usuários / Plano / WhatsApp
```

**Financeiro** tem sub-nav interno: Resumo / Vendas / Comissões

---

## Próximos Passos (por prioridade)

### 0. Reconectar instância devecar no Evolution (URGENTE — usuário)

Instância `devecar` desconectada desde 28/05 (`device_removed`). Para reconectar:
1. Login como usuário `devecar` no app
2. Ir para `/whatsapp` (ou Configurações → WhatsApp)
3. Clicar em "Conectar" → escanear QR com WhatsApp do número 554898232010

### 1. Verificar sidebar no browser em produção (ALTA)

Testar os 3 perfis:

| Perfil | Esperado |
|---|---|
| **santos-car (Starter)** | Dashboard/Veículos/Interessados/Clientes/Financeiro + upgrade prompt "Desbloqueie com Pro" + Assinatura/Configurações |
| **devecar (Pro)** | + seção Pro: Atendimento, Analytics |
| **qualquer (Premium/has_api_access)** | + seção Premium: Automações, Campanhas |

Verificar:
- Financeiro → sub-nav mostrando Resumo/Vendas/Comissões
- Assinatura → sub-nav mostrando Assinatura/Add-ons/Cobranças/Planos
- Configurações → aba WhatsApp visível (5ª aba)

### 2. Criar páginas placeholder para Premium (Média)

`/automations` e `/campaigns` não têm page.tsx ainda. Criar placeholder:
```tsx
// app/(dashboard)/automations/page.tsx
export default function AutomationsPage() {
  return <div className="...">Em breve — Automações</div>
}
```
Sem essas páginas, o link no nav vai para 404.

### 3. Vendedores — acessibilidade (Média)

`/vendors` foi removido do sidebar mas não tem acesso visível em Configurações.
Opção A: Adicionar link "Vendedores →" dentro da aba Usuários (já existe em SettingsTabs — `<Link href="/vendors">`)
Opção B: Adicionar sub-item em Configurações → Usuários → Vendedores

**Status atual:** SettingsTabs UsersTab já tem `<Link href="/vendors" className="text-xs font-medium text-red-600 hover:text-red-700">Vendedores →</Link>` — OK, apenas confirmar no browser.

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

**ATENÇÃO sidebar:** Nova estrutura definitiva — ver D28 em `21_DECISOES_TECNICAS.md`. Nunca usar `plan_name` hardcoded.
