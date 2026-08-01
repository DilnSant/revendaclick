---
description: Verifica o checklist do dia — o que já está satisfeito e o que falta antes de encerrar
---

# /checklist-dia

## Objetivo

Apresentar o checklist do dia e verificar automaticamente o que já está satisfeito (build, tipos, testes, `git status`), reduzindo checagem manual. É o elo entre [`/abrir-sessao`](abrir-sessao.md) e [`/encerrar-sessao`](encerrar-sessao.md).

## Estrutura — o checklist

**Início**
- [ ] [`/abrir-sessao`](abrir-sessao.md) executado; nenhuma pendência crítica de [`docs-operacao/20_PENDENCIAS.md`](../../docs-operacao/20_PENDENCIAS.md) ignorada.
- [ ] Escopo do dia claro e alinhado com o usuário.

**Durante o desenvolvimento**
- [ ] Cada tarefa segue o fluxo de [`.claude/03_FLUXO_TRABALHO.md`](../03_FLUXO_TRABALHO.md).
- [ ] Nenhuma ação da lista "deve pedir autorização antes" executada sem confirmação ([`.claude/02_AUTORIZACOES.md`](../02_AUTORIZACOES.md)).
- [ ] Alteração mínima necessária; sem refatoração fora de escopo; sem placeholder, mock ou dado falso.
- [ ] Isolamento multi-tenant e RLS preservados.
- [ ] Validações de [`.claude/04_VALIDACAO.md`](../04_VALIDACAO.md) executadas na área tocada:
  - frontend → `cd frontend && npx tsc --noEmit`
  - backend → `cd backend && go build ./... && go vet ./... && go test ./...`
- [ ] Documentação atualizada junto com o código, quando houve mudança de comportamento.

**Encerramento**
- [ ] Nenhuma alteração relevante sem commit sem decisão registrada.
- [ ] Decisões e pendências do dia registradas ([/registrar-decisao](registrar-decisao.md), [/registrar-pendencia](registrar-pendencia.md)).
- [ ] Bug corrigido registrado em [`docs-operacao/FalhasCorrigidas/`](../../docs-operacao/FalhasCorrigidas/).
- [ ] [`/encerrar-sessao`](encerrar-sessao.md) executado.

## Instruções de execução

1. Para cada item verificável (build, tipos, testes, lint, `git status`), **rodar a verificação** e marcar satisfeito ou pendente — nunca marcar sem execução real.
2. Para itens de julgamento humano ("documentação atualizada"), perguntar ao usuário.
3. Apontar claramente o que ainda exige ação antes do encerramento.

## Relacionamento com Outros Documentos

- [.claude/03_FLUXO_TRABALHO.md](../03_FLUXO_TRABALHO.md) — fluxo padrão de execução de tarefa.
- [.claude/04_VALIDACAO.md](../04_VALIDACAO.md) — comandos mínimos de validação.
- [/encerrar-sessao](encerrar-sessao.md) — passo seguinte quando o checklist está satisfeito.
