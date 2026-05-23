# 02 — MAPA DE PASTAS

> Cada arquivo relevante com caminho, função e impacto ao alterar.
> Baseado em leitura direta dos arquivos do repositório.

---

## Raiz do Projeto `/`

| Arquivo | Função | Impacto ao alterar |
|---|---|---|
| `docker-compose.yml` | Compose de desenvolvimento | Afeta ambiente local dos devs |
| `docker-compose.prod.yml` | Compose produção (referência) | Afeta deploy manual |
| `docker-compose.production.yml` | Compose usado pelo CI/CD | Afeta deploy automático |
| `docker-compose.staging.yml` | Compose de staging | Afeta testes de staging |
| `nginx.conf` | Proxy reverso, SSL, rate limit, cache | Afeta todos os domínios em produção |
| `Makefile` | Atalhos de build/run | Apenas conveniência local |
| `vps-setup.sh` | Provisionamento inicial do VPS | Só usado na primeira configuração |
| `.env.example` | Template de variáveis raiz | Referência — não afeta produção |
| `.github/workflows/ci.yml` | Pipeline CI/CD completo | Afeta como deploy acontece |

---

## Backend `/backend/`

### Entrypoint

| Arquivo | Função | Impacto |
|---|---|---|
| `cmd/api/main.go` | Inicia servidor, configura logger, db, BetterStack | Qualquer mudança afeta boot inteiro |
| `internal/server/server.go` | Registra todos os módulos e rotas | Afeta roteamento de toda API |
| `internal/config/config.go` | Carrega env vars, busca JWKS do Supabase | Afeta toda configuração do sistema |
| `internal/db/db.go` | Pool pgx: SimpleProtocol, max=10, timeout=10s | Afeta performance e PgBouncer |
| `go.mod` | Dependências Go | Atualizar versões pode quebrar compatibilidade |

### Módulos (padrão: handler → service → repository)

| Pasta | Função | Impacto |
|---|---|---|
| `internal/ai/` | OpenRouter: suggest-reply, classify-lead | Afeta features de IA |
| `internal/analytics/` | Analytics com cache TTL in-memory | Afeta painel analytics |
| `internal/audit/` | Audit trail de ações | Afeta log de auditoria |
| `internal/betterstack/` | Envio de logs para BetterStack | Afeta observabilidade remota |
| `internal/billing/` | Asaas: planos, subscribe, cancel, webhooks | Afeta billing/monetização |
| `internal/config/` | Carrega configuração da aplicação | Afeta boot |
| `internal/customers/` | CRUD de clientes da revenda | Afeta gestão de clientes |
| `internal/db/` | Pool de conexões PostgreSQL | Afeta todo acesso ao banco |
| `internal/evolution/` | WhatsApp: proxy, webhook, sync leads | Afeta integração WhatsApp |
| `internal/financial/` | Entradas, vendas, comissões | Afeta módulo financeiro |
| `internal/leads/` | CRUD leads + atividades CRM | Afeta módulo de leads/CRM |
| `internal/middleware/` | Auth JWT, tenant, subscription, rate limit | Afeta segurança de toda API |
| `internal/observability/` | Métricas Prometheus, coleta DB/business | Afeta monitoring |
| `internal/onboarding/` | Setup tenant na primeira vez | Afeta cadastro de novos clientes |
| `internal/plans/` | Listagem de planos e usage | Afeta pricing e limites |
| `internal/response/` | Helpers de resposta HTTP | Afeta formato de todos os erros |
| `internal/server/` | Router Gin com todos os módulos | Afeta roteamento total |
| `internal/tenant/` | CRUD do tenant (loja) | Afeta dados da revenda |
| `internal/users/` | CRUD usuários e vendedores | Afeta gestão de equipe |
| `internal/vehicles/` | CRUD veículos + público marketplace | Afeta vitrine e estoque |

### Middleware críticos

| Arquivo | Função | Risco se remover |
|---|---|---|
| `middleware/auth.go` | Valida JWT Bearer (ES256/HS256) | Toda API fica sem auth |
| `middleware/tenant.go` | Resolve tenant_id do JWT ou banco | Cross-tenant data leak |
| `middleware/subscription.go` | Bloqueia tenant com sub inativa | Clientes inadimplentes acessam tudo |
| `middleware/plan_gate.go` | Bloqueia features não inclusas no plano | Features premium ficam gratuitas |
| `middleware/ratelimit.go` | Token-bucket 20rps por IP | DDoS sem proteção |
| `middleware/security.go` | HSTS, X-Frame, CSP, MaxBodySize | Vulnerabilidades de segurança |

---

## Frontend `/frontend/`

### Configuração

| Arquivo | Função | Impacto |
|---|---|---|
| `middleware.ts` | Auth guard + cookie refresh + header injection | Toda proteção de rotas |
| `lib/proxy.ts` | apiCall() e publicFetch() → backend Go | Toda comunicação com API |
| `lib/supabaseServer.ts` | createClient() e createServiceClient() | Auth SSR e bypass RLS |
| `lib/supabaseClient.ts` | createClient() singleton browser | Auth client-side |
| `lib/tenant.ts` | getTenantForUser(), getUsageFromAPI(), PlanUsage types | Dashboard layout |
| `lib/billing.ts` | getSubscription(), status formatters | Tela de billing |
| `instrumentation.ts` | BetterStack init server-side | Log de erros server |

### Rotas principais

| Arquivo | Rota | Função | Impacto |
|---|---|---|---|
| `app/layout.tsx` | `/` (root) | Layout raiz | Afeta toda aplicação |
| `app/page.tsx` | `/` | Home/landing | Primeira impressão |
| `app/(dashboard)/layout.tsx` | `/dashboard/*` | Auth + tenant + sub gate | Acesso ao dashboard inteiro |
| `app/(dashboard)/dashboard/page.tsx` | `/dashboard` | Dashboard principal | KPIs principais |
| `app/(dashboard)/leads/page.tsx` | `/leads` | Lista de leads | Módulo CRM |
| `app/(dashboard)/crm/page.tsx` | `/crm` | Kanban CRM | Módulo CRM visual |
| `app/(dashboard)/vehicles/page.tsx` | `/vehicles` | Gestão de veículos | Módulo de estoque |
| `app/(dashboard)/billing/page.tsx` | `/billing` | Assinatura | Gestão do plano |
| `app/(dashboard)/settings/page.tsx` | `/settings` | Configurações da loja | Dados da revenda |
| `app/(public)/[slug]/page.tsx` | `/:slug` | Vitrine pública | SEO + marketplace |
| `app/(public)/[slug]/[vehicleSlug]/page.tsx` | `/:slug/:vehicleSlug` | Página do veículo | SEO + lead |
| `app/auth/callback/route.ts` | `/auth/callback` | PKCE callback Supabase | Login/confirm email |
| `app/onboarding/page.tsx` | `/onboarding` | Setup inicial da loja | Primeiro acesso |

### API Routes (Route Handlers)

| Arquivo | Método | Função | Impacto |
|---|---|---|---|
| `api/billing/cancel-action/route.ts` | POST | Cancela subscription | Billing |
| `api/billing/subscribe-action/route.ts` | POST | Assina plano | Billing |
| `api/evolution/*/route.ts` | GET/POST | Proxy Evolution API | WhatsApp |
| `api/fipe/*/route.ts` | GET | Consulta tabela FIPE | Precificação |
| `api/upload/vehicle-photo/route.ts` | POST | Upload Supabase Storage | Fotos de veículos |
| `api/log/error/route.ts` | POST | Error tracking client-side | Observabilidade |
| `api/health/route.ts` | GET | Health check frontend | Monitoring |

### Componentes críticos

| Arquivo | Função | Impacto |
|---|---|---|
| `components/layout/DashboardShell.tsx` | Sidebar + nav | Layout do dashboard inteiro |
| `components/ui/FeatureGate.tsx` | Bloqueia UI por feature flag | Monetização |
| `components/ui/PlanAlertBanner.tsx` | Aviso de uso ≥ 80% | Retenção e upsell |
| `components/ui/SubscriptionBanner.tsx` | Aviso past_due/trialing | Retenção |
| `components/vehicles/VehicleForm.tsx` | Formulário de veículo | Cadastro de estoque |
| `components/crm/LeadKanban.tsx` | Kanban de leads | CRM visual |
| `components/whatsapp/WhatsAppManager.tsx` | Gestão conexão WhatsApp | Integração WA |

---

## Banco de Dados `/database/`

| Arquivo | Função | Impacto ao alterar |
|---|---|---|
| `schema.sql` | Schema completo inicial | Base de toda estrutura |
| `seed.sql` | Dados iniciais (planos) | Planos disponíveis |
| `migrations/001_initial_schema.sql` | Aplica schema.sql | Estrutura principal |
| `migrations/002_customers.sql` | Tabela customers | Módulo de clientes |
| `migrations/003_financial.sql` | financial_entries, sales, commissions | Módulo financeiro |
| `migrations/004_billing.sql` | Campos Asaas + trigger grace_until | Billing/pagamentos |
| `migrations/005_billing_extended.sql` | Extensões de billing | Billing avançado |
| `migrations/006_followups_audit.sql` | Follow-ups + audit_log | CRM e auditoria |
| `migrations/007_storage.sql` | Supabase Storage buckets/policies | Upload de fotos |
| `migrations/008_users_vendors.sql` | vendor_invitations + view plan_usage | Equipe + uso |
| `migrations/009_performance_indexes.sql` | Índices adicionais | Performance de queries |
| `migrations/010_security_hardening.sql` | RLS reforçado | Segurança |

---

## Scripts `/scripts/`

| Arquivo | Função | Quando usar |
|---|---|---|
| `smoke-test.sh` | 10 verificações pós-deploy | Após qualquer deploy |
| `deploy-production.sh` | Deploy manual produção | Quando CI falhar |
| `staging-deploy.sh` | Deploy staging | Testes antes de prod |
| `validate-production.sh` | Checklist pós-deploy | Validação completa |
| `validate-billing.sh` | Testa endpoints billing | Após mudar billing |
| `deploy-ssl.sh` | Provisiona SSL Certbot | Novos domínios |
| `validate-ssl.sh` | Valida certificados | Renovação SSL |
| `create-staging-admin.sh` | Cria admin staging | Setup staging |

---

## Infra `/infra/`

| Arquivo | Função | Impacto |
|---|---|---|
| `scripts/backup.sh` | pg_dump + S3 upload | Backup diário do banco |
| `scripts/deploy.sh` | Deploy manual alternativo | Deploy sem CI |
| `scripts/vps-setup.sh` | Provisionamento VPS | Só uso inicial |
| `.env.prod.example` | Template env de produção | Referência |
