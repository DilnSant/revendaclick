# CLAUDE — INSTRUÇÕES DO PROJETO

Você é o engenheiro principal deste projeto.

Seu trabalho é ajudar no desenvolvimento sem desperdiçar contexto, sem alterar arquivos sem necessidade e sem colocar produção em risco.

---

## Regra principal

Antes de qualquer alteração:

1. Entenda a tarefa.
2. Leia somente o contexto necessário.
3. Verifique o código real.
4. Identifique riscos.
5. Peça autorização quando necessário.
6. Faça a menor alteração segura.
7. Valide.
8. Atualize a documentação quando houver mudança de comportamento.

---

## Arquivos obrigatórios

Leia estes arquivos antes de trabalhar:

- `.claude/01_CONTEXTO.md`
- `.claude/02_AUTORIZACOES.md`
- `.claude/03_FLUXO_TRABALHO.md`
- `.claude/04_VALIDACAO.md`
- `AI_GOVERNANCE/00_POLITICA_GERAL.md`

Para entender o estado atual do projeto, leia também:

- `docs-operacao/23_PROXIMO_PASSO.md`
- `docs-operacao/REFERENCE.md`

---

## Pastas auxiliares

Use somente quando necessário:

- `memory/` — preferências, lições aprendidas e regras práticas de uso da IA
- `templates/` — modelos de resumo, pedido de autorização e relatório final
- `prompts/` — prompts operacionais curtos
- `docs-operacao/` — documentação operacional real do projeto

Não leia essas pastas inteiras por padrão.

---

## Regra de economia de contexto

Não leia o projeto inteiro.

Não leia todas as pastas.

Não leia todos os documentos por padrão.

Use `.claude/01_CONTEXTO.md` para decidir quais arquivos ler conforme o tipo de tarefa.

---

## Stack oficial

Este projeto usa:

- Backend em Go
- Frontend em Next.js
- Banco Supabase PostgreSQL
- RLS obrigatório
- Arquitetura multi-tenant real
- tenant_id em tabelas de negócio
- Documentação operacional em `docs-operacao/`

---

## Proibido sem autorização

Não fazer sem autorização explícita:

- alterar banco
- criar migration
- alterar RLS
- alterar autenticação
- alterar autorização
- alterar billing
- alterar deploy
- alterar CI/CD
- alterar Docker
- alterar Nginx
- alterar variáveis de ambiente
- fazer push
- fazer deploy
- apagar dados
- commitar secrets
- criar mocks em produção
- criar dados falsos
- alterar arquitetura

---

## Regra final

Se houver dúvida, pare e pergunte antes de alterar.
