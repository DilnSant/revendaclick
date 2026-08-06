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
| `rc_backup` | `postgres:17-alpine` | — |

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

## Billing / Asaas

| Item | Valor |
|---|---|
| Conta | **Nova conta, trocada em 06/08/2026 (sessão 64)** — a anterior foi encerrada |
| Ambiente | `production` (`https://www.asaas.com/api/v3`) |
| Onde ficam as chaves | `/opt/revendaclick/.env` no **VPS** — lidas só pelo backend Go (`config.go:58-60`) |
| Vars | `ASAAS_API_KEY`, `ASAAS_ENV`, `ASAAS_WEBHOOK_TOKEN` |
| Webhook | `POST https://api.revendaclick.com.br/api/webhooks/asaas`, header `asaas-access-token` |
| IP liberado no Asaas | `2.24.67.84` (whitelist obrigatória — sem isso tudo volta `not_allowed_ip`) |

> **NUNCA colocar `ASAAS_*` na Vercel** — o frontend não lê essas variáveis em lugar nenhum.
> Ver D37 em `21_DECISOES_TECNICAS.md`.
>
> **`ASAAS_API_KEY` precisa de `$$` no `.env`** (a chave começa com `$`) por causa da dupla
> interpolação do Docker Compose. Ver D18. Conferir com:
> `docker exec rc_backend env | grep ASAAS_API_KEY` → deve mostrar **um** `$`.

## Banco de dados — estado atual

| Item | Valor |
|---|---|
| Migrations aplicadas | 001–040 (exceto 033 — ver nota abaixo) |
| Próxima migration | `041_...` |
| Tenants no banco | **1** (`santos-car`) — ver tabela completa abaixo |
| Pasta de migrations | `database/migrations/` |
| Pasta de seeds | `database/seeds/` |

> **Migration 033 (local `033_fix_santos_car_asaas_subscription_id.sql`):** Nunca aplicada via Supabase MCP.
> Seu conteúdo (UPDATE asaas_subscription_id de `dev_test_...` para `sub_gqu4uiro0sisshxt`) foi
> supersedido pela sessão 36, que criou a assinatura `sub_b3y3xwo9s18g50xc` diretamente. **Obsoleta — não aplicar.**

## Documentação de falhas

| Item | Valor |
|---|---|
| Pasta | `docs-operacao/FalhasCorrigidas/` |
| Total documentadas | 63 arquivos (FC001–FC059, FC061–FC065 — não existe arquivo FC060) |
| Próxima FC | **FC066** |
| FC039 | FC039 — Hardening final: 500 ListTenants enum cast, NavItem Link, proxy.ts, sitemap, REVOKE triggers, RLS landing_leads — sessão 47 |
| FC040 | FC040 — Supabase: SET search_path = public em 8 funções + REVOKE FROM PUBLIC em 6 trigger functions — sessão 47 |
| FC041 | FC041 — Saneamento documental final: 4 arquivos corrigidos (count FC 38→40, próximo FC039→FC041, seção obsoleta memory) — sessão 48 |
| FC042 | FC042 — E2E Playwright: seletores incorretos + skip guards insuficientes — 5 causas raiz; 7 arquivos corrigidos; 9/9 testes verdes contra produção — sessão 48 |
| FC043 | FC043 — Backup S3: aws-cli no startup, path YYYY/MM, verificação pós-upload, lifecycle 30d, restore-from-s3.sh — sessão 49 |
| FC044 | FC044 — Reclassificação de pendências não prioritárias: Backup S3 config + BetterStack Alerts + Leaked Password Protection → Backlog de Infraestrutura — sessão 50 |
| FC045 | FC045 — Contagem documental de FCs desatualizada: 23_PROXIMO_PASSO + FalhasCorrigidas/README (count 43→44, próximo FC044→FC045, FC044 ausente do índice) — sessão 51 |
| FC046 | FC046 — Super Admin CRUD completo: assinaturas, tenants, usuários, planos, whatsapp; 10 novos endpoints backend + 5 novos componentes frontend + audit logging — sessão 52 |
| FC047 | FC047 — Pós-deploy FC046: evoSvcInst compile error (server.go); audit_logs.tenant_id NOT NULL; entity_id não-UUID em WhatsApp audit — sessão 52 |
| FC048 | FC048 — Validação propagação global de planos: GetUsage() sem cache, billing inalterado, RLS intacta, audit_logs tenant_id=NULL — nenhum bug — sessão 53 |
| FC049 | FC049 — Tenants: tooltips em todas as ações + quarentena (motivo, badge, retirar) + exclusão controlada lógica/física com modal e confirmação dupla — sessão 53 |
| FC050 | FC050 — Hardening status de tenant: getTenantStatusForUser sem filtro is_active; /conta-suspensa com motivo/assinatura/logout; database.types.ts regenerado — sessão 53 |
| FC051 | FC051 — Validação de serviços externos por status: WA connection persiste para QUARENTENA/EXCLUÍDO; QuarantineTenant + DeleteTenant (soft/hard) agora chamam DisconnectInstance — sessão 54 |
| FC052 | FC052 — Teste de aceitação: 4/4 fluxos aprovados; hotfix audit_logs (pgx SimpleProtocol []byte→string + ::jsonb cast); commit 191ad80 — sessão 54 |
| FC053 | FC053 — Super Admin DELETE tenant "Acesso negado": proxy.ts não wired como middleware; getSession() stale; DELETE body não forwarded — 3 arquivos corrigidos; commit cfc060f — sessão 55 |
| FC054 | FC054 — 3 bugs produção: layout.tsx getSession stale → /admin/logs 404; SubscriptionsTable clear_canceled_at + botão Reativar; SupportContact clipboard em /conta-suspensa — commit 4e22465 — sessão 56 |
| FC055 | FC055 — middleware.ts conflito com proxy.ts: 4 deploys ERROR (cfc060f→c78016c); Next.js 16.2.6 usa proxy.ts como middleware nativo — commit ff00b46 — sessão 55 |
| FC056 | FC056 — AdminTenantsTable botão Reativar condicional: exibido apenas quando tenant está bloqueado e assinatura pode ser reativada — sessão 56 *(adendo interno do FC055 — sem arquivo próprio)* |
| FC057 | FC057 — /admin/logs 404 definitivo: `.gitignore` `logs/` recursivo bloqueava rota Next.js; page.tsx commitada pela 1ª vez; login.tsx router.push→window.location.href — commit 0e3538c — sessão 57 |
| FC058 | FC058 — Super Admin redirecionado para `/onboarding` ao logar: layout.tsx não distinguia role (sem tenant → /onboarding em vez de /admin); subdomínio `www.` sem redirect canônico para `app.` quebrava sessão entre subdomínios — sessão 58 |
| FC059 | FC059 — Super Admin defense-in-depth: `app_metadata.user_role` ausente no JWT (promoção SQL não sincroniza Auth server); `resolveUserRole()` com DB-fallback via service-role cobre o gap — sessão 59 |
| FC061 | FC061 — "Página da Loja" sem destaque: nova rota dedicada `/store` + item na sidebar + `StoreCard` no dashboard + CTA âmbar quando não publicada + métricas; `CopyStoreLink` removido (bug de domínio `revendaclick.com.br` → `app.revendaclick.com.br` corrigido) — sessão 60 |

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
| RLS | INSERT: policy existe para anon/authenticated mas `WITH CHECK (false)` — REST API direta bloqueada (FC039); inserts legítimos via service_role em `/api/leads/landing` \| SELECT: service_role only |
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

## Backup S3 (FC043 — sessão 49)

> **Status (FC044 — 13/06/2026):** Configuração S3 adiada para Backlog de Infraestrutura por decisão de negócio.
> Container, scripts e código prontos. Ativar configurando as vars abaixo no `.env` do VPS quando necessário.

| Item | Valor |
|---|---|
| Container | `rc_backup` (`postgres:17-alpine`) |
| Script | `/opt/revendaclick/backup.sh` montado como `/scripts/backup.sh:ro` |
| Schedule | Diário às 03:00 UTC |
| Local | `/opt/revendaclick/backups/` — retenção 7 dias |
| S3 prefix | `revendaclick/YYYY/MM/backup-TIMESTAMP.sql.gz` |
| S3 retenção | 30 dias via lifecycle policy |
| Vars necessárias | `BACKUP_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` |

```bash
# Backup manual imediato
ssh root@2.24.67.84 "docker exec rc_backup bash /scripts/backup.sh"

# Ver logs do backup
ssh root@2.24.67.84 "docker logs rc_backup --tail 50"

# Listar backups locais
ssh root@2.24.67.84 "ls -lh /opt/revendaclick/backups/"

# Listar backups no S3
ssh root@2.24.67.84 "docker exec rc_backup aws s3 ls s3://\$BACKUP_S3_BUCKET/revendaclick/ --recursive"

# Validar restauração (mais recente)
ssh root@2.24.67.84 "/opt/revendaclick/scripts/restore-from-s3.sh"

# Configurar lifecycle S3 (executar UMA vez após criar o bucket)
ssh root@2.24.67.84 "/opt/revendaclick/scripts/configure-s3-lifecycle.sh"
```

---

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

## Tenants — estado completo (06/08/2026 — sessão 64)

| Tenant | Plano | Status | tenant_id | Notas |
|---|---|---|---|---|
| `santos-car` | **Pro** | canceled | `fd1172f6-11e7-4555-8fe3-082fd1849587` | **Único tenant do banco.** Tenant do owner — homologação. `cpf_cnpj` preenchido na sessão 64 para permitir teste de assinatura na conta Asaas nova |

> **Sessão 64 (06/08/2026):** todos os demais tenants foram **excluídos definitivamente** do
> Supabase por decisão do usuário — eram todos de teste. Removidos: `devecar`, `finalcar`,
> `auditoria-rc-s42`, `revenda-click`. Junto foram removidos os respectivos `auth.users`,
> os dados em cascata e os objetos órfãos de storage. `sandbox-revendaclick`, documentado
> aqui até então, **já não existia no banco** — a linha era divergência documental.
> Backup pré-operação: `/opt/revendaclick/backups/backup-2026-08-06T11-24-57Z.sql.gz`.

## Usuários (auth.users) — 06/08/2026

| E-mail | Papel | Tenant |
|---|---|---|
| `dilneysantos@gmail.com` | owner | santos-car |
| `dilneysantos.developer@gmail.com` | super_admin | — (tenant_id NULL) |
| `desconto.do.dono@gmail.com` | seller | santos-car |

## super_admin

- Email: `dilneysantos.developer@gmail.com`
- `public.users.role = 'super_admin'`
- `public.users.tenant_id = NULL` (migration 025)
- Acesso: `GET /admin` no frontend
