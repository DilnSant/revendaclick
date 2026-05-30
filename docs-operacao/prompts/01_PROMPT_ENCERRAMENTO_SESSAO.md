# PROMPT OFICIAL DE ENCERRAMENTO DE SESSÃO — REVENDACLICK

Copiar e colar integralmente ao final de toda sessão.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJETIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Encerrar a sessão somente após validar:

✓ código

✓ banco

✓ testes

✓ deploy

✓ documentação

✓ arquitetura

✓ fluxos de negócio

✓ sincronização completa entre implementação e documentação

Nenhuma tarefa é considerada concluída enquanto existir divergência entre:

CÓDIGO

e

DOCUMENTAÇÃO.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 1 — ATUALIZAR DOCUMENTAÇÃO OBRIGATÓRIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Atualizar obrigatoriamente:

### Pendências

docs-operacao/20_PENDENCIAS.md

* marcar concluídas
* adicionar novas pendências
* remover obsoletas

---

### Decisões Técnicas

docs-operacao/21_DECISOES_TECNICAS.md

Adicionar nova decisão apenas se realmente existir.

Formato:

DXX — Título

* contexto
* decisão
* impacto

---

### Histórico

docs-operacao/22_HISTORICO_ALTERACOES.md

Adicionar:

## YYYY-MM-DD — Sessão XX

* alterações realizadas
* arquivos alterados
* motivo
* impacto
* deploy
* testes

Atualizar:

Estado Atual por Feature (tabela no topo do arquivo)

---

### Próximo Passo

docs-operacao/23_PROXIMO_PASSO.md

Atualizar:

* data e sessão
* estado atual do projeto
* próximos passos em ordem de prioridade

---

### Falhas Corrigidas

docs-operacao/FalhasCorrigidas/

Criar FC sempre que houver:

* bug
* regressão
* corrupção de dados
* incidente
* vulnerabilidade
* correção relevante

Formato:

FCXXX_NOME_DA_FALHA.md

Registrar:

* sintoma
* causa raiz
* impacto
* correção
* prevenção

---

### Snapshots

docs-operacao/features/

Atualizar snapshot quando houver mudança de:

* feature flag
* comportamento de módulo
* estrutura da sidebar
* plano ou add-on

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 2 — AUDITORIA DOS DOCUMENTOS ESTRUTURAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Validar impacto em:

* docs-operacao/PRODUCT_ARCHITECTURE.md
* docs-operacao/DEPENDENCIES.md
* docs-operacao/ENVIRONMENTS.md
* docs-operacao/17_FLUXOS_NEGOCIO.md
* docs-operacao/REFERENCE.md

Se houver impacto:

ATUALIZAR antes de encerrar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 3 — REGISTRAR INTEGRALMENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Registrar:

### Alterações realizadas

### Arquivos alterados

Lista completa com paths.

### Commits

Hashes e mensagens.

### Push

Confirmado ou não.

### Deploy

Frontend — Vercel (automático via push)

Backend — CI/CD GitHub Actions → VPS

Banco — migrations aplicadas

### Migrations

* número e nome
* objetivo
* database.types.ts regenerado?
* rollback necessário?

### Testes

* executados
* resultado

### Bugs corrigidos

Relacionar FC quando existir.

### Pendências novas

### Próximos passos

Em ordem de prioridade.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 4 — AUDITORIA DE CAUSA RAIZ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para cada correção realizada informar:

### Causa Raiz

* origem exata
* arquivo responsável
* função responsável
* tabela responsável

### Correção

* o que foi alterado

### Prevenção

* como evitar recorrência

Não aceitar explicações sem evidência.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 5 — AUDITORIA MULTI-TENANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Validar alterações realizadas.

Confirmar:

✓ SELECT respeita tenant_id

✓ UPDATE respeita tenant_id

✓ DELETE respeita tenant_id

✓ UPSERT respeita tenant_id

✓ RLS policies continuam corretas

Se houver risco:

PARAR.

Documentar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 6 — VALIDAÇÃO BANCO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confirmar:

✓ migrations aplicadas (numeradas sequencialmente em database/migrations/)

✓ database.types.ts regenerado após migration

✓ get_tenant_usage() ainda retorna todas as flags (3-way UNION)

✓ índices e triggers atualizados

Informar:

rollback necessário?

SIM ou NÃO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 7 — TESTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Executar:

cd frontend && npx tsc --noEmit

cd backend && go build ./... && go vet ./...

cd backend && go test ./internal/billing/... ./internal/leads/...

Informar:

* total testes
* aprovados
* falhas
* novos testes adicionados

---

Informar também:

### Testes Reais (browser / API)

Dashboard — KPIs carregam?

Vitrine pública /:slug — visível sem login?

Billing — /billing/plans mostra 3 planos?

Sidebar — perfil Starter sem seção Pro?

WhatsApp/Configurações — aba WhatsApp visível?

Admin — /admin acessível pelo super_admin?

Status:

EXECUTADO

ou

NÃO EXECUTADO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 8 — DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend

* commit realizado
* push para main
* Vercel deploy automático (verificar em vercel.com)

Backend

* CI/CD GitHub Actions disparado
* self-hosted runner VPS executou
* docker compose up -d backend
* healthcheck: GET https://api.revendaclick.com.br/health

Banco

* migrations aplicadas via MCP ou supabase CLI
* resultado confirmado

Registrar:

todos os commits e hashes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 9 — RELATÓRIO FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Apresentar:

### Resumo Executivo

máximo 10 linhas

### Causa Raiz

de cada correção

### Arquivos Alterados

código + documentação

### Banco

migrations, índices, triggers

### Testes

lista completa

### Deploys

frontend — backend — banco

### Documentos Atualizados

lista completa

### Pendências Abertas

estado atual de 20_PENDENCIAS.md

### Próxima Ação Recomendada

apenas UMA — a de maior impacto

### Riscos ou Lacunas

o que merece atenção futura

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECKLIST FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confirmar:

✓ código atualizado

✓ documentação atualizada

✓ features/FEATURE_FLAGS_SNAPSHOT.md atualizado

✓ features/SIDEBAR_SNAPSHOT.md atualizado

✓ REFERENCE.md atualizado (migrations, FCs)

✓ FalhasCorrigidas atualizado

✓ Estado Atual por Feature atualizado (22_HISTORICO topo)

✓ 23_PROXIMO_PASSO.md atualizado (data + estado)

✓ pendências atualizadas

✓ testes executados

✓ deploy validado

✓ multi-tenant validado

✓ causa raiz documentada

✓ itens obsoletos movidos para MEMORY.md → OBSOLETO

Não encerrar enquanto qualquer item acima estiver pendente.
