# PROMPT OFICIAL DE ENCERRAMENTO DE SESSÃO — BEAUTYNOW

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

✓ modelo de dados

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

docs-operacao/20_PENDENCIAS_ABERTAS.md

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

Estado Atual por Feature

---

### Próximo Passo

docs-operacao/23_PROXIMO_PASSO.md

Atualizar:

* última execução
* estado atual
* pendências
* ação prioritária

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

Atualizar snapshot quando houver mudança de comportamento, feature flag ou arquitetura.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 2 — AUDITORIA DOS DOCUMENTOS ESTRUTURAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Validar impacto em:

* 00_MAPA_FEATURES.md
* 01_ARQUITETURA_SISTEMA.md
* 02_FLUXOS_NEGOCIO.md
* 03_MODELO_DADOS.md
* 04_DEPLOY_OPERACIONAL.md

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

Frontend

Backend

Banco

### Migrations

* nome
* objetivo
* impacto
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

✓ Policies continuam corretas

Se houver risco:

PARAR.

Documentar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 6 — VALIDAÇÃO BANCO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confirmar:

✓ migrations aplicadas

✓ database.types.ts atualizado

✓ índices atualizados

✓ triggers atualizadas

✓ funções atualizadas

Informar:

rollback necessário?

SIM ou NÃO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 7 — TESTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Executar:

npm test

tsc --noEmit

build

Informar:

* total testes
* aprovados
* falhas
* novos testes

---

Informar também:

### Testes Reais

Browser

Dashboard

Página Pública

Reserva

Comprovante

WhatsApp

Billing

Add-ons

Status:

EXECUTADO

ou

NÃO EXECUTADO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 8 — DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend

* commit
* branch
* URL
* resultado

Backend

* VPS
* arquivos alterados
* rebuild
* restart
* health check

Banco

* migrations
* resultado

Registrar:

todos os comandos executados.

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

migrations
índices
triggers

### Testes

lista completa

### Deploys

frontend
backend
banco

### Documentos Atualizados

lista completa

### Pendências Abertas

copiar conteúdo atual de:

20_PENDENCIAS_ABERTAS.md

### Próxima Ação Recomendada

apenas UMA

a de maior impacto

### Riscos ou Lacunas

o que merece atenção futura

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECKLIST FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confirmar:

✓ código atualizado

✓ documentação atualizada

✓ mapa de features atualizado

✓ arquitetura atualizada

✓ fluxos atualizados

✓ modelo de dados atualizado

✓ deploy operacional atualizado

✓ FalhasCorrigidas atualizado

✓ Estado Atual por Feature atualizado

✓ pendências atualizadas

✓ testes executados

✓ deploy validado

✓ multi-tenant validado

✓ causa raiz documentada

Não encerrar enquanto qualquer item acima estiver pendente.

