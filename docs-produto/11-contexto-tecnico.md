# .docs 11 — Contexto Técnico

> Fonte única do contexto técnico do produto: stack, arquitetura, padrões, UI, backend, banco, API, testes, deploy e segurança técnica. As regras de conduta correspondentes vivem em [`../AI_GOVERNANCE/`](../AI_GOVERNANCE/); este documento é o contexto técnico consultado durante a implementação ([`../AI_GOVERNANCE/PROCESSOS.md`](../AI_GOVERNANCE/PROCESSOS.md), seção 1).
>
> **Estado atual:** projeto em DESENVOLVIMENTO (desde 2026-07-31). Todas as seções abaixo (Contexto 00 a 09) foram validadas e confirmadas explicitamente pelo usuário em 2026-07-06 (ver [`../memory/DECISOES.md`](../memory/DECISOES.md)) — são decisão técnica oficial do repositório. Scaffolding inicial criado em 2026-07-31: `apps/api/` (Go + Gin, endpoint `/api/v1/health` no formato de envelope oficial) e `apps/web/` (Next.js 16 + TypeScript, criado via `create-next-app` com pnpm). Qualquer divergência futura entre este documento e o código real é corrigida, nunca ignorada.

---

## Contexto 00 — Stack Tecnológica

| Camada | Tecnologia oficial |
|---|---|
| Backend | Go + Gin + pgx |
| Frontend | Next.js 16 + TypeScript |
| Banco de dados | Supabase PostgreSQL |
| Segurança de banco | Row Level Security (RLS) obrigatório em todas as tabelas de negócio |
| Autenticação | Supabase Auth + JWT com `tenant_id` |
| Pagamentos | Asaas |
| WhatsApp | Evolution API (Central de Atendimento, pós-MVP) / link `wa.me` (WhatsApp da Loja, MVP) |
| IA | OpenRouter |
| Infraestrutura | VPS Hostinger, Vercel, Docker, Nginx, GitHub Actions |
| Gerenciador de pacotes (frontend) | pnpm |

Qualquer mudança estrutural de stack, uma vez decidida, gera uma entrada em [`../memory/DECISOES.md`](../memory/DECISOES.md) e um ADR em [`08-decisoes-tecnicas.md`](08-decisoes-tecnicas.md).

---

## Contexto 01 — Arquitetura

**Arquitetura oficial**: Monólito modular. O sistema é desenvolvido como um monólito modular, organizado por domínios de negócio, preservando baixo acoplamento, alta coesão e permitindo futura extração de serviços sem refatoração estrutural.

**Princípios arquiteturais**:
- SaaS Multi-Tenant nativo.
- Clean Architecture.
- Domain-Driven Design (DDD) em nível de organização dos módulos.
- API REST.
- Frontend desacoplado do backend.
- Stateless.
- JWT como autenticação.
- `tenant_id` obrigatório em todo o domínio de negócio.
- Row Level Security obrigatório no banco.
- RBAC para autorização.
- Integrações externas desacopladas do núcleo.
- Eventos internos preparados para futuras automações.
- Feature flags por tenant.
- Arquitetura preparada para escalabilidade horizontal.

**Camadas** (Frontend → API → Application → Domain → Infrastructure → PostgreSQL):

1. **Frontend** — Next.js 16.
2. **API** — Go + Gin.
3. **Camada de Aplicação** — casos de uso.
4. **Camada de Domínio** — entidades, regras de negócio e contratos.
5. **Infraestrutura** — Supabase, Asaas, Evolution API, OpenRouter.
6. **PostgreSQL** — Supabase + RLS.

**Direção das dependências**: Frontend → API → Application → Domain → Infrastructure. A camada Domain não pode depender das demais.

**Integrações externas**: Evolution API, Asaas e OpenRouter devem ser acessadas exclusivamente através de interfaces (ports/adapters), nunca diretamente pelas regras de negócio.

**ADR oficial — ADR-001**: Arquitetura baseada em Monólito Modular com Clean Architecture, SaaS Multi-Tenant e preparação para futura extração de microsserviços.

---

## Contexto 02 — Padrões de Código e Organização

**Backend** — Linguagem Go, framework Gin, acesso a dados via pgx, caminho `apps/api/`.

Estrutura obrigatória por domínio:

```
apps/api/internal/<dominio>/
├── domain/
├── application/
├── infrastructure/
├── interfaces/
└── routes/
```

Regras do backend:
- Código Go segue `gofmt`; pacotes com nomes curtos, minúsculos e sem underline.
- Cada domínio isolado em seu próprio módulo interno.
- Regras de negócio em `domain/`; casos de uso em `application/`; acesso a banco e integrações externas em `infrastructure/`; handlers em `interfaces/`; rotas em `routes/`.
- `domain` não pode importar `application`, `infrastructure`, `interfaces` ou `routes`; `application` pode depender de `domain`; `infrastructure` implementa interfaces/ports definidos pelo domínio ou aplicação.
- Nenhuma query SQL escrita fora de `infrastructure/`; todo acesso a dados de negócio respeita `tenant_id` e RLS; nenhuma integração externa é chamada diretamente por handlers.

**Frontend** — Linguagem TypeScript, framework Next.js 16, caminho `apps/web/`.

Estrutura obrigatória:

```
apps/web/src/app/
apps/web/src/components/
apps/web/src/features/
apps/web/src/lib/
apps/web/src/services/
apps/web/src/types/
```

Regras do frontend:
- Usar App Router e Server Components quando aplicável.
- Componentes reutilizáveis em `components/`; funcionalidades de domínio em `features/`; serviços de API em `services/`; tipos compartilhados em `types/`; utilitários em `lib/`.
- Nenhuma chamada direta ao banco no frontend — consome exclusivamente a API do backend.
- Páginas públicas da vitrine preservam SSR/SEO; código TypeScript evita `any` sem justificativa.

**Banco**: migrations versionadas; tabelas de negócio com `tenant_id` obrigatório; RLS obrigatório; políticas RLS documentadas; índices obrigatórios em `tenant_id` e campos de busca; nenhuma alteração manual de schema sem migration.

**Nomenclatura**:
- *Backend*: arquivos Go em `snake_case`; pacotes em lowercase; handlers terminam em `_handler.go`; serviços/casos de uso em `_service.go` ou `_usecase.go`; repositories em `_repository.go`.
- *Frontend*: componentes em `PascalCase`; hooks iniciam com `use`; arquivos de componentes em `PascalCase.tsx`; arquivos utilitários em `camelCase.ts`; tipos/interfaces em `PascalCase`.

---

## Contexto 03 — Interface e Experiência

**Duas experiências principais**:

1. *Vitrine pública*: foco em SEO, carregamento rápido, acesso sem autenticação, experiência responsiva, páginas públicas por revenda e por veículo, foco em conversão de leads.
2. *Área autenticada*: foco em produtividade operacional, navegação simples, dashboards objetivos — gestão de estoque, CRM/funil, vendedores, financeiro, super_admin.

**Sistema de design**: interface moderna, limpa e profissional; design responsivo; componentes reutilizáveis; padrão visual consistente entre módulos; layout desktop-first na área administrativa e mobile-first na vitrine pública; Tailwind CSS como base visual.

**Responsividade**: mobile, tablet, desktop.

**Acessibilidade**: meta WCAG 2.1 AA; contraste adequado; navegação por teclado nas áreas essenciais; labels claros em formulários; estados visuais claros para foco, erro, sucesso e carregamento.

**Estados obrigatórios de UI**: loading, erro, vazio, sucesso, bloqueado, sem permissão, sem dados, inadimplente, trial expirado.

**Regras obrigatórias**:
- Nenhuma tela sem estado de loading; nenhuma lista sem estado vazio.
- Nenhum erro técnico exibido cru ao usuário — mensagens claras e orientadas à ação.
- A vitrine pública prioriza velocidade e conversão; a área administrativa prioriza eficiência e clareza operacional.

---

## Contexto 04 — Backend e Serviços

**Backend**: Go + Gin, acesso a dados via pgx, arquitetura monólito modular com Clean Architecture, API REST, autenticação JWT via Supabase Auth, multi-tenancy com `tenant_id` obrigatório em todas as operações de negócio.

**Tratamento de erros**: o formato oficial de respostas e erros da API é definido no [Contexto 06 — Contratos de API](#contexto-06--contratos-de-api). Regras de mapeamento:
- Erros internos nunca são expostos diretamente ao usuário; erros técnicos são registrados em log.
- Erros de validação → HTTP 400; autenticação → 401; autorização → 403; recurso inexistente → 404; erro inesperado → 500.
- Falhas de integrações externas retornam erro controlado, sem derrubar o núcleo da aplicação.

**Logging**:
- Registra eventos operacionais relevantes; nunca contém senhas, tokens, chaves, CPF, telefone, e-mail ou documentos.
- Logs de erro contêm contexto técnico suficiente para diagnóstico; incluem `request_id`, e `tenant_id`/`user_id` quando aplicável.
- Registra falhas de integração externa; logs administrativos registram ações críticas.

**Jobs e processos em background**:
- Isolados do fluxo principal da API; falhas em jobs não derrubam a aplicação.
- Possuem logs próprios; são idempotentes sempre que possível; respeitam `tenant_id`; possuem tratamento de retry quando aplicável.

**Serviços externos**: Asaas, Evolution API e OpenRouter acessados por adapters próprios; nenhuma integração externa é chamada diretamente por handlers; toda integração possui timeout, tratamento de erro e permite degradação controlada.

Qualquer novo serviço externo integrado é registrado em [`09-integracoes.md`](09-integracoes.md).

---

## Contexto 05 — Banco de Dados

**Banco de dados**: motor PostgreSQL via Supabase; RLS obrigatório; `tenant_id` obrigatório em todas as tabelas de negócio; Auth integrado com Supabase Auth/JWT; acesso pelo backend via pgx.

**Migrações**:
- Toda alteração de schema é feita por migrations versionadas; nenhuma alteração manual em produção.
- Migrations numeradas e descritivas; aplicadas primeiro em local/homologação; preservam compatibilidade com RLS.
- Toda nova tabela de negócio possui `tenant_id`, política RLS e índice por `tenant_id`.

**Reversibilidade**:
- Migrations destrutivas exigem autorização explícita; `DROP TABLE`, `DROP COLUMN`, `TRUNCATE` e alterações destrutivas são proibidas sem aprovação.
- Backup obrigatório antes de alteração destrutiva; preferir migrations aditivas; alterações irreversíveis são registradas em `memory/DECISOES.md`.

**PII e LGPD**:
- Dados pessoais nunca aparecem em logs; acessados apenas por usuários autorizados; respeitam isolamento por tenant.
- CPF, telefone, e-mail e documentos são mascarados quando exibidos fora do contexto operacional necessário.
- Senhas nunca armazenadas em texto puro; tokens e segredos nunca em tabelas comuns; dados sensíveis protegidos por políticas de acesso e, quando necessário, criptografia.

**Índices obrigatórios**: `tenant_id` em tabelas de negócio; `slug` em tenants/revendas; `status` em entidades operacionais; `created_at` quando houver filtros por período; campos de busca usados em estoque, leads, clientes e veículos.

**Regras obrigatórias**: banco é fonte de verdade dos dados persistentes; RLS obrigatório em produção; backend nunca depende apenas de filtro em aplicação; toda modelagem respeita [`04-modelagem.md`](04-modelagem.md); toda regra de negócio persistida é documentada em [`05-regras-negocio.md`](05-regras-negocio.md); nenhuma tabela de negócio sem `tenant_id` e RLS; nenhuma alteração de banco sem migration.

---

## Contexto 06 — Contratos de API

**Estilo**: API REST, payloads em JSON, autenticação via JWT; `tenant_id` obtido do JWT, nunca enviado pelo frontend como fonte confiável; frontend Next.js consome exclusivamente a API do backend.

**Versionamento**: prefixo inicial `/api/v1`; mudanças incompatíveis exigem nova versão; mudanças compatíveis mantêm a mesma versão; APIs internas e públicas documentadas separadamente quando aplicável.

**Convenção de rotas**: substantivos no plural; `kebab-case` em rotas compostas; nenhum verbo nas rotas — a ação é representada pelo método HTTP.

Exemplos:
```
GET    /api/v1/vehicles
POST   /api/v1/vehicles
GET    /api/v1/vehicles/:id
PATCH  /api/v1/vehicles/:id
DELETE /api/v1/vehicles/:id

GET   /api/v1/leads
POST  /api/v1/leads
PATCH /api/v1/leads/:id/stage
```

**Métodos HTTP**: GET (consulta), POST (criação), PATCH (alteração parcial), PUT (substituição completa apenas quando necessário), DELETE (exclusão lógica por padrão).

**Formato de payload**: JSON; campos em `camelCase`; datas em ISO 8601; IDs em UUID; valores monetários em centavos quando aplicável; booleanos com prefixos claros (`isActive`, `hasAccess`, `canEdit`).

**Formato oficial de resposta** — única fonte dos contratos HTTP da API (substitui qualquer outro formato de erro mencionado em outras seções deste documento):

*Sucesso*:
```json
{
  "success": true,
  "data": {},
  "meta": null
}
```

*Erro*:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem segura para o usuário",
    "details": null
  }
}
```

*Paginação* (em `meta`):
```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Filtros** (query params): datas em `startDate`/`endDate`; busca textual em `search`; ordenação em `sortBy`/`sortOrder`; paginação em `page`/`perPage`.

**Códigos HTTP**: 200 sucesso; 201 criado; 204 sucesso sem conteúdo; 400 erro de validação; 401 não autenticado; 403 sem permissão; 404 não encontrado; 409 conflito de regra de negócio; 422 entidade semanticamente inválida; 429 limite de requisições; 500 erro interno.

**Catálogo inicial de erros**: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `TENANT_REQUIRED`, `TENANT_ACCESS_DENIED`, `FEATURE_NOT_ENABLED`, `SUBSCRIPTION_INACTIVE`, `TRIAL_EXPIRED`, `PAYMENT_REQUIRED`, `BUSINESS_RULE_VIOLATION`, `EXTERNAL_SERVICE_UNAVAILABLE`, `INTERNAL_ERROR`.

**Compatibilidade**: remover ou renomear campos exige nova versão da API; adicionar campos opcionais é permitido na mesma versão; alterar tipo de campo exige nova versão; alterar regra de negócio relevante é registrado em `memory/DECISOES.md`; contratos utilizados pelo frontend permanecem estáveis.

APIs externas consumidas são catalogadas em [`09-integracoes.md`](09-integracoes.md).

---

## Contexto 07 — Estratégia de Testes

**Estratégia geral**: pirâmide de testes com foco em confiabilidade, isolamento multi-tenant, regras de negócio e contratos de API. Nenhuma funcionalidade é considerada concluída sem testes relevantes passando.

**Pirâmide de testes**: (1) testes unitários; (2) testes de integração; (3) testes de API; (4) testes end-to-end críticos.

**Backend**: testes unitários para regras de negócio e casos de uso; testes de integração para repositories e para RLS/multi-tenancy; testes de API para handlers e rotas; testes obrigatórios para permissões/RBAC e para isolamento entre tenants.

**Frontend**: testes de componentes críticos e de formulários; testes dos estados de UI (loading, erro, vazio, sem permissão, bloqueado, inadimplente, trial expirado); testes de fluxos críticos da vitrine pública e da área autenticada.

**End-to-end críticos**: login; criação/provisionamento de tenant; cadastro de veículo; publicação de veículo na vitrine; captação de lead; movimentação de lead no funil; registro de venda; bloqueio/desbloqueio de tenant; acesso negado entre tenants.

**Regras obrigatórias**: nunca usar dados reais de produção em testes; nunca silenciar testes com `skip` para liberar entrega; nunca considerar tarefa concluída com testes relevantes falhando; testes rodam localmente e no CI; todo bug corrigido gera teste de regressão quando aplicável; toda regra de negócio crítica, todo controle multi-tenant e toda permissão relevante têm teste.

**Ferramentas**:
- *Backend*: Go testing package; `httptest` para API; Testcontainers ou banco de teste isolado para integração.
- *Frontend*: Vitest; React Testing Library; Playwright para E2E.
- *CI*: GitHub Actions.

---

## Contexto 08 — Build, Deploy e Ambientes

**Ambientes**:
1. *Desenvolvimento local* — executado na máquina do desenvolvedor; variáveis locais; banco de desenvolvimento separado; nunca utiliza dados reais de produção.
2. *Homologação* — validação antes da produção; credenciais próprias; banco separado da produção; pode receber dados fictícios ou anonimizados.
3. *Produção* — ambiente real dos clientes; credenciais próprias; acesso restrito; alterações somente após validação.

**Infraestrutura**: frontend na Vercel; backend em VPS Hostinger + Docker + Nginx + SSL; banco/auth no Supabase; CI/CD via GitHub Actions.

**Pipeline de CI** (obrigatório): lint; testes; build; verificação de tipos; verificação de links da documentação quando aplicável; verificação de ausência de segredos versionados.

**Pipeline de CD**: deploy do frontend na Vercel; deploy do backend na VPS via Docker; Nginx como reverse proxy; SSL obrigatório; variáveis de ambiente configuradas fora do repositório.

**Portões de qualidade**: build sem erro; testes relevantes passando; sem segredos versionados; sem erro de lint; sem falha crítica de segurança conhecida; migrations revisadas antes de produção; backup antes de alteração destrutiva.

**Rollback**: frontend via Vercel; backend via imagem Docker anterior; banco somente com plano validado; alterações destrutivas de banco exigem backup e autorização explícita.

**Regras obrigatórias**: produção nunca usa credenciais de desenvolvimento; homologação nunca compartilha banco com produção; nenhum segredo pode ser versionado; deploy em produção exige validação prévia; migrations destrutivas exigem autorização explícita; a pasta `Old` nunca é usada como fonte de deploy; credenciais e URLs reais da versão anterior não são reutilizadas sem confirmação explícita (ver [`../memory/PENDENCIAS.md`](../memory/PENDENCIAS.md)).

Nenhum deploy em produção é disparado pelo Claude Code sem autorização explícita e nomeada (ver [`../AI_GOVERNANCE/AUTORIZACOES.md`](../AI_GOVERNANCE/AUTORIZACOES.md)).

---

## Contexto 09 — Segurança Aplicada ao Código

Traduz [`../AI_GOVERNANCE/SEGURANCA.md`](../AI_GOVERNANCE/SEGURANCA.md) em requisitos técnicos concretos.

**Princípios obrigatórios**: segurança aplicada no backend, frontend, banco e integrações; autorização sempre validada no servidor; `tenant_id` nunca confiado quando enviado pelo frontend, vindo do JWT ou do contexto autenticado; toda operação de negócio valida `tenant_id`; RLS obrigatório nas tabelas de negócio; RBAC obrigatório para ações administrativas; segredos nunca versionados; dados pessoais nunca em logs; erros nunca expõem stack trace, SQL, tokens ou detalhes internos.

**Validação e sanitização**:
- *Backend*: validar todos os payloads recebidos; rejeitar campos inesperados quando aplicável; sanitizar entradas textuais; validar UUIDs, datas, valores monetários e enums; validar permissões antes da execução do caso de uso.
- *Frontend*: validar formulários antes do envio; exibir mensagens seguras e claras; não confiar em validação apenas no frontend; nunca armazenar tokens sensíveis em locais inseguros.

**SAST/SCA e CI** — ferramentas obrigatórias: `gosec` (análise de segurança em Go); `govulncheck` (vulnerabilidades em dependências Go); `npm audit`/`pnpm audit` (dependências frontend); GitHub Actions executando as verificações no CI (lint, testes, build, verificação de tipos, gosec, govulncheck, audit de dependências frontend, verificação de segredos versionados).

**Política de dependências vulneráveis**: vulnerabilidades críticas bloqueiam release; altas exigem correção antes de produção; médias são registradas como pendência com prazo; baixas podem ser monitoradas; dependências sem manutenção são substituídas quando houver alternativa segura; atualizações de segurança têm prioridade sobre novas funcionalidades.

**Logs e erros**: logs nunca exibem senhas, tokens, chaves, CPF, telefone, e-mail ou documentos; erros retornados ao usuário usam mensagens seguras; stack trace nunca exposto ao frontend; SQL bruto nunca aparece em resposta de erro; erros de integração externa tratados com degradação controlada.

**Regras obrigatórias**: nenhuma rota protegida sem autenticação; nenhuma ação administrativa sem autorização; nenhuma funcionalidade acessa dados sem `tenant_id`; nenhuma integração externa armazena segredo em código; nenhum segredo real aparece em documentação; toda nova funcionalidade passa por revisão de segurança.

---

## Responsabilidades

- Este documento reflete a decisão técnica **oficial confirmada** do produto — enquanto não há código, ele antecipa o que será construído; quando a implementação começar, cada seção é atualizada para descrever o que de fato existe, e divergências entre documento e código são corrigidas em vez de ignoradas.
- Mudanças estruturais em qualquer seção geram uma entrada em [`../memory/DECISOES.md`](../memory/DECISOES.md) e, quando arquiteturais, um ADR em [`08-decisoes-tecnicas.md`](08-decisoes-tecnicas.md).

## Relacionamento com Outros Documentos

- [../AI_GOVERNANCE/PADROES_DE_CODIGO.md](../AI_GOVERNANCE/PADROES_DE_CODIGO.md) — princípios gerais de código que se aplicam a qualquer stack.
- [04-modelagem.md](04-modelagem.md) — modelagem de domínio implementada por esta stack.
- [08-decisoes-tecnicas.md](08-decisoes-tecnicas.md) — ADRs que fundamentam as escolhas técnicas.
- [09-integracoes.md](09-integracoes.md) — catálogo de integrações externas.
- [../CLAUDE.md](../CLAUDE.md) — ponto de entrada que referencia este documento.
