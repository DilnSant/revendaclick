# 22 — HISTÓRICO DE ALTERAÇÕES

> Registrar toda alteração significativa feita em cada sessão de trabalho.
> Formato: data + o que mudou + por quê + arquivos afetados.

---

## Como Usar

No **início** de cada sessão: ler este arquivo para entender o estado atual.
No **fim** de cada sessão: adicionar uma entrada com as alterações feitas.

---

## 2026-05-23 — Fix: bug crítico dashboard → loop infinito /onboarding (SUPABASE_SERVICE_ROLE_KEY ausente no Vercel)

**O que foi feito:**
- Diagnosticado via Vercel runtime logs: `[getTenantForUser] users query error` em TODOS os requests de /dashboard
- Causa raiz confirmada: `SUPABASE_SERVICE_ROLE_KEY` não configurado no Vercel → `createServiceClient()` falha → `getTenantForUser` retorna null → dashboard redireciona para /onboarding → loop infinito → formulário limpa
- Fix: `getTenantForUser` reescrito para usar `createClient()` (anon key + JWT do usuário) em vez de `createServiceClient()` (service role). RLS via `auth_tenant_id()` garante isolamento por tenant. Não requer `SUPABASE_SERVICE_ROLE_KEY`.
- Renomeado `middleware.ts` → `proxy.ts` para corrigir deprecation do Next.js 16

**Causa raiz técnica:**
`createServiceClient()` em `getTenantForUser` dependia de `SUPABASE_SERVICE_ROLE_KEY` que não estava no Vercel. O erro era silencioso (capturado pelo `if (userError)` com console.error). A RLS na tabela `users` (`WHERE tenant_id = auth_tenant_id()`) funciona corretamente via JWT — o claim `tenant_id` é injetado pelo backend no `app_metadata` após onboarding + `refreshSession()`.

**Usuários afetados confirmados no banco:**
- `desconto.do.dono@gmail.com` — tenant criado mas dashboard inacessível
- `dilsant.nocode@gmail.com` — tenant criado mas dashboard inacessível
- `dilneysantos.coprodutor@gmail.com` — sem tenant, loop no onboarding
- `metodolimpezas@gmail.com` — sem tenant, loop no onboarding

**Diagnóstico usado:**
- Supabase MCP: query em `auth.users JOIN public.users` revelou usuários sem tenant
- Vercel MCP: runtime logs confirmaram o erro exato `[getTenantForUser] users query error`
- Leitura de RLS policies: `users_select_own_tenant` e `tenants_select_own` via `auth_tenant_id()`

**Arquivos alterados:**
- `frontend/lib/tenant.ts` — `getTenantForUser`: `createServiceClient()` → `await createClient()`; import adicionado
- `frontend/proxy.ts` — criado (novo nome do middleware no Next.js 16)
- `frontend/middleware.ts` — esvaziado (substituído por proxy.ts)

**SQL executado:** nenhum

**Commits:**
- `894021d` — fix: switch getTenantForUser to session client

---

## 2026-05-22 — Fix: bug crítico login → redirect incorreto para /onboarding

**O que foi feito:**
- Corrigido `frontend/lib/tenant.ts` → `getTenantForUser`
- Substituído embedded Supabase join `tenants(...)` por duas queries explícitas independentes
- Substituído `.single()` por `.maybeSingle()` para evitar erro PGRST116 quando 0 linhas retornam
- Adicionado `console.error` para surfacing de erros futuros

**Causa raiz:**
O embedded join PostgREST `.select('tenant_id, tenants(id, slug, name, phone_whatsapp)')` falha silenciosamente em produção (schema cache, FK não reconhecido, ou erro de rede). O `if (error || ...)` captura o erro e retorna null. O dashboard interpreta como "sem tenant" e redireciona para /onboarding. O backend, consultando PostgreSQL diretamente, confirma que o tenant existe — daí o "usuário já possui uma loja cadastrada".

**Arquivos alterados:**
- `frontend/lib/tenant.ts` — `getTenantForUser` reescrito com duas queries explícitas

**SQL executado:** nenhum

**Commits:** ver git log

---

## 2026-05-22 — Auditoria e documentação completa

**O que foi feito:**
- Auditoria real do repositório (leitura de todos os arquivos-fonte)
- Criação de 11 documentos na raiz: `MAPA_DE_PASTAS.md`, `ARQUITETURA_REAL.md`, `ROTAS_REAIS.md`, `BANCO_REAL.md`, `ENVIRONMENT.md`, `INFRA.md`, `CICD.md`, `DEPLOY.md`, `OBSERVABILIDADE.md`, `AUTENTICACAO_REAL.md`, `FLUXOS_REAIS.md`
- Criação de `/docs-operacao/` com 24 arquivos (memória viva do projeto)
- Correção do branch padrão de `master` → `main` no GitHub via API
- Instalação do `gh` CLI em `~/.local/bin/gh` (sem sudo)
- Geração de `FLUTTERFLOW_MIGRATION.md` com plano de migração de 8 semanas
- Decisão de **cancelar** a migração para FlutterFlow (D12 em `21_DECISOES_TECNICAS.md`)

**Por quê:**
- Projeto não tinha documentação operacional — qualquer desenvolvedor novo ou IA precisava reler todo o código
- Decisão de produto: FlutterFlow não será mais necessário

**Arquivos criados/modificados:**
- `/docs-operacao/` (pasta nova com 24 arquivos)
- `MAPA_DE_PASTAS.md`, `ARQUITETURA_REAL.md`, etc. (raiz)
- `FLUTTERFLOW_MIGRATION.md` (obsoleto — decisão D12)

**Commits relacionados:**
- Ver `git log` para commits desta data

---

## Template para novas entradas

```
## YYYY-MM-DD — Descrição resumida

**O que foi feito:**
- item 1
- item 2

**Por quê:**
- motivação

**Arquivos criados/modificados:**
- caminho/do/arquivo.ext — o que mudou

**Commits relacionados:**
- sha abreviado — mensagem do commit
```

---

> Entradas mais antigas ficam abaixo das mais recentes.
> Não limitar o histórico — nunca apagar entradas.
