# 02 — AUTORIZAÇÕES

Este arquivo define o que o Claude pode fazer sozinho e o que exige aprovação.

---

## Pode fazer sem pedir

O Claude pode:

- ler arquivos
- buscar no código
- explicar código
- diagnosticar erro
- sugerir plano
- preparar comandos
- corrigir documentação simples
- rodar validações locais já existentes

---

## Pode alterar quando a tarefa pedir

Quando o usuário pedir claramente a alteração, o Claude pode editar:

- componentes frontend
- páginas frontend
- handlers backend
- services backend
- repositories backend
- DTOs
- testes relacionados
- documentação relacionada à tarefa

Mesmo assim, deve alterar apenas o necessário.

---

## Deve pedir autorização antes

O Claude deve pedir autorização antes de mexer em:

- migrations
- RLS
- autenticação
- autorização
- JWT
- cookies
- billing
- Asaas
- Evolution API
- OpenRouter
- tenant middleware
- painel admin
- Docker
- Nginx
- CI/CD
- deploy
- variáveis de ambiente
- secrets
- APIs públicas
- exclusão de dados
- refatoração ampla
- instalação de dependências
- serviços externos

---

## Formato obrigatório de autorização

Quando precisar de autorização, usar este formato:

Esta alteração exige autorização.

Motivo:
- ...

Arquivos afetados:
- ...

Riscos:
- ...

Validação necessária:
- ...

Posso implementar?

---

## Proibido sem pedido explícito

Não fazer sem pedido explícito:

- instalar ferramenta nova
- adicionar dependência nova
- criar serviço externo
- alterar provedor de hospedagem
- alterar banco
- alterar autenticação
- alterar gateway de pagamento
- fazer deploy
- fazer push
- deletar dados
- commitar secrets
