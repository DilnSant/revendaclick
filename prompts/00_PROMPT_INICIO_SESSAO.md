# PROMPT OFICIAL DE INÍCIO DE SESSÃO — REVENDACLICK

Copiar e colar integralmente no início de toda nova sessão.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJETIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antes de qualquer alteração:

✓ entender o estado atual do sistema

✓ entender a arquitetura vigente

✓ entender os fluxos de negócio

✓ identificar pendências

✓ identificar riscos

✓ identificar causa raiz

✓ evitar regressões

✓ manter código e documentação sincronizados

Nunca corrigir por tentativa e erro.

Nunca assumir.

Sempre provar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 1 — LEITURA OBRIGATÓRIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ler nesta ordem:

1. CLAUDE.md

2. docs-operacao/00_LEIA_PRIMEIRO.md

3. docs-operacao/REFERENCE.md

4. docs-operacao/MEMORY.md

5. docs-operacao/PRODUCT_ARCHITECTURE.md

6. docs-operacao/DEPENDENCIES.md

7. docs-operacao/ENVIRONMENTS.md

8. docs-operacao/20_PENDENCIAS.md

9. docs-operacao/21_DECISOES_TECNICAS.md

10. docs-operacao/22_HISTORICO_ALTERACOES.md

11. docs-operacao/23_PROXIMO_PASSO.md

12. Todos os snapshots relevantes:

docs-operacao/features/

13. Todos os prompts:

prompts/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 2 — DIAGNÓSTICO OBRIGATÓRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Após a leitura apresentar:

### Estado Atual

- o que está funcionando
- o que está em desenvolvimento
- o que está bloqueado

### Arquitetura Ativa

- Frontend
- Backend
- Banco
- Billing
- WhatsApp
- IA
- Deploy

### Ambiente Ativo

- produção
- homologação
- desenvolvimento

### Últimas Alterações

Baseado em:

docs-operacao/22_HISTORICO_ALTERACOES.md

### Pendências Abertas

Baseado em:

docs-operacao/20_PENDENCIAS.md

### Próximo Passo Recomendado

Baseado em:

docs-operacao/23_PROXIMO_PASSO.md

### Riscos Conhecidos

Identificar:

- bugs críticos
- riscos operacionais
- riscos multi-tenant
- riscos de deploy

### Divergências Encontradas

Listar qualquer conflito encontrado entre documentos.

### Conceitos Obsoletos Encontrados

Listar qualquer conceito ainda não migrado.

Aguardar aprovação antes de iniciar alterações.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 3 — VALIDAR CONCEITOS OFICIAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confirmar entendimento:

### Planos Oficiais

Starter

Pro

Premium

Scale

Esses nomes devem ser utilizados:

- banco
- frontend
- backend
- billing
- documentação
- snapshots
- prompts

Não utilizar:

- Start
- Performance

━━━━━━━━━━━━━━━━━━

### WhatsApp da Loja

Função:

- contato público da loja
- botão falar no WhatsApp
- negociação direta
- não utiliza Evolution

━━━━━━━━━━━━━━━━━━

### Central de Atendimento

Função:

- Evolution API
- QR Code
- atendimento integrado
- automações
- campanhas
- IA Recovery

Dependência:

add-on whatsapp_automation

━━━━━━━━━━━━━━━━━━

### Super Admin

- não representa loja
- não opera tenant comercial
- não utiliza tenant operacional
- acessa /admin

━━━━━━━━━━━━━━━━━━

### Tenant Operacional

Tenant principal:

santos-car

Devecar:

- não é tenant operacional
- não deve ser usado como referência operacional
- utilizar apenas como histórico quando necessário

━━━━━━━━━━━━━━━━━━

### Add-ons Oficiais

user_extra

- +1 usuário
- R$20/mês

whatsapp_automation

- Central de Atendimento
- QR Code
- Evolution
- automações

ia_recovery

- recuperação automática
- follow-up IA
- lembretes IA

━━━━━━━━━━━━━━━━━━

### Feature Flags

Permissões devem utilizar:

feature flags

Nunca utilizar:

plan_name

para controle de acesso.

Exemplo incorreto:

if (plan === 'Pro')

Exemplo correto:

if (hasFeature('crm'))

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 4 — ANÁLISE ANTES DE CODIFICAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antes de qualquer alteração apresentar:

1. causa raiz

2. arquivos afetados

3. tabelas afetadas

4. APIs afetadas

5. fluxos afetados

6. riscos

7. regressões possíveis

8. testes necessários

9. documentação impactada

10. feature flags afetadas

11. billing afetado

12. multi-tenant afetado

Não iniciar implementação sem esta análise.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 5 — VALIDAÇÃO MULTI-TENANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confirmar:

✓ SELECT respeita tenant_id

✓ UPDATE respeita tenant_id

✓ DELETE respeita tenant_id

✓ UPSERT respeita tenant_id

✓ RLS continua correta

✓ JWT continua correto

Se houver risco:

PARAR.

Apresentar impacto.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AÇÃO MANUAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Se existir qualquer ação manual:

PARAR.

Entregar:

1. caminho exato

2. tela

3. botão

4. campo

5. valor

6. ordem correta

7. resultado esperado

Não assumir execução.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENCERRAMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ao finalizar:

executar integralmente:

prompts/01_PROMPT_ENCERRAMENTO_SESSAO.md
