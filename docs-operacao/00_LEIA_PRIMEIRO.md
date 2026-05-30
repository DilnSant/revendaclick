# REVENDACLICK — LEIA PRIMEIRO

Este é o ponto de entrada oficial para qualquer agente IA, desenvolvedor ou manutenção no projeto.

Nenhuma implementação deve ser iniciada antes da leitura completa dos documentos abaixo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEITURA OBRIGATÓRIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ler exatamente nesta ordem:

1. CLAUDE.md

2. docs-operacao/REFERENCE.md

3. docs-operacao/MEMORY.md

4. docs-operacao/PRODUCT_ARCHITECTURE.md

5. docs-operacao/DEPENDENCIES.md

6. docs-operacao/ENVIRONMENTS.md

7. docs-operacao/20_PENDENCIAS.md

8. docs-operacao/21_DECISOES_TECNICAS.md

9. docs-operacao/22_HISTORICO_ALTERACOES.md

10. docs-operacao/23_PROXIMO_PASSO.md

11. Todos os snapshots:

docs-operacao/features/

12. Todos os prompts:

docs-operacao/prompts/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPTS OFICIAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

00_PROMPT_INICIO_SESSAO.md

01_PROMPT_ENCERRAMENTO_SESSAO.md

02_PROMPT_AUDITORIA.md

03_PROMPT_BUG_CRITICO.md

04_PROMPT_DEPLOY.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALIDAÇÃO DE CONCEITOS OFICIAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antes de qualquer alteração, confirmar entendimento dos conceitos abaixo.

━━━━━━━━━━━━━━━━━━
PLANOS
━━━━━━━━━━━━━━━━━━

Nomes internos (banco) e comerciais (UX):

starter   → Starter
pro       → Pro
premium   → Premium
scale     → Scale

IMPORTANTE:

O banco, a API, o frontend e toda a documentação utilizam:

premium

como nome oficial do plano 3.

Nunca usar 'performance' como plan_name — não existe mais (migration 026).

━━━━━━━━━━━━━━━━━━
WHATSAPP DA LOJA
━━━━━━━━━━━━━━━━━━

Função:

- contato público da loja
- botão falar via WhatsApp
- atendimento manual
- negociação direta

Não utiliza:

- Evolution
- QR Code
- automação

Faz parte do plano base.

━━━━━━━━━━━━━━━━━━
CENTRAL DE ATENDIMENTO
━━━━━━━━━━━━━━━━━━

Função:

- Evolution
- QR Code
- atendimento centralizado
- mensagens automáticas
- notificações
- automações

Depende do add-on:

whatsapp_automation

Não é o mesmo conceito de WhatsApp da Loja.

━━━━━━━━━━━━━━━━━━
SUPER ADMIN
━━━━━━━━━━━━━━━━━━

Super Admin:

- não representa uma loja
- não opera tenant comercial
- não utiliza tenant operacional
- não possui branding de loja

Acesso:

/admin

━━━━━━━━━━━━━━━━━━
TENANTS
━━━━━━━━━━━━━━━━━━

Tenant operacional atual:

santos-car

Devecar:

- não é tenant operacional ativo
- não deve ser utilizado como referência operacional
- utilizar apenas como histórico quando necessário

━━━━━━━━━━━━━━━━━━
FEATURE FLAGS
━━━━━━━━━━━━━━━━━━

Permissões devem utilizar:

feature flags

Nunca utilizar:

plan_name

para controle de acesso.

Exemplo incorreto:

if (plan === 'pro')

Exemplo correto:

if (hasFeature('crm'))

━━━━━━━━━━━━━━━━━━
ADD-ONS OFICIAIS
━━━━━━━━━━━━━━━━━━

user_extra

- +1 usuário
- R$20/mês

whatsapp_automation

- Central de Atendimento
- QR Code
- Evolution
- automações
- R$39/mês

ia_recovery

- recuperação automática
- follow-up IA
- lembretes IA
- R$39/mês

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS OBRIGATÓRIAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nunca:

- assumir comportamento
- assumir arquitetura
- assumir estrutura do banco
- assumir feature flag
- assumir deploy realizado

Sempre:

- verificar documentação
- verificar código
- verificar migrations
- verificar histórico
- verificar snapshots

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONFLITOS DOCUMENTAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Se existir conflito entre documentos:

PARAR.

Apresentar:

1. arquivo

2. conflito encontrado

3. impacto

4. risco

5. recomendação

Não iniciar implementação até resolver o conflito.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APÓS A LEITURA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antes de qualquer implementação apresentar obrigatoriamente:

1. Estado atual do projeto

2. Arquitetura ativa

3. Ambiente ativo

4. Últimas alterações relevantes

5. Pendências abertas

6. Próximo passo recomendado

7. Riscos conhecidos

8. Divergências encontradas

9. Conceitos obsoletos encontrados

10. Documentação impactada pela tarefa solicitada

11. Possíveis riscos de regressão

Aguardar aprovação antes de iniciar alterações.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANTES DE CODIFICAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Identificar:

1. causa raiz

2. arquivos afetados

3. tabelas afetadas

4. APIs afetadas

5. fluxos afetados

6. feature flags afetadas

7. billing afetado

8. multi-tenant afetado

9. documentação afetada

10. testes necessários

Apresentar análise antes da implementação.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AÇÕES MANUAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Se existir qualquer ação manual necessária:

PARAR.

Entregar exatamente:

1. caminho

2. tela

3. botão

4. valor

5. comando

6. ordem correta

7. resultado esperado

Nunca assumir que a ação foi executada.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENCERRAMENTO OBRIGATÓRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ao finalizar qualquer tarefa executar integralmente:

docs-operacao/prompts/01_PROMPT_ENCERRAMENTO_SESSAO.md

Nenhuma sessão deve ser encerrada sem:

- atualização documental
- atualização de histórico
- atualização de pendências
- atualização de próximos passos
- atualização de snapshots afetados

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRA FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nenhuma implementação é considerada concluída enquanto existir divergência entre:

CÓDIGO

e

DOCUMENTAÇÃO.

A documentação operacional é a fonte oficial da verdade do projeto.
