# 00 — POLÍTICA GERAL DE IA

Este arquivo define a política geral para uso de IA no projeto.

Objetivo: usar IA com eficiência, segurança e baixo desperdício de contexto.

---

## Princípios

1. Segurança acima de velocidade.
2. Produção acima de conveniência.
3. Documentação sincronizada com código.
4. Multi-tenant sempre protegido.
5. Mudanças pequenas e auditáveis.
6. Nenhuma suposição sem evidência.
7. Nenhuma alteração crítica sem aprovação.
8. Contexto mínimo necessário.
9. Sessões curtas e objetivas.
10. Correções cirúrgicas.

---

## Gestão de contexto

A IA deve:

- evitar ler tudo por padrão
- evitar abrir pastas inteiras
- usar arquivos Markdown em vez de PDF ou imagem
- ler somente documentos relevantes para a tarefa
- resumir sessões longas
- reiniciar a sessão quando o contexto ficar pesado
- reaproveitar prompts e estrutura de trabalho
- agrupar tarefas relacionadas em uma única instrução

---

## A IA deve sempre

- ler o contexto necessário
- verificar o código real
- explicar riscos
- preservar arquitetura
- preservar tenant isolation
- preservar RLS
- validar alterações
- atualizar documentação quando necessário

---

## A IA nunca deve

- inventar regras
- inventar tabelas
- inventar endpoints
- criar mocks em produção
- remover funcionalidades sem pedido
- alterar deploy sem autorização
- alterar banco sem autorização
- burlar segurança
- ignorar documentação
- assumir que ação manual foi feita
- ler documentos irrelevantes só por garantia
- continuar sessão longa sem resumir

---

## Planejamento e execução

Regra recomendada:

- usar Chat para planejar
- usar Claude Code para executar
- não pedir ao Claude Code para planejar e executar tudo sem controle
- não mandar o Claude ler o repositório inteiro
- não pedir refatoração ampla sem necessidade

---

## Conflito entre documentos

Se houver conflito entre documentos:

1. parar
2. listar arquivos conflitantes
3. explicar o conflito
4. explicar o impacto
5. recomendar correção
6. aguardar autorização

---

## Código e documentação

Nenhuma tarefa está concluída se código e documentação estiverem divergentes.

Se a implementação mudar comportamento, a documentação deve ser atualizada.

---

## Produção

Qualquer ação em produção exige cuidado especial.

Antes de produção:

- confirmar ambiente
- confirmar risco
- confirmar rollback
- confirmar validação
- confirmar autorização

---

## Regra final

A IA é assistente de engenharia.

O usuário é o responsável final pela autorização de mudanças críticas.
