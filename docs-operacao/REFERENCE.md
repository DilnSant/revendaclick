# REFERENCE — Quick Lookup

> Valores fixos do projeto. Consultar aqui antes de grepar ou abrir outros docs.
> Atualizar quando algum valor mudar de fato (IP, IDs, URLs, etc).

---

## Infraestrutura

| Item | Valor |
|---|---|
| VPS IP | `2.24.67.84` |
| VPS usuário | `root` |
| Projeto no VPS | `/opt/revendaclick` |
| Compose de produção | `docker-compose.production.yml` |
| Docker rede interna | `rc_network` |

## Containers (nomes exatos)

| Container | Imagem | Porta interna |
|---|---|---|
| `rc_backend` | `ghcr.io/dilnsant/revendaclick-backend` | `8080` |
| `rc_evolution` | `evoapicloud/evolution-api:v2.3.7` | `8080` |
| `rc_redis` | `redis:7-alpine` | `6379` |
| `rc_backup` | `alpine` | — |

## URLs de produção

| Serviço | URL |
|---|---|
| Frontend | `https://app.revendaclick.com.br` (Vercel) |
| API Backend | `https://api.revendaclick.com.br` |
| Evolution API | `https://evolution.revendaclick.com.br` |
| Site público | `https://revendaclick.com.br` |

## Endpoints úteis

```
GET  /health                → status do backend + DB ping
GET  /api/v1/health         → liveness simples
GET  /metrics               → Prometheus (requer METRICS_TOKEN)
```

## Supabase

| Item | Valor |
|---|---|
| Project ID | `ibgaywezfcbbiiziaoac` |
| URL base | `https://ibgaywezfcbbiiziaoac.supabase.co` |
| Pool port (PgBouncer) | `6543` — backend Go |
| Direct port | `5432` — Evolution API (Prisma) |

## GitHub / CI-CD

| Item | Valor |
|---|---|
| Repositório | `https://github.com/DilnSant/revendaclick` |
| Registry imagem | `ghcr.io/dilnsant/revendaclick-backend` |
| Runner CI/CD | Self-hosted no VPS |
| Trigger deploy | Push para `main` |
| Frontend deploy | Vercel — automático via integração GitHub |

## Banco de dados — estado atual

| Item | Valor |
|---|---|
| Migrations aplicadas | 001 → 031 |
| Próxima migration | `032_...` |
| Tenants no banco | santos-car (Pro/active), sandbox-revendaclick (Pro/active), devecar (is_active=false) |
| Pasta de migrations | `database/migrations/` |
| Pasta de seeds | `database/seeds/` |

## Documentação de falhas

| Item | Valor |
|---|---|
| Pasta | `docs-operacao/FalhasCorrigidas/` |
| Total documentadas | 33 (FC001–FC033) |
| Próxima FC | **FC034** |

## Landing Page — CONGELADA (sessão 31)

**Fluxo principal completo:** `Landing → POST /api/leads/landing → Supabase landing_leads → /admin/leads`

| Rota | Tipo | Notas |
|---|---|---|
| `/` | Static | Landing page completa — **não adicionar features** |
| `/obrigado` | Static | Thank-you page, robots: noindex |
| `/privacidade` | Static | Política de privacidade LGPD, robots: index |

## Landing Page — tabela de leads (migrations 028–031)

| Item | Valor |
|---|---|
| Tabela | `public.landing_leads` |
| Migrations | `028` (criação), `029` (qualificação), `030` (status/notes), `031` (pipeline) |
| API Route | `POST /api/leads/landing` (Next.js, não backend Go) |
| Admin list | `/admin/leads` — filtros, paginação 25/pág, alerta 4h |
| Admin detalhe | `/admin/leads/[id]` — status, notas, próxima ação, último contato |
| RLS | INSERT: anon + authenticated \| SELECT: service_role only |
| Campos qualificação | `vehicles_count`, `city`, `state` (migration 029) |
| Campos pipeline | `status`, `notes`, `updated_at` (migration 030); `last_contact_at`, `next_action` (migration 031) |
| Status válidos | `novo` → `contatado` → `em_negociacao` → `convertido` \| `perdido` |

## Landing Page — integrações opcionais (add-ons futuros)

| Integração | Env vars | Comportamento sem config |
|---|---|---|
| Webhook externo | `WEBHOOK_LEADS_URL`, `WEBHOOK_SECRET` | No-op — lead já salvo no Supabase |
| Notificação WA | `LEAD_NOTIFY_INSTANCE`, `LEAD_NOTIFY_NUMBER` (VPS .env) | No-op — endpoint responde 200 sem enviar WA |
| Meta CAPI | `META_PIXEL_ID`, `META_CAPI_TOKEN` | No-op — evento não enviado |
| Google Ads | `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_DEVELOPER_TOKEN` | No-op — stub inativo |

## Landing Page — arquitetura de tracking (server-side)

| Arquivo | Função |
|---|---|
| `lib/marketing/events.ts` | Client-side: GA4 + Meta Pixel + TikTok Pixel |
| `lib/marketing/meta-conversions.ts` | Server-side: Meta CAPI com hashData SHA-256 (opcional) |
| `lib/marketing/google-conversions.ts` | Server-side: stub Google Ads API (opcional) |

## Comandos frequentes

```bash
# Ver logs do backend em produção
ssh root@2.24.67.84 "docker logs rc_backend --tail 100 -f"

# Status dos containers
ssh root@2.24.67.84 "docker compose -f /opt/revendaclick/docker-compose.production.yml ps"

# Reiniciar backend após mudança de .env
ssh root@2.24.67.84 "cd /opt/revendaclick && docker compose -f docker-compose.production.yml up -d backend"

# Verificar variáveis resolvidas no container
ssh root@2.24.67.84 "docker exec rc_backend env | grep -E 'ASAAS|EVOLUTION|SUPABASE'"

# Forçar rebuild local do backend
cd backend && go build ./... && go vet ./... && go test ./...

# TypeScript check do frontend
cd frontend && npx tsc --noEmit
```

## Feature flags (nomes exatos)

```
has_financial            → Starter+
has_vendors              → Starter+
has_crm                  → Pro+
has_analytics            → Pro+
has_whatsapp             → Pro+
has_kanban               → Pro+
has_automation           → Premium+ (feature "automation" no plano)
has_campaigns            → Premium+
has_central_atendimento  → Premium+ OU add-on whatsapp_automation OU tenant_feature override
has_whatsapp_qr          → Premium+ OU add-on
has_ai_assistance        → Premium+
has_lead_recovery        → Premium+ OU add-on ia_recovery
has_api_access           → Scale only (não está em Premium — apenas Scale)
has_white_label          → Scale only
```

> **ATENÇÃO (corrigido sessão 33):** `has_api_access` é exclusivo do plano Scale — não do Premium.
> O gate do sidebar para a seção Premium é `has_automation`, não `has_api_access`.
> Fonte de verdade: `plans.features` no banco + `ComputeFeatureFlags()` em `backend/internal/plans/model.go`.

## Planos (nomes exatos no banco)

| name | display_name comercial | Posição |
|---|---|---|
| `starter` | Starter | 1 |
| `pro` | Pro | 2 |
| `premium` | **Premium** | 3 — `plan.name = 'premium'` (migration 026); nome comercial = "Premium" |
| `scale` | Scale | 4 — oculto do grid público; CTA "Enterprise" é apenas label de grid |

> **CRÍTICO:** `plan.name` no banco é `premium` (migration 026 — definitivo). Nome comercial e nome interno agora coincidem.

## Add-ons (nomes exatos no banco)

| type | Nome comercial | Preço | Feature concedida |
|---|---|---|---|
| `user_extra` | Usuário Extra | R$20/mês | `max_users +1` |
| `whatsapp_automation` | Central de Atendimento | R$39/mês | `has_central_atendimento` |
| `ia_recovery` | IA Recovery | R$39/mês | `has_lead_recovery` |

## Sidebar — gates (definitivo — ver D28)

| Seção | Gate | Módulos |
|---|---|---|
| Base (Starter+) | sempre | Dashboard, Veículos, Interessados, Clientes, Financeiro¹ |
| Pro | `has_crm` | Atendimento (CRM), Analytics |
| Premium | `has_automation` | Automações, Campanhas |
| Sempre visível | — | Assinatura², Configurações³ |

¹ Financeiro tem sub-nav interno: **Resumo** / **Vendas** / **Comissões**
² Assinatura tem sub-nav: **Assinatura** / **Add-ons** / **Cobranças** / **Planos**
³ Configurações tem tabs: **Loja** / **Contato Público** / **Usuários** / **Plano** / **WhatsApp**

## WhatsApp — dois conceitos distintos

| Conceito | Origem | Função | Tecnologia |
|---|---|---|---|
| **WhatsApp da Loja** | Número público do tenant (campo "Contato Público") | Botão "Falar no WhatsApp" na vitrine `/:slug`; contato público da revenda | Link `wa.me/{telefone}` — **sem Evolution** |
| **Central de Atendimento** | Evolution API v2.3.7 | Atendimento CRM via WhatsApp, mensagens, IA Recovery | Add-on `whatsapp_automation` → `has_central_atendimento` |

> Nunca confundir: WhatsApp da Loja é configurado em Configurações → Contato Público. Central de Atendimento é contratada separadamente em Add-ons.

## Tenants de referência

| Tenant | Plano | tenant_id | Notas |
|---|---|---|---|
| `santos-car` | **Pro** (active) | `fd1172f6-11e7-4555-8fe3-082fd1849587` | Tenant do owner — homologação e testes Pro |
| `sandbox-revendaclick` | **Pro** (active) | `e72eb104-98b7-4a71-946d-15e680496fc3` | Tenant de testes isolado — substitui devecar |

> **devecar** foi removido como tenant operacional de referência (2026-05-30). `is_active=false`.
> **santos-car** está no plano Pro (atualizado em sessão 26 — DB confirma).

## super_admin

- Email: `dilneysantos.developer@gmail.com`
- `public.users.role = 'super_admin'`
- `public.users.tenant_id = NULL` (migration 025)
- Acesso: `GET /admin` no frontend
