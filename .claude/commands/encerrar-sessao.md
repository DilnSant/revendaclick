---
description: Encerra a sessão — relata o que foi feito e atualiza a documentação operacional para a próxima retomada
---

# /encerrar-sessao

## Objetivo

Fechar a sessão deixando a documentação operacional pronta para a próxima retomada. Substitui a cópia manual de [`prompts/01_PROMPT_ENCERRAMENTO_SESSAO.md`](../../prompts/01_PROMPT_ENCERRAMENTO_SESSAO.md). Pode ser sugerido proativamente ao perceber que a sessão está terminando.

## Estrutura — execute nesta ordem

1. **Verificar commits pendentes:** `git status`. Se houver alteração relevante não commitada, decidir com o usuário — commitar agora (exige autorização, ver [`.claude/02_AUTORIZACOES.md`](../02_AUTORIZACOES.md)) ou registrar como pendência.
2. **Relatar a sessão** no formato de [`templates/RELATORIO_FINAL.md`](../../templates/RELATORIO_FINAL.md):

   ```
   STATUS: RESOLVIDO | PARCIAL | PENDENTE
   1. Feito   2. Arquivos alterados   3. Validações
   4. Documentação   5. Pendências   6. Riscos   7. Próximo passo
   ```

   Informar explicitamente se houve alteração de código, de banco, de documentação e se houve deploy.
3. **Atualizar a documentação afetada** — verificar, um a um, quais destes mudaram de fato:
   - [`docs-operacao/23_PROXIMO_PASSO.md`](../../docs-operacao/23_PROXIMO_PASSO.md) — **sempre**: estado atual + próximo passo da próxima sessão
   - [`docs-operacao/22_HISTORICO_ALTERACOES.md`](../../docs-operacao/22_HISTORICO_ALTERACOES.md) — snapshot por feature (topo) + entrada cronológica
   - [`docs-operacao/20_PENDENCIAS.md`](../../docs-operacao/20_PENDENCIAS.md) — novas pendências; concluídas migram para o histórico
   - [`docs-operacao/21_DECISOES_TECNICAS.md`](../../docs-operacao/21_DECISOES_TECNICAS.md) — decisões relevantes (ver [/registrar-decisao](registrar-decisao.md))
   - [`docs-operacao/MEMORY.md`](../../docs-operacao/MEMORY.md) — nomenclatura nova ou termo que se tornou obsoleto
   - [`docs-operacao/REFERENCE.md`](../../docs-operacao/REFERENCE.md), [`PRODUCT_ARCHITECTURE.md`](../../docs-operacao/PRODUCT_ARCHITECTURE.md), [`DEPENDENCIES.md`](../../docs-operacao/DEPENDENCIES.md), [`ENVIRONMENTS.md`](../../docs-operacao/ENVIRONMENTS.md) — se valores fixos, arquitetura, dependências ou ambientes mudaram
4. **Registrar bug corrigido:** se algum bug foi corrigido nesta sessão, criar o `FC` correspondente em [`docs-operacao/FalhasCorrigidas/`](../../docs-operacao/FalhasCorrigidas/) e indexá-lo no `README.md` da pasta. A regra da pasta é explícita: nunca corrigir bug sem registrar.
5. **Gerar um prompt curto** para iniciar a próxima sessão.

## Responsabilidades

- Não afirmar que uma validação passou se o comando não foi executado ([`.claude/04_VALIDACAO.md`](../04_VALIDACAO.md)).
- Não encerrar sem `docs-operacao/23_PROXIMO_PASSO.md` atualizado — é o primeiro arquivo que a próxima sessão lê.
- Nenhuma alteração relevante fica sem commit sem uma decisão explícita registrada como pendência.
- Não commitar, não dar push e não fazer deploy sem autorização.

## Relacionamento com Outros Documentos

- [prompts/01_PROMPT_ENCERRAMENTO_SESSAO.md](../../prompts/01_PROMPT_ENCERRAMENTO_SESSAO.md) — prompt manual equivalente.
- [templates/RELATORIO_FINAL.md](../../templates/RELATORIO_FINAL.md) e [templates/RESUMO_SESSAO.md](../../templates/RESUMO_SESSAO.md) — formatos de saída.
- [/abrir-sessao](abrir-sessao.md) — comando espelhado de início.
- [agents/gestor-memoria.md](../agents/gestor-memoria.md) — agente que executa esta atualização de forma mais elaborada.
