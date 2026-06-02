# DEPENDENCIES — Mapa de Dependências

> Para cada módulo: o que ele depende, o que falha se ele cair, e quais serviços externos envolvidos.
> Usar antes de alterar qualquer módulo para avaliar impacto.

---

## Legenda

- **Crítica** — falha paralisa o módulo ou o produto
- **Alta** — degradação severa; usuário percebe imediatamente
- **Média** — funcionalidade parcial; workaround possível
- **Baixa** — feature secundária; produto continua operável

---

## Módulo: Auth / Onboarding

```
Auth (Supabase)
  ├── CRÍTICA: Supabase Auth (login, JWT, cookies)
  ├── CRÍTICA: Supabase PostgreSQL (tabelas users + tenants)
  ├── Alta: Backend /api/onboarding/setup (cria tenant + user + app_metadata)
  └── Alta: Supabase Admin API (PUT app_metadata.tenant_id)
```

**Impacto da falha Auth:** Nenhum usuário consegue logar. Produto inteiro inacessível.

**Impacto da falha Onboarding:** Novos registros não criam tenant. Usuário fica preso na tela de onboarding.

**Dependências externas:** Supabase (crítica)

---

## Módulo: Billing / Assinatura

```
Billing
  ├── CRÍTICA: Supabase (tabelas subscriptions, plan_addons, plans)
  ├── CRÍTICA: Asaas API (criar customer, criar subscription, atualizar plano)
  ├── CRÍTICA: Asaas Webhook (PAYMENT_CONFIRMED → status active)
  │     └── depende de: Nginx /api/webhooks/* (rate limit correto)
  ├── Alta: get_tenant_usage() RPC (3-way feature flags)
  ├── Alta: SubscriptionGate middleware (bloqueia rota se sub inativa)
  └── Alta: Sidebar (re-renderiza seções Pro/Premium após upgrade)
```

**Impacto da falha Asaas:** Novos pagamentos não processam. Assinaturas existentes continuam pelo status atual no banco.

**Impacto da falha Webhook:** Pagamentos confirmados não atualizam status. Usuário paga mas continua como `past_due`.

**Dependências externas:** Asaas (crítica para novos pagamentos)

**Idempotência:** Chave `event:asaas_id` previne duplicatas.

---

## Módulo: Veículos

```
Veículos
  ├── CRÍTICA: Supabase PostgreSQL (tabela vehicles + RLS)
  ├── Alta: Supabase Storage (bucket vehicles — fotos)
  ├── Alta: Vitrine pública /:slug (SSG/ISR — revalidação a cada deploy)
  └── Baixa: Analytics (contagem de veículos no KPI)
```

**Impacto da falha Storage:** Upload de fotos falha. Veículos existentes sem nova foto; fotos antigas continuam.

**Impacto da falha RLS:** Risco de cross-tenant data leak. **Não alterar RLS sem revisão.**

---

## Módulo: Leads / CRM

```
Leads / CRM
  ├── CRÍTICA: Supabase PostgreSQL (tabela leads + RLS)
  ├── Alta: Backend /api/leads (CRUD + filtros)
  ├── Alta: Gate has_crm (CRM/Kanban — plano Pro+)
  ├── Média: OpenRouter IA (classify-lead, suggest-reply)
  └── Baixa: Analytics (conversão, funil)
```

**Impacto da falha OpenRouter:** IA classification/suggest indisponível. Leads continuam funcionando sem IA.

**Impacto da falha CRM gate:** Usuários Starter veem CRM. Corrigir em `plan_gate.go`.

---

## Módulo: Central de Atendimento (WhatsApp)

```
Central de Atendimento
  ├── CRÍTICA: Evolution API v2.3.7 (instâncias, QR, envio/recebimento)
  ├── CRÍTICA: add-on whatsapp_automation (feature has_central_atendimento)
  ├── Alta: Redis (cache de sessão Evolution)
  ├── Alta: tenant_features OR plan_addons (3-way gate)
  ├── Alta: Webhook Evolution → Backend /api/evolution/webhook
  └── Média: WhatsApp (celular do usuário com QR escaneado)
```

**Impacto da falha Evolution:** WhatsApp completamente indisponível. QR não carrega, mensagens não chegam.

**Impacto da falha Redis:** Evolution funciona mas mais lento (sem cache de sessão).

**Impacto da falha Webhook:** Mensagens chegam ao Evolution mas não são processadas pelo backend (sem CRM update).

**Dependências externas:** Evolution API (crítica), Redis (alta)

**Nota:** instância `rc_evolution` no VPS. Se OOM → aumentar memória (768m atual). Ver FC022.

---

## Módulo: Analytics

```
Analytics
  ├── CRÍTICA: Backend /api/analytics/summary
  ├── Alta: Supabase (tabelas sales, leads, vehicles, customers)
  ├── Alta: Gate has_analytics (plano Pro+)
  └── Baixa: Cache TTL (analytics tem cache de ~60s no backend)
```

**Impacto da falha:** KPIs do dashboard e página Analytics retornam zero ou erro. Produto continua operável.

---

## Módulo: Financeiro / Vendas / Comissões

```
Financeiro
  ├── CRÍTICA: Supabase (tabelas financial_entries, sales, commissions)
  ├── Alta: Backend /api/financial/*, /api/sales, /api/commissions
  ├── Alta: Gate has_financial (Starter+)
  └── Baixa: FinancialSubNav (tabs Resumo/Vendas/Comissões)
```

**Impacto da falha:** Registros financeiros indisponíveis. Não afeta outros módulos.

---

## Módulo: Observabilidade

```
Observabilidade
  ├── Alta: Prometheus /metrics (requer METRICS_TOKEN)
  ├── Alta: BetterStack log shipping (BETTER_STACK_SOURCE_TOKEN)
  └── Baixa: /health e /api/v1/health (liveness check)
```

**Impacto da falha Metrics:** Sem métricas. Produto continua operando.

**Impacto da falha BetterStack:** Logs só em stdout. Ver `docker logs rc_backend`.

**ATENÇÃO:** METRICS_TOKEN ausente no .env VPS atual → /metrics retorna 403. Pendente.

---

## Módulo: CI/CD

```
CI/CD
  ├── CRÍTICA: GitHub Actions (build, test, push image)
  ├── CRÍTICA: GHCR (ghcr.io/dilnsant/revendaclick-backend — imagem Docker)
  ├── CRÍTICA: Self-hosted runner no VPS (pull + docker compose up)
  ├── Alta: Vercel (frontend — auto-deploy via GitHub integration)
  └── Média: Smoke tests pós-deploy (GET /health)
```

**Impacto da falha Runner:** Backend não atualiza automaticamente. Deploy manual via SSH necessário.

**Impacto da falha Vercel:** Frontend não atualiza. Último build continua servindo.

---

## Mapa de Dependências Externas

| Serviço externo | Criticidade | Módulos dependentes | Fallback |
|---|---|---|---|
| Supabase PostgreSQL | **CRÍTICA** | Todos | Nenhum — produto para |
| Supabase Auth | **CRÍTICA** | Auth, Dashboard | Nenhum |
| Asaas API | **Alta** | Billing novo | Assinaturas existentes continuam |
| Evolution API | **Alta** | Central de Atendimento (add-on) | Central indisponível — produto base não afetado |
| Redis | **Alta** | Evolution cache (add-on) | Evolution mais lento — add-on degradado, produto base não afetado |
| OpenRouter | **Média** | IA classify/suggest | Features IA desabilitadas |
| Vercel | **Alta** | Frontend | Último deploy continua |
| GHCR | **Alta** | CI/CD backend | Deploy manual |
| BetterStack | **Baixa** | Logs | stdout via docker logs |

---

## Regra ao Alterar

Antes de alterar qualquer módulo:
1. Verificar tabela acima — quem depende deste módulo
2. Se dependência **CRÍTICA** → testar em staging antes de produção
3. Após alterar banco (migration) → regenerar `database.types.ts`
4. Após alterar `get_tenant_usage()` → testar 3-way UNION (plan + tenant_features + addons)
