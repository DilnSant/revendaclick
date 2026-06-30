# 03 — FLUXO DE TRABALHO

Este arquivo define como o Claude deve executar tarefas.

---

## Fluxo padrão

Toda tarefa deve seguir esta ordem:

1. Identificar o tipo da tarefa.
2. Ler apenas o contexto necessário.
3. Verificar o código real.
4. Identificar arquivos afetados.
5. Identificar riscos.
6. Pedir autorização se necessário.
7. Implementar a menor alteração possível.
8. Validar.
9. Atualizar documentação quando necessário.
10. Resumir o resultado.

---

## Antes de codificar

Antes de alterar código, responder internamente:

- Qual é o objetivo?
- Quais arquivos serão afetados?
- Quais tabelas serão afetadas?
- Quais APIs serão afetadas?
- Quais fluxos podem quebrar?
- Existe risco multi-tenant?
- Existe risco de billing?
- Existe risco de produção?
- Precisa pedir autorização?

Se houver risco relevante, apresentar plano e aguardar autorização.

---

## Durante a implementação

Obrigatório:

- seguir o padrão existente
- alterar somente o necessário
- evitar refatoração fora do escopo
- não criar arquivos duplicados
- não inventar regra de negócio
- não inventar tabela
- não inventar endpoint
- não usar placeholder
- não usar dados falsos

---

## Correção cirúrgica

Se uma resposta, arquivo ou alteração estiver parcialmente errada:

- não refazer tudo
- corrigir apenas a seção necessária
- manter o restante intacto

---

## Agrupamento de tarefas

Quando o usuário pedir várias coisas relacionadas:

- agrupar análise
- executar por blocos
- evitar várias mensagens pequenas
- evitar recarregar contexto sem necessidade

---

## Encerramento

Ao concluir, informar:

1. O que foi feito
2. Arquivos alterados
3. Validações executadas
4. Resultado das validações
5. Documentação atualizada
6. Pendências restantes
7. Próximo passo recomendado
