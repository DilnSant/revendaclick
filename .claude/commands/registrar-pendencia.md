---
description: Registra uma pendência em docs-operacao/20_PENDENCIAS.md
argument-hint: <descrição breve da pendência>
---

# /registrar-pendencia

## Objetivo

Registrar um bloqueio, dívida técnica ou item adiado em [`docs-operacao/20_PENDENCIAS.md`](../../docs-operacao/20_PENDENCIAS.md) no momento em que é identificado, evitando que se perca entre sessões.

## Estrutura — execute nesta ordem

1. **Coletar** (do usuário ou da conversa): tarefa, prioridade e detalhes (contexto, origem, o que já se sabe).
2. **Escolher a seção correta** do arquivo — as pendências são agrupadas por área, não em lista única: `Infraestrutura`, `Backend`, `Frontend`, `Banco de Dados`, `FlutterFlow`, `Observabilidade`, `Segurança`, `Documentação`, `Backlog de Infraestrutura`. Se nenhuma servir, perguntar ao usuário antes de criar uma seção nova.
3. **Acrescentar uma linha** à tabela da seção, no formato já usado no arquivo:

   ```markdown
   | PENDENTE | <tarefa> | <Alta|Média|Baixa> | <detalhes: contexto, origem, evidência, commit ou FC relacionado> |
   ```

   Status válidos (definidos no topo do arquivo): `PENDENTE` (não iniciada), `EM ANDAMENTO` (iniciada nesta sessão), `CONCLUÍDA` (move-se para [`22_HISTORICO_ALTERACOES.md`](../../docs-operacao/22_HISTORICO_ALTERACOES.md)).
4. **Atualizar a data** do cabeçalho "Atualizado em" no topo do arquivo.
5. **Confirmar ao usuário**, mostrando o trecho adicionado.
6. Se a prioridade for **Alta** e houver risco de produção, multi-tenant, RLS ou billing, alertar explicitamente que isso deve bloquear o próximo deploy.

## Responsabilidades

- Não classificar uma pendência como `Baixa` só para evitar tratá-la — a prioridade reflete o risco real.
- Detalhes suficientes para que a pendência seja compreensível em outra sessão, sem o contexto da conversa atual.
- Se a pendência nasceu de um bug já corrigido, referenciar o `FC` correspondente em [`docs-operacao/FalhasCorrigidas/`](../../docs-operacao/FalhasCorrigidas/).

## Relacionamento com Outros Documentos

- [docs-operacao/20_PENDENCIAS.md](../../docs-operacao/20_PENDENCIAS.md) — destino do registro.
- [docs-operacao/22_HISTORICO_ALTERACOES.md](../../docs-operacao/22_HISTORICO_ALTERACOES.md) — destino das pendências concluídas.
- [/abrir-sessao](abrir-sessao.md) — lê este arquivo no início de toda sessão.
