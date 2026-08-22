# AUDITORIA COMPLETA — RevendaClick

> Executada em 21/08/2026. Ambiente: repositório local `/home/dilneysantos/00-Projetos/01-revendaclick`,
> git limpo na branch `main` (`origin/main`), tag de checkpoint
> `checkpoint-pre-auditoria-20260821-220722` preservada intacta.
>
> **Contexto importante:** este NÃO é um projeto de laboratório. É um SaaS real, em produção, com
> domínio próprio (`app.revendaclick.com.br` / `api.revendaclick.com.br`), conta de pagamento real
> (Asaas), banco Supabase de produção e **um tenant real** (`santos-car`). Toda a metodologia abaixo
> foi adaptada para nunca escrever/mutar dados reais de negócio, nunca cobrar/mover dinheiro real, e
> nunca acionar serviços externos reais de forma destrutiva — conforme instruído. Onde isso limitou a
> profundidade de um teste, está documentado explicitamente na seção 14.

---

## 1. Resumo executivo

O RevendaClick é um SaaS multi-tenant maduro (Next.js 16 + Go/Gin + Supabase Postgres), com 65
sessões de desenvolvimento documentadas e 67 bugs de produção já corrigidos e catalogados
(`docs-operacao/FalhasCorrigidas/`). A auditoria estática (type-check, lint, build, `go vet`,
`go build`, `go test`) não encontrou nenhum erro — o repositório já estava limpo antes desta sessão.

A auditoria dinâmica (subir o backend e o frontend de verdade, localmente, apontando para o banco de
produção real em modo **somente leitura**, e fazer login real com credenciais de teste já
provisionadas em `frontend/e2e/.env.e2e`) encontrou **um bug real e ativo em produção**:
`GET /api/usage` retornava HTTP 500 para qualquer tenant cuja assinatura não estivesse em
`active`/`trialing`/`past_due` — e é exatamente o estado do único tenant real hoje (`santos-car`,
status `canceled`). Isso quebrava silenciosamente o dashboard (KPIs de uso e `PlanAlertBanner`) do
único cliente real da plataforma. **Causa raiz identificada, corrigida, validada contra o banco de
produção real (leitura) e commitada isoladamente.**

A suíte E2E (Playwright) existente foi executada contra produção (excluindo o único teste que
escreveria em dados reais de um tenant real). 8 dos 9 testes executáveis falharam — não por bug de
código, mas porque todos dependem de o tenant de teste ter assinatura ativa, e hoje ele está
`canceled` (estado de negócio documentado e intencional, não um defeito). Isso é reportado como
limitação de ambiente, não como falha de produto — e é evidência **corroborante** do mesmo bug
corrigido no item acima (o gate de assinatura barrando o tenant é o comportamento correto).

Nenhuma vulnerabilidade crítica de segurança foi encontrada nas áreas auditadas (isolamento
multi-tenant, autenticação JWT, autorização por papel, proteção de rotas admin, upload de arquivos,
CORS, exposição de segredos). Um ponto de atenção de configuração (fail-open condicional no webhook
do Asaas se `ASAAS_WEBHOOK_TOKEN` estiver vazio) foi identificado e documentado como recomendação —
não foi alterado, por exigir autorização explícita conforme a governança do próprio projeto
(`.claude/02_AUTORIZACOES.md` lista "billing" e "Asaas" como sensíveis).

## 2. Status geral

| Item | Status |
|---|---|
| Build (frontend) | PASS |
| Lint (frontend) | PASS (2 warnings não-bloqueantes, pré-existentes) |
| Type-check (frontend) | PASS |
| Backend `go build` / `go vet` / `go test` | PASS |
| Execução real (frontend + backend local) | PASS |
| Autenticação real (login contra Supabase de produção) | PASS |
| Isolamento multi-tenant (estático) | PASS |
| E2E (Playwright) | PARCIAL — ver seção 6 e 14 |
| Falha crítica em produção encontrada e corrigida | SIM (1) — ver seção 7/8 |
| Falha crítica/alta remanescente | NENHUMA conhecida |

## 3. Inventário técnico

**Stack oficial** (confirmado em `CLAUDE.md` e no código real):

- Frontend: Next.js 16.2.6 (App Router, Turbopack), React 19, TypeScript 5.7, Tailwind 3.4, `@supabase/ssr`.
- Backend: Go 1.25 (toolchain local 1.22.2 — compilou sem problemas via `GOTOOLCHAIN` automático), Gin, `pgx/v5`, `golang-jwt/v5`, `zap`.
- Banco: Supabase Postgres (projeto `ibgaywezfcbbiiziaoac`), RLS, `tenant_id` em tabelas de negócio.
- Autenticação: Supabase Auth (JWT HS256/ES256 verificado no backend Go), `app_metadata.tenant_id` / `app_metadata.user_role` no claim.
- Integrações externas: Asaas (billing), Evolution API (WhatsApp), OpenRouter (IA), Resend (e-mail transacional), BetterStack (observabilidade), FIPE (preços de veículos via proxy).
- Deploy: Vercel (frontend) + VPS/Docker (backend) + CI/CD GitHub Actions. Não alterado, não acionado nesta auditoria.

**Scripts disponíveis** (`frontend/package.json`): `dev`, `build`, `start`, `lint`, `type-check`, `test:e2e`, `test:e2e:ui`, `test:e2e:report`.
**Backend**: `go build ./...`, `go vet ./...`, `go test ./...`, `Makefile` próprio.

**Variáveis de ambiente** (nomes, sem valores): `.env.example` (raiz) e `backend/.env.example` listam
`ASAAS_API_KEY`, `ASAAS_ENV`, `ASAAS_WEBHOOK_TOKEN`, `DATABASE_URL`, `EVOLUTION_API_KEY`,
`EVOLUTION_API_URL`/`EVOLUTION_DATABASE_URL`, `METRICS_TOKEN`, `NEXT_PUBLIC_API_URL`,
`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `ALLOWED_ORIGINS`,
`WEBHOOK_SECRET`, `PORT`, `ENV`, `LEAD_NOTIFY_INSTANCE`, `LEAD_NOTIFY_NUMBER`,
`BETTER_STACK_SOURCE_TOKEN`.

**Testes existentes**: 4 pacotes Go com testes unitários (`billing`, `leads`, `observability`,
`onboarding` — todos passam). 5 specs Playwright em `frontend/e2e/` (`01_onboarding`,
`02_billing_subscribe`, `03_upgrade_downgrade`, `04_whatsapp_addon`, `05_ia_recovery`).

**Documentação existente**: extensa e bem mantida — `docs-operacao/` (estado real do sistema, 65
sessões, 67 falhas corrigidas documentadas em `FalhasCorrigidas/`), `docs-produto/` (visão e requisitos),
governança em `CLAUDE.md`, `.claude/01_CONTEXTO.md`, `.claude/02_AUTORIZACOES.md`,
`.claude/03_FLUXO_TRABALHO.md`, `.claude/04_VALIDACAO.md`, `AI_GOVERNANCE/00_POLITICA_GERAL.md`. Essas
regras foram lidas e seguidas: nenhuma migration, alteração de RLS, autenticação, deploy, CI/CD,
Docker, Nginx, variável de ambiente, ou serviço externo foi alterada. A única correção de código feita
(seção 7/8) é uma correção de handler/repository backend — categoria explicitamente permitida em
`02_AUTORIZACOES.md` ("Pode alterar quando a tarefa pedir": handlers, services, repositories) — e foi
validada por leitura contra o banco real antes de commitar.

**TODOs/FIXME**: nenhum encontrado em código-fonte rastreado (`git grep` por `TODO|FIXME|XXX:|HACK:`
retornou vazio).

**Achado de higiene (não é bug de segurança, é documentado por transparência)**: existe um arquivo
`/.env.e2e` (raiz do projeto, 63 bytes) contendo apenas duas linhas de senha, aparentemente um resíduo
duplicado do arquivo real `frontend/e2e`-relacionado `frontend/.env.e2e` (876 bytes, completo). Ambos
estão corretamente listados em `.gitignore` (`.gitignore:23`) e **nunca foram commitados**
(`git log --all -- .env.e2e` não retorna nada). Nenhuma ação foi tomada — é um arquivo local, não
rastreado, fora do escopo de "corrigir código".

## 4. Auditoria estática

| Verificação | Comando | Resultado |
|---|---|---|
| TypeScript | `npx tsc --noEmit` (frontend) | PASS — 0 erros |
| ESLint | `npx eslint . --ext .ts,.tsx` (frontend) | PASS — 0 erros, 2 warnings (`react-hooks/set-state-in-effect` em `AdminShell.tsx:170` e `DashboardShell.tsx:193` — padrão comum e seguro de fechar menu mobile ao trocar de rota; não bloqueia build, não é bug funcional) |
| Build de produção | `npx next build` | PASS — 68 rotas geradas, compilado em ~27s, 0 erros |
| `go vet ./...` | backend | PASS — 0 avisos |
| `go build ./...` | backend | PASS |
| `go test ./...` | backend | PASS — 4 pacotes com testes, todos verdes |
| Segredos hardcoded | `git grep` por padrões `key/secret/password/token = "..."` em `.go/.ts/.tsx/.js` | Nenhum encontrado |
| Arquivos `.env*` commitados | `git log --all -- .env*` | Nenhum jamais commitado; todos corretamente ignorados |
| SQL injection (concatenação de string em query) | `grep` por `fmt.Sprintf` com `SELECT/INSERT/UPDATE/DELETE` | Nenhum encontrado — todas as queries usam parâmetros posicionais (`$1`, `$2`...) |
| Isolamento multi-tenant (estático) | `grep` de `tenant_id` em todos os `repository.go` + checagem manual de `GetByID/Update/Delete` em `vehicles`, `leads`, `customers`, `users`, `financial` | Todas as operações por `id` também filtram por `tenant_id` vindo do contexto JWT (nunca do input do cliente) |
| Proteção de rotas admin | Leitura de `server.go` | Grupo `/api/admin` inteiro atrás de `jwtAuth` + `RequireRole("super_admin")`; grupo `/api` de negócio atrás de `jwtAuth + resolveTenant (+ subGate)` |
| XSS (`dangerouslySetInnerHTML`) | `grep` | Usado apenas para injetar JSON-LD (`JSON.stringify(schema)`) — dado estruturado interno, não input de usuário |
| Upload de arquivo | Leitura de `app/api/upload/vehicle-photo/route.ts` e `logo/route.ts` | MIME validado por whitelist, tamanho máx. 8MB, caminho de storage gerado pelo servidor (`{tenant_id}/{timestamp}-{random}.ext}`) — sem travessia de diretório, sem input de nome de arquivo do cliente |
| CORS | `server.go:54-60` | `AllowOrigins` vem de `cfg.AllowedOrigins` (variável de ambiente), não é wildcard |
| N+1 (heurística) | `grep` por queries dentro de loops nos repositórios de negócio | Nenhum padrão óbvio encontrado |

## 5. Testes executados (execução real)

Frontend e backend foram **de fato subidos localmente** (não apenas analisados):

1. `next dev --turbopack -p 3911` — subiu sem erro, compilou proxy/middleware, respondeu em todas as
   rotas testadas.
2. `go run ./cmd/api` com `PORT=8911 ENV=development`, usando `backend/.env` real (que aponta para o
   projeto Supabase de produção `ibgaywezfcbbiiziaoac`) — subiu sem erro, `/health` respondeu
   `{"status":"ok","db":"ok"}` (conexão real com o banco confirmada).

| Rota testada | Resultado |
|---|---|
| `GET /` (landing) | 200 |
| `GET /login` | 200 |
| `GET /sitemap.xml` | 200 |
| `GET /premium` (landing segmentada) | 200 |
| `GET /robots.txt` | 200 |
| `GET /rota-inexistente` | 404 (correto) |
| `GET /dashboard` sem sessão | 307 → `/login?redirect=%2Fdashboard` (correto) |
| `GET /admin` sem sessão | 307 → `/login?redirect=%2Fadmin` (correto) |
| `GET /api/health` (frontend) | 200 |
| Backend `GET /health` | 200, `db: ok` |
| Backend `GET /api/plans` (público) | 200 |
| Backend `GET /api/vehicles` sem JWT | 401 (correto) |
| Backend `GET /api/admin/tenants` sem JWT | 401 (correto) |

**Login real** foi feito via API do Supabase Auth (`POST /auth/v1/token?grant_type=password`) usando as
credenciais de teste já provisionadas pelo próprio projeto em `frontend/e2e/.env.e2e`
(`E2E_PRO_EMAIL`/`E2E_PRO_PASSWORD`, tenant real `santos-car`) — login bem-sucedido, JWT emitido com
`app_metadata.tenant_id` e `app_metadata.user_role=owner` corretos (confirma o fix do FC059
documentado continua funcionando).

Com o JWT real, endpoints protegidos foram testados (todos **GET**, somente leitura):

| Endpoint | Antes da correção | Depois da correção |
|---|---|---|
| `GET /api/tenants/me` | 200 | 200 |
| `GET /api/usage` | **500** (bug) | **200** (corrigido — ver seção 7) |
| `GET /api/vehicles` | 402 | 402 (correto — assinatura `canceled`, ver seção 6) |
| `GET /api/leads` | 402 | 402 (correto) |
| `GET /api/customers` | 402 | 402 (correto) |
| `GET /api/billing/subscription` | 200 | 200 |
| `GET /api/onboarding` | 200 | 200 |

Nenhuma chamada de escrita (`POST`/`PUT`/`PATCH`/`DELETE`) foi feita contra dados de negócio reais,
contra o Asaas, ou contra a Evolution API. Ambos os processos locais foram encerrados ao final dos
testes.

## 6. Testes E2E

Suíte Playwright já existente em `frontend/e2e/` foi executada contra o ambiente real de produção
(`E2E_BASE_URL=https://app.revendaclick.com.br`), conforme já configurado pelo próprio projeto em
`frontend/.env.e2e`.

**Antes de executar**, os 5 specs foram lidos integralmente para avaliar risco de escrita em dados
reais:

- `01_onboarding.spec.ts` — cria conta nova real. **Auto-skip** (exige
  `E2E_EMAIL_CONFIRMATION_DISABLED=true`, não configurado). Não executado — corretamente, evita criar
  tenant real.
- `02_billing_subscribe.spec.ts`, `04_whatsapp_addon.spec.ts`, `05_ia_recovery.spec.ts` — apenas
  navegação e asserções de UI (somente leitura). Executados.
- `03_upgrade_downgrade.spec.ts` — o **segundo** teste é só leitura (executado); o **primeiro**
  chama `POST /api/admin/billing/simulate-event` com o `E2E_TEST_TENANT_ID`, que é o **mesmo
  tenant_id do santos-car real** (confirmado comparando com o `tenant_id` do JWT obtido no login real).
  Esse teste **muta o status da assinatura do único tenant real de produção**. Foi **excluído
  deliberadamente** da execução (`--grep-invert "simulate-event"`), em respeito à regra de não
  escrever em dados reais de produção.

**Resultado**: 8 de 9 testes executáveis falharam, 1 pulado (o de escrita, deliberadamente).

Todas as 8 falhas têm a **mesma causa, comprovada pelos logs do Playwright**: após login bem-sucedido,
em vez de chegar em `/dashboard`, a navegação é redirecionada para
`https://app.revendaclick.com.br/billing?reason=blocked` — o `SubscriptionGate` do backend
(`backend/internal/middleware/subscription.go`) bloqueando corretamente o acesso porque a assinatura do
tenant está `canceled` (não é `active`/`trialing`/`past_due`).

**Isso não é um bug de produto.** É o comportamento correto e intencional do gate de assinatura (ver
código citado na seção 7), e o estado `canceled` do tenant `santos-car` é uma decisão de negócio já
documentada em `docs-operacao/23_PROXIMO_PASSO.md` (troca de conta Asaas, teste de assinatura real
ainda pendente de execução manual pelo usuário). A suíte E2E foi escrita quando o tenant tinha
assinatura ativa e não foi atualizada desde a mudança de estado — está desatualizada em relação ao
estado atual de dados, não em relação ao código. Ver seção 14 para o registro formal dessa limitação.
**Nenhuma asserção de teste foi alterada para mascarar isso**, conforme a regra de não alterar
expectativas de teste para esconder falha.

## 7. Falhas encontradas

### F1 — [ALTO, CORRIGIDO] `GET /api/usage` retorna HTTP 500 quando a assinatura do tenant não está em `active`/`trialing`/`past_due`

- **Onde**: `backend/internal/plans/repository.go`, função `GetUsage` (query `WHERE s.tenant_id = $1 AND s.status IN ('active','trialing','past_due')`).
- **Causa raiz**: a query só retorna linha quando o status da assinatura está numa dessas 3 categorias. Quando o tenant tem assinatura `canceled` (ou `paused`), a query não bate nenhuma linha; `pool.QueryRow(...).Scan(...)` retorna `pgx.ErrNoRows`; o handler (`internal/plans/handler.go`) tratava qualquer erro como `response.InternalError` → HTTP 500.
- **Impacto real**: `/api/usage` alimenta os KPIs de uso do dashboard e o `PlanAlertBanner`
  (comentário no próprio `server.go:154`). O frontend (`frontend/lib/tenant.ts:getUsageFromAPI`) trata
  qualquer resposta não-OK como `null` e simplesmente esconde os widgets — então o sintoma em produção
  era um dashboard "mudo" (sem erro visível, mas sem KPIs de uso nem aviso de plano), sem log de erro
  explicativo do lado do usuário. Isso afeta **o único tenant real da plataforma hoje**
  (`santos-car`, status `canceled` desde a troca de conta Asaas documentada em D37).
- **Evidência**: reproduzido contra o banco de produção real, em modo leitura, com login real do owner
  do tenant `santos-car`: `GET /api/usage` → `500 {"error":{"code":"internal_error",...}}` antes da
  correção.
- **Severidade**: Alta (quebra de funcionalidade visível em produção para o único cliente real; sem
  exposição de dados, sem impacto de segurança).

### F2 — [MÉDIO, NÃO ALTERADO — recomendação registrada] Webhook do Asaas em modo "fail-open" se o token não estiver configurado

- **Onde**: `backend/internal/billing/handler.go:299-305` — `if h.asaasToken != "" { valida token } ` — se `ASAAS_WEBHOOK_TOKEN` estiver vazio, **nenhuma validação é feita** e qualquer requisição não autenticada é aceita como evento de billing legítimo (poderia, em tese, ativar/cancelar assinaturas).
- **Situação real**: os próprios docs de operação (`docs-operacao/23_PROXIMO_PASSO.md`, item D37)
  registram que o webhook **foi validado em produção** com token correto/incorreto retornando os
  códigos esperados (400/401), o que indica que `ASAAS_WEBHOOK_TOKEN` **está configurado** no VPS de
  produção hoje. Não há evidência de que este seja um bug ativo — é um **risco de configuração
  futura** (fail-open silencioso caso a variável seja removida ou fique vazia por engano num deploy).
- **Por que não foi corrigido nesta sessão**: alterar a lógica de autenticação de webhook de billing
  está explicitamente listado em `.claude/02_AUTORIZACOES.md` como algo que **exige autorização prévia**
  ("Deve pedir autorização antes de mexer em: ... billing, Asaas ... APIs públicas"), e o
  comportamento atual em produção já está correto e validado. Registrado como recomendação: fazer o
  endpoint recusar (fail-closed) quando `cfg.IsProd()` e o token estiver vazio, em vez de aceitar sem
  validação.
- **Severidade**: Média (risco de configuração, não uma falha ativa comprovada).

### F3 — [BAIXO, informativo] 2 warnings de ESLint (`react-hooks/set-state-in-effect`)

- **Onde**: `frontend/app/(admin)/_components/AdminShell.tsx:170`, `frontend/components/layout/DashboardShell.tsx:193`.
- **Descrição**: `useEffect(() => { setMobileOpen(false) }, [pathname])` — padrão comum para fechar o
  menu mobile ao navegar. Funcionalmente correto; o linter sinaliza como não-ideal para performance
  (potencial cascata de renders), mas não causa bug visível nem falha de build.
- **Severidade**: Baixa / melhoria. Não corrigido nesta sessão (fora do escopo de "bug real"; risco de
  regressão desnecessário para um ganho cosmético).

### F4 — [INFORMATIVO] Suíte E2E desatualizada em relação ao estado de dados atual de produção

Ver seção 6. Não é um defeito de código — é uma dependência de dado de teste (tenant com assinatura
ativa) que não reflete mais o estado real do único tenant de produção.

Nenhuma outra falha crítica, alta, de segurança ou de isolamento multi-tenant foi encontrada nas áreas
efetivamente testadas (ver seção 14 para o que não pôde ser testado e por quê).

## 8. Correções realizadas

### Correção de F1

**Antes** (`backend/internal/plans/repository.go`):
```go
FROM subscriptions s
JOIN plans pl ON pl.id = s.plan_id
WHERE s.tenant_id = $1
  AND s.status IN ('active', 'trialing', 'past_due')`, tenantID,
```

**Depois**:
```go
FROM subscriptions s
JOIN plans pl ON pl.id = s.plan_id
WHERE s.tenant_id = $1
ORDER BY s.updated_at DESC
LIMIT 1`, tenantID,
```

A query agora busca a assinatura mais recente do tenant **independente do status**, preservando o
`subscription_status` real (`canceled`, `paused` etc.) no payload — que o frontend já sabe exibir
(`dashboard/page.tsx:190` já renderiza `Status: {usage.subscription_status}`), confirmando que o
comportamento correto sempre foi devolver o status real, não omitir a resposta. A escolha de
`ORDER BY updated_at DESC LIMIT 1` (em vez de assumir unicidade) é uma proteção defensiva consistente
com o padrão já usado em `SubscriptionGate` (`backend/internal/middleware/subscription.go`), que
consulta a mesma tabela por `tenant_id` sem filtro de status.

Adicionalmente, em `backend/internal/plans/handler.go`, o caso genuíno de "tenant sem nenhuma
assinatura" (`pgx.ErrNoRows`, cenário que não deveria ocorrer pós-onboarding, mas é tratado
defensivamente) agora responde `404 {"code":"no_subscription"}` em vez de `500`, para não poluir
alertas de erro de servidor com um estado de negócio esperado.

**Arquivos alterados**: `backend/internal/plans/repository.go`, `backend/internal/plans/handler.go`.

**Validação**:
1. `go build ./...` — PASS.
2. `go vet ./...` — PASS.
3. `go test ./...` — PASS (nenhuma regressão nos pacotes com teste).
4. Reprodução end-to-end contra o banco de produção real (leitura): backend local reiniciado, mesmo
   JWT real do tenant `santos-car` usado antes → `GET /api/usage` passou de `500` para `200`, com
   payload correto: `subscription_status: "canceled"`, `plan_name: "pro"`, contagens reais de
   veículos/usuários/leads e feature flags corretas.

Nenhuma migration, alteração de schema, RLS, autenticação ou variável de ambiente foi tocada.

## 9. Testes de regressão

Após a correção, toda a bateria estática e de execução foi refeita:

| Verificação | Resultado pós-correção |
|---|---|
| `go build ./...` | PASS |
| `go vet ./...` | PASS |
| `go test ./...` | PASS (billing, leads, observability, onboarding) |
| `next build` (não re-executado após o fix backend, pois o fix não toca frontend) | PASS (já validado na seção 4, nenhum arquivo frontend alterado) |
| `GET /api/usage` com tenant ativo (comportamento anterior) | Query genérica `ORDER BY updated_at DESC LIMIT 1` preserva o comportamento para status `active`/`trialing`/`past_due` — mesma linha que já era retornada antes, sem regressão |
| `GET /api/usage` com tenant `canceled` (bug original) | 500 → 200, corrigido e confirmado |
| Demais endpoints protegidos (`/api/tenants/me`, `/api/billing/subscription`, `/api/onboarding`) | Continuam 200, sem regressão |
| Endpoints gated (`/api/vehicles`, `/api/leads`, `/api/customers`) | Continuam 402 para assinatura `canceled` — comportamento correto e inalterado (protegido por `SubscriptionGate`, não pelo código corrigido) |

Nenhuma regressão identificada.

## 10. Auditoria de segurança

| Área | Resultado |
|---|---|
| Autenticação (JWT Supabase, HS256/ES256) | PASS — validação de assinatura, expiração obrigatória (`jwt.WithExpirationRequired()`), audience `authenticated` exigida |
| Autorização por papel (`RequireRole`) | PASS — rotas admin exigem `super_admin`; rotas de escrita sensíveis exigem `owner`/`admin` |
| Isolamento multi-tenant | PASS (estático) — toda query de leitura/escrita/exclusão por `id` em `vehicles`, `leads`, `customers`, `users`, `financial`/`sales`/`commissions` também filtra por `tenant_id` obtido do JWT (nunca do parâmetro de URL/body do cliente) |
| IDOR (acesso horizontal indevido) | PASS (estático) — nenhuma rota encontrada que aceite `tenant_id` do cliente para sobrescrever o do contexto |
| Rotas admin sem proteção | PASS — confirmado por código e por teste real (`GET /api/admin/tenants` sem JWT → 401) |
| Exposição de secrets em código | PASS — nenhum literal de secret encontrado; todos os arquivos `.env*` corretamente ignorados e nunca commitados |
| CORS | PASS — origem configurável via env, não wildcard, `AllowCredentials` combinado com origem explícita |
| Upload de arquivo | PASS — MIME/tamanho validados, caminho gerado pelo servidor, sem input de nome de arquivo do cliente, sem travessia de diretório |
| XSS | PASS (estático) — únicos usos de `dangerouslySetInnerHTML` injetam JSON-LD gerado internamente, não HTML de usuário |
| SQL injection | PASS (estático) — 100% das queries usam parâmetros posicionais `pgx`, nenhuma concatenação de string com `fmt.Sprintf` em SQL |
| Webhooks — autenticação | PARCIAL — Evolution e Asaas validam token/apikey quando configurado; **ver F2**: fail-open se a variável estiver vazia (risco de configuração, não vulnerabilidade ativa comprovada) |
| Rate limiting | PASS — `RateLimit(20,60)` global por IP + `StrictRateLimit()` em rotas caras (`onboarding/setup`, `billing/subscribe`, `billing/upgrade`, `billing/reactivate`) |
| Tamanho máximo de body | PASS — `MaxBodySize(512KB)` global |
| Security headers | PASS — middleware `SecurityHeaders()` presente (confirmado header `Permissions-Policy` nas respostas reais) |
| RLS Supabase | NÃO TESTADO diretamente nesta sessão (ver seção 14) — a proteção observada é a nível de aplicação (backend Go), que é a camada primária de acesso a dados de negócio; RLS no Postgres não foi inspecionada via SQL direto para não fazer alterações/queries fora do escopo com credenciais de serviço |
| CSRF | Não aplicável ao padrão da API (Bearer JWT em header `Authorization`, sem cookies de sessão usados pelo backend Go para autenticação de API — o Next.js usa cookies apenas para a própria sessão Supabase SSR) |

## 11. Performance

Escopo limitado nesta sessão (não solicitado como foco principal, e testes de carga contra produção
real são explicitamente vedados pelas regras de não escrita/stress contra serviços reais):

- `next build` completou em ~27s, 68 rotas, sem alertas de bundle excessivo no output padrão.
- Nenhum padrão óbvio de N+1 (query dentro de loop) encontrado nos repositórios de negócio
  (`vehicles`, `leads`, `customers`, `financial`) via inspeção manual e heurística de `grep`.
- Índices de banco e planos de query **não foram auditados** (exigiria `EXPLAIN ANALYZE` contra
  produção — fora do escopo desta sessão para evitar carga/risco em produção real).
- Sem teste de carga/stress executado (deliberadamente, por ser um serviço real de produção).

## 12. Problemas restantes

| # | Problema | Severidade | Motivo de não ter sido corrigido |
|---|---|---|---|
| F2 | Webhook Asaas fail-open se `ASAAS_WEBHOOK_TOKEN` vazio | Média | Exige autorização explícita (governança do projeto lista billing/Asaas como sensível); comportamento atual em produção já é seguro segundo os próprios docs de operação — é uma recomendação preventiva, não uma correção de bug ativo |
| F3 | 2 warnings ESLint `set-state-in-effect` | Baixa | Padrão funcionalmente correto; risco/benefício de refatorar não justificado nesta sessão |
| — | RLS do Postgres não auditado via SQL direto | Não testável nesta sessão | Exigiria acesso com service-role contra o banco de produção para inspecionar políticas — decidido não fazer para manter a sessão estritamente somente-leitura pela via já validada (API HTTP) |

Nenhum problema crítico ou alto permanece em aberto.

## 13. Riscos

- **F2 (webhook fail-open)**: se `ASAAS_WEBHOOK_TOKEN` for removido/esvaziado por engano num futuro
  deploy, o endpoint `/api/webhooks/asaas` aceitaria eventos de billing não autenticados. Risco baixo
  hoje (token configurado e validado em produção segundo os docs), mas vale endereçar com autorização
  do responsável.
- **Tenant único em produção**: toda a plataforma hoje depende de um único tenant real
  (`santos-car`), com assinatura `canceled`. Qualquer novo bug de billing só será percebido quando
  esse tenant tentar reativar a assinatura — o que, segundo `docs-operacao/23_PROXIMO_PASSO.md`, ainda
  não foi testado ponta a ponta na conta Asaas nova. Risco de negócio, não de código.
- **Suíte E2E desatualizada em relação ao estado de dados**: enquanto o tenant de teste permanecer
  `canceled`, a suíte E2E (specs 02–05) continuará falhando por design do próprio gate de assinatura,
  mascarando eventuais regressões futuras em telas que dependem de assinatura ativa. Recomenda-se
  reativar a assinatura de teste (ou criar um tenant de sandbox ativo) antes de confiar nesses specs
  novamente.

## 14. Itens não testados (e por quê)

Em respeito às regras explícitas desta auditoria (nunca escrever/excluir em produção, nunca acionar
serviços externos reais de forma destrutiva):

- **Cadastro de novo tenant / onboarding completo end-to-end**: criaria um tenant real em produção.
  Spec `01_onboarding.spec.ts` auto-pulado por design do próprio projeto.
- **Assinatura real / upgrade / downgrade / cancelamento via Asaas real**: envolveria cobranças reais
  ou mutação do único cliente real. Não executado. A rota `POST /api/admin/billing/simulate-event`
  (que simula sem tocar o Asaas) foi identificada, mas o único teste que a usa mutaria o tenant real
  (`E2E_TEST_TENANT_ID` = `santos-car`) — não executado.
- **Conexão/desconexão real de WhatsApp (Evolution API)**: poderia derrubar a instância real do
  cliente. Não executado.
- **Envio real de e-mail (Resend) / lembrete de cobrança**: não acionado.
- **CRUD de escrita em vehicles/leads/customers/users/financial contra produção**: não executado (só
  leitura), para não criar/alterar/excluir dados reais do único tenant.
- **RLS do Postgres via SQL direto**: não inspecionado (ver seção 10/12).
- **Teste de carga/stress, Lighthouse/Core Web Vitals reais**: não executado contra produção.
- **Fluxos de Super Admin com escrita** (bloquear/quarentenar/excluir tenant, editar plano, editar
  usuário): não executados — todos envolveriam mutar o único tenant real ou dados de billing.
- **Upload real de imagem/logo**: código foi auditado estaticamente (seção 4/10); upload real não
  executado para não gravar arquivos no bucket de produção.
- **Responsividade visual e acessibilidade (WCAG) em navegador real**: não avaliado nesta sessão além
  do que os testes E2E (baseados em `getByRole`/`getByLabel`, que dependem de semântica ARIA correta)
  indiretamente exercitam. Sem captura de screenshot/Lighthouse.

Nenhum desses itens revelou indício de problema durante a auditoria estática — estão listados por
transparência de cobertura, não porque haja suspeita de falha.

## 15. Commits realizados

| Hash curto | Mensagem |
|---|---|
| `5470998` | `fix(billing): GET /api/usage retornava 500 para assinatura cancelada` |

Nenhum `git push` foi executado. Tag de checkpoint `checkpoint-pre-auditoria-20260821-220722`
preservada intacta, um commit à frente dela.

## 16. Resultado final

O sistema está estruturalmente saudável: build, lint, type-check, `go vet`/`go build`/`go test` e as
verificações de segurança estáticas realizadas passaram sem achados críticos. Foi encontrado e
corrigido um bug real e ativo em produção (F1) que quebrava o dashboard do único cliente real da
plataforma, com causa raiz identificada, correção mínima e cirúrgica, e validação contra dados reais
de produção em modo leitura. Um risco de configuração de médio impacto (F2) foi identificado e
documentado como recomendação, não corrigido por exigir autorização explícita sobre área sensível
(billing/Asaas) conforme a própria governança do projeto. A suíte E2E existente não pôde validar os
fluxos protegidos por assinatura porque o único tenant real está com assinatura cancelada — uma
condição de dado de produção, não um defeito de código, e devidamente registrada como limitação.

```
STATUS FINAL — RevendaClick: PASS
Falhas críticas restantes: 0
Falhas altas restantes: 0
Falhas médias restantes: 1
Falhas baixas restantes: 1
Build: PASS
Lint: PASS
Type-check: PASS
E2E: FAIL (limitação de dado de ambiente — tenant real com assinatura cancelada; ver seções 6 e 14; não é falha de código)
```
