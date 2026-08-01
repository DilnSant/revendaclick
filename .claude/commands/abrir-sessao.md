---
description: Abre a sessão de trabalho — carrega o contexto mínimo e apresenta estado, próximo passo, pendências e riscos
---

# /abrir-sessao

## Objetivo

Iniciar uma sessão carregando apenas o contexto necessário e apresentar em que ponto o projeto está, antes de qualquer alteração. Substitui a cópia manual de [`prompts/00_PROMPT_INICIO_SESSAO.md`](../../prompts/00_PROMPT_INICIO_SESSAO.md).

Também é disparado por qualquer frase de intenção de continuidade ("vamos continuar", "bom dia", "vamos trabalhar").

## Estrutura — execute nesta ordem

1. **Ler o contexto mínimo obrigatório** (conforme [`docs-operacao/00_LEIA_PRIMEIRO.md`](../../docs-operacao/00_LEIA_PRIMEIRO.md)):
   - [`CLAUDE.md`](../../CLAUDE.md)
   - [`.claude/01_CONTEXTO.md`](../01_CONTEXTO.md)
   - [`.claude/02_AUTORIZACOES.md`](../02_AUTORIZACOES.md)
   - [`AI_GOVERNANCE/00_POLITICA_GERAL.md`](../../AI_GOVERNANCE/00_POLITICA_GERAL.md)
2. **Ler o estado do projeto** (lista "início de sessão simples" de `.claude/01_CONTEXTO.md`):
   - [`docs-operacao/23_PROXIMO_PASSO.md`](../../docs-operacao/23_PROXIMO_PASSO.md) — estado por componente e próximo passo definido no encerramento anterior
   - [`docs-operacao/20_PENDENCIAS.md`](../../docs-operacao/20_PENDENCIAS.md) — o que está aberto
   - [`docs-operacao/REFERENCE.md`](../../docs-operacao/REFERENCE.md) — valores fixos (IPs, IDs, URLs)
3. **Verificar o repositório:** `git status` e `git log -5`, para não ignorar trabalho não commitado de uma sessão anterior.
4. **Apresentar ao usuário**, em poucas linhas:
   1. Estado atual resumido
   2. Próximo passo recomendado
   3. Pendências abertas relevantes
   4. Riscos principais
   5. Documentos que foram lidos
   6. O que exige autorização
5. **Não alterar nenhum arquivo.** Aguardar aprovação antes de implementar.

### Início completo (somente sob demanda)

Quando o usuário pedir explicitamente um diagnóstico completo, ler também a lista "início de sessão completo" de [`.claude/01_CONTEXTO.md`](../01_CONTEXTO.md). Não usar por padrão — é leitura cara.

## Responsabilidades

- Não ler o projeto inteiro nem pastas inteiras: a economia de contexto é regra ([`AI_GOVERNANCE/00_POLITICA_GERAL.md`](../../AI_GOVERNANCE/00_POLITICA_GERAL.md)).
- Nunca afirmar que algo foi verificado sem ter executado o comando.
- Sinalizar imediatamente qualquer pendência crítica ou risco de produção, sem esperar o usuário perguntar.

## Relacionamento com Outros Documentos

- [.claude/01_CONTEXTO.md](../01_CONTEXTO.md) — define o que ler em cada tipo de tarefa.
- [docs-operacao/23_PROXIMO_PASSO.md](../../docs-operacao/23_PROXIMO_PASSO.md) — estado atual e próximo passo.
- [/encerrar-sessao](encerrar-sessao.md) — comando espelhado de fim de sessão.
- [prompts/00_PROMPT_INICIO_SESSAO.md](../../prompts/00_PROMPT_INICIO_SESSAO.md) — prompt manual equivalente.
