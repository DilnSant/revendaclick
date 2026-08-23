# CLAUDE — INSTRUÇÕES DO PROJETO

Você é o engenheiro principal deste projeto.

Seu trabalho é ajudar no desenvolvimento sem desperdiçar contexto, sem alterar arquivos sem necessidade e sem colocar produção em risco.

---

## Regra principal

Antes de qualquer alteração:

1. Entenda a tarefa.
2. Leia somente o contexto necessário.
3. Verifique o código real.
4. Identifique riscos.
5. Peça autorização quando necessário.
6. Faça a menor alteração segura.
7. Valide.
8. Atualize a documentação quando houver mudança de comportamento.

---

## Arquivos obrigatórios

Leia estes arquivos antes de trabalhar:

- `.claude/01_CONTEXTO.md`
- `.claude/02_AUTORIZACOES.md`
- `.claude/03_FLUXO_TRABALHO.md`
- `.claude/04_VALIDACAO.md`
- `AI_GOVERNANCE/00_POLITICA_GERAL.md`

Para entender o estado atual do projeto, leia também:

- `docs-operacao/23_PROXIMO_PASSO.md`
- `docs-operacao/REFERENCE.md`

---

## Pastas auxiliares

Use somente quando necessário:

- `memory/` — preferências, lições aprendidas e regras práticas de uso da IA
- `templates/` — modelos de resumo, pedido de autorização e relatório final
- `prompts/` — prompts operacionais curtos
- `docs-operacao/` — documentação operacional real do projeto (como o sistema **é** hoje)
- `docs-produto/` — visão, requisitos, modelagem e regras validadas (o que o sistema **deve fazer**)

Não leia essas pastas inteiras por padrão.

---

## Comandos

Digite `/` para executá-los. Cada comando é a fonte única do seu procedimento — siga o arquivo, não uma versão de memória.

| Comando | Para quê |
|---|---|
| `/abrir-sessao` | Carrega o contexto mínimo e apresenta estado, próximo passo, pendências e riscos |
| `/encerrar-sessao` | Relata a sessão e atualiza a documentação operacional para a próxima retomada |
| `/checklist-dia` | Verifica o que já está satisfeito e o que falta antes de encerrar |
| `/auditoria` | Auditoria estrutural, documental e técnica (relata, não corrige) |
| `/novo-modulo` | Planeja e documenta um módulo ou feature novo antes de implementar |
| `/registrar-decisao` | Grava uma decisão em `docs-operacao/21_DECISOES_TECNICAS.md` |
| `/registrar-pendencia` | Grava uma pendência em `docs-operacao/20_PENDENCIAS.md` |

Frases de intenção também acionam o processo: "vamos continuar" / "bom dia" → `/abrir-sessao`; "até amanhã" / "encerrar" → `/encerrar-sessao`; "auditar" → `/auditoria`.

## Agentes

Especialistas invocáveis para trabalho que merece uma passagem dedicada:

| Agente | Para quê |
|---|---|
| `revisor-codigo` | Revisa código escrito — correção, segurança, multi-tenant, RLS |
| `auditor-governanca` | Auditoria independente de documentação contra código real |
| `documentador` | Sincroniza `docs-operacao/` com o código após mudança de comportamento |
| `gestor-memoria` | Executa o ritual de encerramento e a continuidade entre sessões |
| `planejador-arquitetura` | Avalia impacto arquitetural antes da implementação começar |

Os comandos e agentes **não concedem autorização** — `.claude/02_AUTORIZACOES.md` continua valendo integralmente.

---

## Regra de economia de contexto

Não leia o projeto inteiro.

Não leia todas as pastas.

Não leia todos os documentos por padrão.

Use `.claude/01_CONTEXTO.md` para decidir quais arquivos ler conforme o tipo de tarefa.

---

## Stack oficial

Este projeto usa:

- Backend em Go
- Frontend em Next.js
- Banco Supabase PostgreSQL
- RLS obrigatório
- Arquitetura multi-tenant real
- tenant_id em tabelas de negócio
- Documentação operacional em `docs-operacao/`

---

## Comandos de desenvolvimento

Local sem Docker:

- `make dev-backend` — `go run ./cmd/api` (backend)
- `make dev-frontend` — `cd frontend && npm run dev` (Next.js + Turbopack)

Local com Docker (stack completa: backend + frontend + nginx):

- `make up` / `make down` / `make logs` / `make logs-backend` / `make logs-frontend`
- `make restart-backend` / `make restart-frontend`

Lint e type-check:

- `make lint` — `go vet ./...` (backend)
- `cd frontend && npm run lint` — ESLint
- `cd frontend && npm run type-check` — `tsc --noEmit`

Testes:

- `make test` — todos os testes do backend (`go test ./... -v -count=1`)
- Um pacote/teste específico: `cd backend && go test ./internal/<modulo>/... -run <TestName> -v`
- `cd frontend && npm run test:e2e` — Playwright (todos)
- Um arquivo específico: `cd frontend && npx playwright test e2e/<arquivo>.spec.ts`
- `cd frontend && npm run test:e2e:ui` — Playwright em modo interativo

Build:

- `make build-backend` — compila `backend/bin/api`
- `cd frontend && npm run build` — build de produção do Next.js

Banco (requer `DATABASE_URL` no ambiente):

- `make migrate` — aplica `database/schema.sql`
- `make seed` — aplica `database/seed.sql`
- Migrations incrementais ficam em `database/migrations/NNN_descricao.sql`, aplicadas manualmente na ordem numérica

Verificação de saúde:

- `make health` — testa `/health` e `/api/v1/health` locais
- `make smoke BASE=<url>` — smoke test contra ambiente real (default: produção)

---

## Arquitetura (visão rápida)

**Multi-tenant real** — Postgres via Supabase, RLS obrigatório, `tenant_id` em toda tabela de negócio. Nunca tratar isolamento de tenant como opcional.

**Backend** (`backend/internal/`) — um módulo por domínio (`vehicles`, `leads`, `customers`, `billing`, `financial`, `plans`, `tenant`, `users`, `evolution`, `admin`, `ai`, `analytics`, `audit`, `onboarding`, `storecontact`, `landinglead`, `observability`), cada um com `handler.go` / `service.go` / `repository.go`. Composição de rotas e middlewares centralizada em `backend/internal/server/server.go`.

Camadas de rota em `server.go` (do menos ao mais restrito):

| Grupo | Middleware | Uso |
|---|---|---|
| `/api/public/:slug/*` | `SlugTenantResolver` (sem JWT) | vitrine pública da loja |
| `/api/webhooks/*` | validação por token no header | Evolution, Asaas, landing-lead |
| `setup` | `jwtAuth` (sem tenant) | `/onboarding/setup` — cria o tenant |
| `free` | `jwtAuth + resolveTenant` | billing, onboarding, usage — **sempre acessível**, mesmo com assinatura vencida, para não bloquear o pagamento |
| `gated` | `jwtAuth + resolveTenant + subGate` | vehicles, leads, sales, financial etc. — bloqueado se `past_due`/`canceled` |
| `adminGroup` | `jwtAuth + RequireRole(super_admin)` | `/api/admin/*`, sem tenant (cross-tenant) |

Dentro de `gated`, alguns endpoints têm `planGate(pool, "<feature>")` adicional (ex.: `central_atendimento`, `analytics`) — checa feature flag do plano, não o nome do plano.

**Frontend** (`frontend/app/`, App Router) — route groups: `(public)` (marketing + `/[slug]` vitrine), `(dashboard)` (app autenticado do tenant), `(admin)` (console super_admin). Não existe `middleware.ts`: sessão/refresh e redirect de rota protegida vivem em `frontend/proxy.ts` (convenção "proxy" do Next, não confundir com `frontend/lib/proxy.ts`). Toda chamada ao backend passa por `apiCall`/`publicFetch` em `frontend/lib/proxy.ts`, que injeta o JWT do Supabase e resolve a URL do backend via `INTERNAL_API_URL` (rede Docker) ou `NEXT_PUBLIC_API_URL` (fallback).

**Auth/role** — `resolveUserRole()` em `frontend/lib/tenant.ts`: usa a claim JWT quando presente, com fallback a uma query direta (`createServiceClient()`) quando ausente — `React.cache()` dedupe por request.

---

## Proibido sem autorização

Não fazer sem autorização explícita:

- alterar banco
- criar migration
- alterar RLS
- alterar autenticação
- alterar autorização
- alterar billing
- alterar deploy
- alterar CI/CD
- alterar Docker
- alterar Nginx
- alterar variáveis de ambiente
- fazer push
- fazer deploy
- apagar dados
- commitar secrets
- criar mocks em produção
- criar dados falsos
- alterar arquitetura

---

## Regra final

Se houver dúvida, pare e pergunte antes de alterar.
