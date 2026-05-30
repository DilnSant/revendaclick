# PROMPT OFICIAL DE INÍCIO DE SESSÃO — BEAUTYNOW

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

1. docs-operacao/00_REFERENCIA_RAPIDA.md

2. docs-operacao/00_MAPA_FEATURES.md

3. docs-operacao/01_ARQUITETURA_SISTEMA.md

4. docs-operacao/02_FLUXOS_NEGOCIO.md

5. docs-operacao/03_MODELO_DADOS.md

6. docs-operacao/04_DEPLOY_OPERACIONAL.md

7. docs-operacao/20_PENDENCIAS_ABERTAS.md

8. docs-operacao/21_DECISOES_TECNICAS.md

9. docs-operacao/22_HISTORICO_ALTERACOES.md

Ler apenas:

Estado Atual por Feature

10. docs-operacao/23_PROXIMO_PASSO.md

11. Todos os snapshots relevantes em:

docs-operacao/features/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 2 — DIAGNÓSTICO OBRIGATÓRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Após a leitura apresentar:

### Estado Atual

* o que está funcionando
* o que está em desenvolvimento
* o que está bloqueado

### Arquitetura Ativa

* Frontend
* Backend
* Supabase
* ASAAS
* Evolution
* WhatsApp Comercial
* WhatsApp Automação

### Ambiente Ativo

* produção
* homologação
* desenvolvimento

### Últimas Alterações

Baseado em:

22_HISTORICO_ALTERACOES.md

### Pendências Abertas

Baseado em:

20_PENDENCIAS_ABERTAS.md

### Próximo Passo Recomendado

Baseado em:

23_PROXIMO_PASSO.md

### Riscos Conhecidos

Identificar:

* bugs críticos
* riscos operacionais
* riscos multi-tenant
* riscos de deploy

### Divergências Encontradas

Listar qualquer conflito encontrado entre documentos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 3 — VALIDAR ARQUITETURA OFICIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confirmar entendimento dos conceitos:

### WhatsApp Comercial

Origem:

Marca

Função:

* atendimento humano
* comprovantes
* contato público
* botão falar com salão

### WhatsApp Automação

Origem:

Evolution

Função:

* automações
* lembretes
* campanhas
* IA Recovery

Disponível apenas via add-on.

### Planos

Starter

Pro

Premium

### Add-ons

* WhatsApp Automação
* NoShow
* IA Recovery
* Profissional Extra
* Agendamentos Extras

### Billing

ASAAS

### Multi-Tenant

Todas as operações devem respeitar:

tenant_id

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 4 — ANÁLISE ANTES DE CODIFICAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antes de alterar qualquer arquivo:

identificar:

1. causa raiz

2. arquivos afetados

3. tabelas afetadas

4. APIs afetadas

5. fluxos afetados

6. riscos

7. regressões possíveis

8. testes necessários

9. documentação impactada

Não iniciar implementação sem esta análise.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 5 — VALIDAÇÃO MULTI-TENANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confirmar:

✓ SELECT respeita tenant_id

✓ UPDATE respeita tenant_id

✓ DELETE respeita tenant_id

✓ UPSERT respeita tenant_id

✓ policies continuam corretas

Se houver risco:

PARAR.

Apresentar impacto.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 6 — VALIDAÇÃO DE DOCUMENTAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confirmar impacto em:

* 00_MAPA_FEATURES.md
* 01_ARQUITETURA_SISTEMA.md
* 02_FLUXOS_NEGOCIO.md
* 03_MODELO_DADOS.md
* 04_DEPLOY_OPERACIONAL.md

Se houver impacto:

planejar atualização.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 7 — PLANO DE EXECUÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antes de alterar código apresentar:

### O que será feito

### Por que será feito

### Arquivos envolvidos

### Impacto esperado

### Testes planejados

### Documentação que será atualizada

Somente depois iniciar alterações.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AÇÃO MANUAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Se existir qualquer ação manual:

PARAR.

Entregar:

1. caminho

2. tela

3. botão

4. ordem

5. resultado esperado

Não assumir que a ação foi executada.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENCERRAMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ao finalizar a sessão:

executar obrigatoriamente:

prompts/01_PROMPT_ENCERRAMENTO_SESSAO.md

Não encerrar sem:

✓ testes

✓ documentação

✓ deploy validado (quando aplicável)

✓ sincronização entre código e documentação

