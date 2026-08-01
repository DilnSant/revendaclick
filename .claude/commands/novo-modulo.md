---
description: Planeja e documenta um novo módulo ou feature antes da implementação começar
argument-hint: <nome-do-modulo>
---

# /novo-modulo

## Objetivo

Garantir que nenhum módulo ou feature entre no projeto sem passar por avaliação de impacto e sem sua documentação mínima — evitando que a documentação operacional fique atrás do código.

## Estrutura — execute nesta ordem

1. **Verificar se já existe.** Procurar em [`docs-operacao/22_HISTORICO_ALTERACOES.md`](../../docs-operacao/22_HISTORICO_ALTERACOES.md) (snapshot por feature, no topo) e em [`docs-operacao/PRODUCT_ARCHITECTURE.md`](../../docs-operacao/PRODUCT_ARCHITECTURE.md). Não recriar o que já existe sob outro nome — conferir também nomenclatura obsoleta em [`docs-operacao/MEMORY.md`](../../docs-operacao/MEMORY.md).
2. **Confirmar aderência ao produto.** O módulo atende a um requisito já documentado em [`docs-produto/01-requisitos-funcionais.md`](../../docs-produto/01-requisitos-funcionais.md)? Se não, é escopo novo — registrar o RF antes de implementar.
3. **Avaliar o impacto arquitetural** — invocar o agente [`agents/planejador-arquitetura.md`](../agents/planejador-arquitetura.md) quando a mudança não for trivial.
4. **Levantar** (se não estiver claro pelo contexto):
   - Propósito e o que o módulo expõe
   - Localização no repositório (`backend/internal/…`, `frontend/app/…`, `frontend/components/…`)
   - Novas tabelas ou colunas → exige migration e política RLS (**autorização obrigatória**)
   - Novos endpoints → precisam entrar em [`docs-operacao/08_API_ROTAS_REAIS.md`](../../docs-operacao/08_API_ROTAS_REAIS.md)
   - Isolamento multi-tenant: `tenant_id` e RLS aplicáveis
   - Gate por plano ou feature flag → [`docs-operacao/features/FEATURE_FLAGS_SNAPSHOT.md`](../../docs-operacao/features/FEATURE_FLAGS_SNAPSHOT.md)
   - Item de menu → [`docs-operacao/features/SIDEBAR_SNAPSHOT.md`](../../docs-operacao/features/SIDEBAR_SNAPSHOT.md)
   - Novas dependências → [`docs-operacao/DEPENDENCIES.md`](../../docs-operacao/DEPENDENCIES.md) (**autorização obrigatória**)
   - Novas variáveis de ambiente → [`docs-operacao/ENVIRONMENTS.md`](../../docs-operacao/ENVIRONMENTS.md) + allowlist `environment:` do `docker-compose.production.yml` (**autorização obrigatória**; causa raiz do FC064)
5. **Apresentar o plano** ao usuário: arquivos que serão criados, riscos, o que exige autorização e como será validado ([`.claude/04_VALIDACAO.md`](../04_VALIDACAO.md)). Aguardar aprovação.
6. **Após implementar**, atualizar: o snapshot por feature em `22_HISTORICO_ALTERACOES.md`, os snapshots de `features/` afetados, e `08_API_ROTAS_REAIS.md` se houve endpoint novo.

## Responsabilidades

- Não deixar seções em branco na documentação — se falta informação, perguntar antes de escrever.
- Não documentar comportamento ainda não implementado como se já existisse.
- Não inventar tabela, endpoint ou regra de negócio ([`AI_GOVERNANCE/00_POLITICA_GERAL.md`](../../AI_GOVERNANCE/00_POLITICA_GERAL.md)).
- Ao criar diretório de rota no Next.js, verificar com `git check-ignore -v <caminho>` se o arquivo não está sendo silenciosamente ignorado (decisão D35 / FC057).

## Relacionamento com Outros Documentos

- [.claude/03_FLUXO_TRABALHO.md](../03_FLUXO_TRABALHO.md) — fluxo padrão que este comando detalha para o caso "módulo novo".
- [docs-produto/](../../docs-produto/) — o que o sistema *deve fazer* (requisitos, regras de negócio).
- [docs-operacao/](../../docs-operacao/) — como o sistema *é* hoje; destino da documentação gerada.
- [agents/planejador-arquitetura.md](../agents/planejador-arquitetura.md) — avaliação de impacto arquitetural.
