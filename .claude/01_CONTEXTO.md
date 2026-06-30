# 01 — CONTEXTO

Este arquivo define o que o Claude deve ler em cada tipo de tarefa.

Objetivo: economizar contexto e evitar leitura desnecessária.

---

## Regra geral

Não carregar tudo.

Não ler pasta inteira.

Não abrir documentos que não estejam relacionados à tarefa.

Ler apenas o necessário para responder ou executar com segurança.

---

## Sempre ler

Para qualquer tarefa:

- `CLAUDE.md`
- `AI_GOVERNANCE/00_POLITICA_GERAL.md`
- `docs-operacao/23_PROXIMO_PASSO.md`
- `docs-operacao/REFERENCE.md`

---

## Se for início de sessão simples

Ler:

- `CLAUDE.md`
- `.claude/01_CONTEXTO.md`
- `docs-operacao/23_PROXIMO_PASSO.md`
- `docs-operacao/20_PENDENCIAS.md`
- `docs-operacao/REFERENCE.md`

Depois apresentar:

1. Estado atual resumido
2. Próxima ação recomendada
3. Riscos principais
4. O que precisa de autorização

---

## Se for início de sessão completo

Ler:

- `docs-operacao/00_LEIA_PRIMEIRO.md`
- `docs-operacao/REFERENCE.md`
- `docs-operacao/MEMORY.md`
- `docs-operacao/PRODUCT_ARCHITECTURE.md`
- `docs-operacao/DEPENDENCIES.md`
- `docs-operacao/ENVIRONMENTS.md`
- `docs-operacao/20_PENDENCIAS.md`
- `docs-operacao/21_DECISOES_TECNICAS.md`
- `docs-operacao/22_HISTORICO_ALTERACOES.md`
- `docs-operacao/23_PROXIMO_PASSO.md`

Usar início completo somente quando o usuário pedir diagnóstico completo.

---

## Se a tarefa for frontend

Ler:

- `docs-operacao/PRODUCT_ARCHITECTURE.md`
- `docs-operacao/MEMORY.md`
- `docs-operacao/features/FEATURE_FLAGS_SNAPSHOT.md`
- `docs-operacao/features/SIDEBAR_SNAPSHOT.md`

Depois verificar os arquivos reais do frontend antes de alterar.

---

## Se a tarefa for backend

Ler:

- `docs-operacao/DEPENDENCIES.md`
- `docs-operacao/PRODUCT_ARCHITECTURE.md`
- `docs-operacao/08_API_ROTAS_REAIS.md`

Depois verificar os arquivos reais do backend antes de alterar.

---

## Se a tarefa for banco ou migration

Ler:

- `docs-operacao/REFERENCE.md`
- `docs-operacao/21_DECISOES_TECNICAS.md`
- `docs-operacao/PRODUCT_ARCHITECTURE.md`

Depois verificar:

- `database/migrations/`
- `frontend/src/types/database.types.ts`

---

## Se a tarefa for deploy

Ler:

- `prompts/04_PROMPT_DEPLOY.md`
- `docs-operacao/ENVIRONMENTS.md`
- `docs-operacao/DEPENDENCIES.md`
- `docs-operacao/REFERENCE.md`

---

## Se a tarefa for bug crítico

Ler:

- `prompts/03_PROMPT_BUG_CRITICO.md`
- `docs-operacao/FalhasCorrigidas/README.md`

Depois procurar falha semelhante em:

- `docs-operacao/FalhasCorrigidas/`

---

## Se a tarefa for auditoria

Ler:

- `prompts/02_PROMPT_AUDITORIA.md`
- `docs-operacao/REFERENCE.md`
- `docs-operacao/MEMORY.md`
- `docs-operacao/PRODUCT_ARCHITECTURE.md`
- `docs-operacao/DEPENDENCIES.md`
- `docs-operacao/ENVIRONMENTS.md`
- `docs-operacao/21_DECISOES_TECNICAS.md`
- `docs-operacao/22_HISTORICO_ALTERACOES.md`
- `docs-operacao/23_PROXIMO_PASSO.md`

---

## Se precisar considerar preferências do usuário

Ler somente:

- `memory/01_PREFERENCIAS_USUARIO.md`

Não ler todos os arquivos de `memory/`.

---

## Se a tarefa envolver melhoria do uso da IA

Ler:

- `memory/00_REGRAS_DE_USO_IA.md`
- `memory/02_LICOES_APRENDIDAS.md`

---

## Se precisar encerrar ou resumir sessão

Usar:

- `templates/RESUMO_SESSAO.md`
- `templates/RELATORIO_FINAL.md`

---

## Se precisar pedir autorização

Usar:

- `templates/PEDIDO_AUTORIZACAO.md`

---

## Regra de sessão longa

Se a conversa passar de 15 a 20 mensagens ou ficar confusa:

1. Gerar resumo da sessão.
2. Registrar o que foi decidido.
3. Registrar pendências.
4. Abrir nova sessão usando o resumo.

Não continuar acumulando contexto indefinidamente.
