---
description: Executa auditoria estrutural, documental e técnica do projeto (relata, não corrige)
---

# /auditoria

## Objetivo

Disparar uma auditoria de aderência entre o que a documentação afirma e o que o código realmente faz, seguindo [`prompts/02_PROMPT_AUDITORIA.md`](../../prompts/02_PROMPT_AUDITORIA.md), sem exigir que o usuário conheça o passo a passo.

## Estrutura — execute nesta ordem

1. Invocar o agente [`agents/auditor-governanca.md`](../agents/auditor-governanca.md), ou seguir diretamente os passos abaixo.
2. **Ler primeiro:** [`CLAUDE.md`](../../CLAUDE.md), [`docs-operacao/00_LEIA_PRIMEIRO.md`](../../docs-operacao/00_LEIA_PRIMEIRO.md), [`.claude/01_CONTEXTO.md`](../01_CONTEXTO.md), [`.claude/02_AUTORIZACOES.md`](../02_AUTORIZACOES.md), [`.claude/04_VALIDACAO.md`](../04_VALIDACAO.md). Depois, somente os documentos necessários ao escopo auditado (lista "auditoria" de `.claude/01_CONTEXTO.md`).
3. **Auditar nesta ordem de prioridade:**
   1. Divergência entre código e documentação
   2. Risco multi-tenant
   3. RLS
   4. Autenticação e autorização
   5. Billing
   6. Feature flags
   7. Deploy e ambiente
   8. Nomenclaturas obsoletas (conferir contra [`docs-operacao/MEMORY.md`](../../docs-operacao/MEMORY.md))
   9. Arquivos duplicados ou contraditórios
   10. Próximo passo operacional
4. **Verificações automatizadas úteis:** arquivos `.md` vazios; links markdown internos quebrados (ignorando `http(s)`, `mailto`, âncoras e exemplos entre crases); segredos versionados por engano; regras de `.gitignore` que excluam silenciosamente arquivos de código ou rota (causa raiz do FC057 — ver decisão D35 em [`docs-operacao/21_DECISOES_TECNICAS.md`](../../docs-operacao/21_DECISOES_TECNICAS.md)).
5. **Classificar achados** por severidade: crítico / médio / informativo.
6. **Relatório final:**
   1. Itens conformes
   2. Divergências encontradas
   3. Riscos críticos
   4. Riscos médios
   5. Documentos que precisam de ajuste
   6. Código que precisa de ajuste
   7. Próxima ação recomendada
7. Perguntar ao usuário se deseja registrar os achados como pendências em [`docs-operacao/20_PENDENCIAS.md`](../../docs-operacao/20_PENDENCIAS.md).

## Responsabilidades

- Reportar achados de forma completa e honesta, sem suavizar não conformidades.
- **A auditoria relata, não corrige.** Não refatorar, não fazer deploy, não criar migration, não alterar arquivos sem autorização.
- Não ler pastas inteiras sem necessidade.

## Relacionamento com Outros Documentos

- [prompts/02_PROMPT_AUDITORIA.md](../../prompts/02_PROMPT_AUDITORIA.md) — prompt manual equivalente.
- [agents/auditor-governanca.md](../agents/auditor-governanca.md) — agente especializado equivalente.
- [docs-operacao/20_PENDENCIAS.md](../../docs-operacao/20_PENDENCIAS.md) — destino dos achados que exigem correção.
