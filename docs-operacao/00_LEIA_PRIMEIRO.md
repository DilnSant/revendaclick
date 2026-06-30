# 00 — LEIA PRIMEIRO

Este é o ponto de entrada operacional do projeto.

Objetivo: orientar o Claude a carregar somente o contexto necessário, sem desperdiçar tokens e sem ler o projeto inteiro.

---


---

## Pastas auxiliares da IA

Estas pastas existem para apoiar o trabalho do Claude, mas não devem ser lidas por padrão:

- `memory/` — regras práticas, preferências do usuário e lições aprendidas
- `templates/` — modelos de resumo, autorização e relatório final
- `prompts/` — prompts operacionais curtos

Usar apenas quando a tarefa exigir.

Não ler essas pastas inteiras.

## Regra principal

Antes de qualquer tarefa, o Claude deve ler:

- `CLAUDE.md`
- `.claude/01_CONTEXTO.md`
- `.claude/02_AUTORIZACOES.md`
- `.claude/03_FLUXO_TRABALHO.md`
- `.claude/04_VALIDACAO.md`
- `AI_GOVERNANCE/00_POLITICA_GERAL.md`

Depois disso, deve carregar apenas os documentos específicos da tarefa.

---

## Não fazer

O Claude não deve:

- ler todas as pastas por padrão
- abrir todos os documentos por segurança
- refazer trabalho já feito
- alterar arquivos sem autorização quando houver risco
- executar deploy sem autorização
- criar migration sem autorização
- mexer em RLS sem autorização
- assumir que uma ação manual foi executada
- continuar sessão longa sem resumir

---

## Leitura mínima obrigatória

Para qualquer tarefa, ler:

- `docs-operacao/23_PROXIMO_PASSO.md`
- `docs-operacao/REFERENCE.md`

Se houver pendência envolvida, ler também:

- `docs-operacao/20_PENDENCIAS.md`

---

## Leitura por tipo de tarefa

| Tipo de tarefa | Ler também |
|---|---|
| Arquitetura | `docs-operacao/PRODUCT_ARCHITECTURE.md`, `docs-operacao/21_DECISOES_TECNICAS.md`, `docs-operacao/MEMORY.md` |
| Frontend | `docs-operacao/PRODUCT_ARCHITECTURE.md`, `docs-operacao/MEMORY.md`, `docs-operacao/features/FEATURE_FLAGS_SNAPSHOT.md`, `docs-operacao/features/SIDEBAR_SNAPSHOT.md` |
| Backend | `docs-operacao/DEPENDENCIES.md`, `docs-operacao/PRODUCT_ARCHITECTURE.md`, `docs-operacao/08_API_ROTAS_REAIS.md` |
| Banco / Migration | `docs-operacao/REFERENCE.md`, `docs-operacao/21_DECISOES_TECNICAS.md`, `docs-operacao/PRODUCT_ARCHITECTURE.md` |
| Deploy | `prompts/04_PROMPT_DEPLOY.md`, `docs-operacao/ENVIRONMENTS.md`, `docs-operacao/DEPENDENCIES.md`, `docs-operacao/REFERENCE.md` |
| Bug crítico | `prompts/03_PROMPT_BUG_CRITICO.md`, `docs-operacao/FalhasCorrigidas/README.md` |
| Auditoria | `prompts/02_PROMPT_AUDITORIA.md`, `docs-operacao/REFERENCE.md`, `docs-operacao/MEMORY.md`, `docs-operacao/PRODUCT_ARCHITECTURE.md`, `docs-operacao/DEPENDENCIES.md`, `docs-operacao/ENVIRONMENTS.md`, `docs-operacao/21_DECISOES_TECNICAS.md`, `docs-operacao/22_HISTORICO_ALTERACOES.md`, `docs-operacao/23_PROXIMO_PASSO.md` |
| Encerramento | `prompts/01_PROMPT_ENCERRAMENTO_SESSAO.md` |

---

## Quando usar diagnóstico completo

Usar diagnóstico completo somente quando o usuário pedir:

- "início de sessão completo"
- "diagnóstico completo"
- "auditoria geral"
- "verifique tudo"
- "reconcilie documentação e código"
- "quero retomar o projeto do zero"

Nesse caso, ler:

- `docs-operacao/REFERENCE.md`
- `docs-operacao/MEMORY.md`
- `docs-operacao/PRODUCT_ARCHITECTURE.md`
- `docs-operacao/DEPENDENCIES.md`
- `docs-operacao/ENVIRONMENTS.md`
- `docs-operacao/20_PENDENCIAS.md`
- `docs-operacao/21_DECISOES_TECNICAS.md`
- `docs-operacao/22_HISTORICO_ALTERACOES.md`
- `docs-operacao/23_PROXIMO_PASSO.md`

---

## Conceitos obrigatórios do projeto

### Planos oficiais

Usar somente:

- `starter`
- `pro`
- `premium`
- `scale`

Não usar:

- `start`
- `performance`
- `enterprise` como `plan.name`

---

## Feature flags

Controle de acesso deve usar feature flags.

Não usar comparação direta de plano no frontend.

Errado:

`if (plan === 'pro')`

Correto:

`hasFeature(...)`

Antes de alterar gates de acesso, verificar documentação e código real.

---

## WhatsApp da Loja versus Central de Atendimento

### WhatsApp da Loja

- contato público da loja
- usado na vitrine pública
- link direto para WhatsApp
- não usa Evolution API
- não usa QR Code

### Central de Atendimento

- integração interna
- usa Evolution API
- usa QR Code
- depende de add-on ou feature flag
- pode envolver automações e IA

Nunca misturar esses dois conceitos.

---

## Super Admin

O `super_admin`:

- não representa uma loja
- não opera tenant comercial
- pode ter `tenant_id = NULL`
- acessa `/admin`
- não deve ser redirecionado como usuário comum de tenant

---

## Multi-tenant

Toda alteração que tocar dados deve preservar:

- `tenant_id`
- RLS
- isolamento entre tenants
- autorização correta
- JWT correto
- service role apenas quando justificado

Risco cross-tenant é incidente crítico.

---

## Banco de dados

Antes de criar migration:

1. verificar última migration em `docs-operacao/REFERENCE.md`
2. verificar pasta `database/migrations/`
3. confirmar próximo número
4. avaliar impacto em RLS
5. avaliar impacto em `database.types.ts`
6. pedir autorização

Nunca criar migration por tentativa e erro.

---

## Produção

Antes de qualquer ação em produção:

1. confirmar ambiente
2. confirmar risco
3. confirmar rollback
4. confirmar comando de validação
5. pedir autorização

Nunca assumir que deploy funcionou.

Validar healthcheck.

---

## Sessões longas

Se a sessão passar de 15 a 20 mensagens ou ficar confusa:

1. parar
2. resumir decisões
3. listar arquivos alterados
4. listar pendências
5. indicar próximo passo
6. abrir nova sessão com o resumo

---

## Correção cirúrgica

Se uma alteração estiver parcialmente errada:

- não refazer tudo
- corrigir apenas o trecho necessário
- manter o restante estável

---

## Encerramento de sessão

Ao final de uma tarefa com alteração, executar o procedimento de:

- `prompts/01_PROMPT_ENCERRAMENTO_SESSAO.md`

Atualizar documentação operacional quando o comportamento real do sistema mudar.

---

## Regra final

A tarefa não está concluída enquanto código e documentação estiverem divergentes.
