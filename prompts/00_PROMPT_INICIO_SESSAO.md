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

2. docs-operacao/REFERENCE.md

3. docs-operacao/MEMORY.md

4. docs-operacao/PRODUCT_ARCHITECTURE.md

5. docs-operacao/DEPENDENCIES.md

6. docs-operacao/ENVIRONMENTS.md

7. docs-operacao/20_PENDENCIAS.md

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

* Frontend — Next.js 16 (Vercel)
* Backend — Go (VPS Docker)
* Database — Supabase PostgreSQL
* Billing — Asaas
* WhatsApp — Evolution API v2.3.7
* WhatsApp da Loja — contato público na vitrine (não Evolution)
* Central de Atendimento — add-on whatsapp_automation (Evolution)
* IA — OpenRouter

### Ambiente Ativo

* produção
* homologação
* desenvolvimento

### Últimas Alterações

Baseado em:

22_HISTORICO_ALTERACOES.md

### Pendências Abertas

Baseado em:

20_PENDENCIAS.md

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

### WhatsApp da Loja

Origem:

Número público do tenant (configurado em Configurações → Contato Público)

Função:

* botão "Falar no WhatsApp" na vitrine pública
* contato público da revenda
* não usa Evolution API

### Central de Atendimento

Origem:

Evolution API v2.3.7

Função:

* atendimento via WhatsApp integrado ao CRM
* automações e campanhas (futuro)
* IA Recovery

Disponível apenas via add-on whatsapp_automation.

### Planos (nomes exatos no banco)

starter

pro

performance  ← plano 3 (label sidebar: "Premium")

scale  ← oculto do grid público

### Add-ons

* user_extra — R$20/mês — +1 usuário
* whatsapp_automation — R$39/mês — has_central_atendimento
* ia_recovery — R$39/mês — has_lead_recovery

### Billing

Asaas (BR) — sandbox em dev, production em prod

### Sidebar Gates

Base (Starter+): Dashboard, Veículos, Interessados, Clientes, Financeiro

Pro (has_crm): Atendimento, Analytics

Premium (has_api_access): Automações, Campanhas

### Multi-Tenant

Todas as operações devem respeitar:

tenant_id

RLS obrigatório em todas as tabelas de negócio.

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

✓ RLS policies continuam corretas

✓ JWT claim tenant_id propagado corretamente

Se houver risco:

PARAR.

Apresentar impacto.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 6 — VALIDAÇÃO DE DOCUMENTAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confirmar impacto em:

* docs-operacao/PRODUCT_ARCHITECTURE.md
* docs-operacao/DEPENDENCIES.md
* docs-operacao/17_FLUXOS_NEGOCIO.md
* docs-operacao/features/FEATURE_FLAGS_SNAPSHOT.md
* docs-operacao/features/SIDEBAR_SNAPSHOT.md

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

Se existir qualquer ação manual (Supabase Dashboard, VPS SSH, Asaas painel):

PARAR.

Entregar:

1. caminho exato

2. tela / seção

3. botão ou campo

4. ordem dos passos

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
