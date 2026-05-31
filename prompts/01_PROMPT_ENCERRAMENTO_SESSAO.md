# PROMPT OFICIAL DE ENCERRAMENTO DE SESSÃO — REVENDACLICK

Copiar e colar integralmente ao final de toda sessão.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJETIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Encerrar somente quando:

✓ código atualizado

✓ documentação atualizada

✓ testes executados

✓ deploy validado

✓ histórico atualizado

✓ próximos passos registrados

✓ snapshots atualizados

✓ decisões registradas

✓ sem divergência entre código e documentação

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 1 — DOCUMENTAÇÃO OBRIGATÓRIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Atualizar:

docs-operacao/MEMORY.md

docs-operacao/20_PENDENCIAS.md

docs-operacao/21_DECISOES_TECNICAS.md

docs-operacao/22_HISTORICO_ALTERACOES.md

docs-operacao/23_PROXIMO_PASSO.md

docs-operacao/FalhasCorrigidas/

Atualizar snapshots impactados:

docs-operacao/features/

Especialmente:

- FEATURE_FLAGS_SNAPSHOT.md
- SIDEBAR_SNAPSHOT.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 2 — AUDITORIA DOCUMENTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Validar impacto em:

docs-operacao/REFERENCE.md

docs-operacao/PRODUCT_ARCHITECTURE.md

docs-operacao/DEPENDENCIES.md

docs-operacao/ENVIRONMENTS.md

docs-operacao/17_FLUXOS_NEGOCIO.md

Atualizar quando necessário.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 3 — REGISTRAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Registrar:

### Alterações realizadas

### Arquivos alterados

### Commits realizados

### Push realizado

### Deploy realizado

### Migrations executadas

### Testes executados

### Bugs corrigidos

### Pendências abertas

### Próximos passos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 4 — AUDITORIA DE NOMENCLATURA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Verificar referências obsoletas:

Start

Performance

Compradores

Devecar operacional

Coolify

middleware.ts

Se encontrados:

corrigir

ou

registrar em:

MEMORY.md → OBSOLETO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 4.1 — CAUSA RAIZ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para cada correção realizada informar:

### Causa Raiz

- origem exata
- arquivo responsável
- função responsável
- tabela responsável

### Correção

- o que foi alterado

### Prevenção

- como evitar recorrência

Não aceitar explicações sem evidência.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 5 — AUDITORIA MULTI-TENANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confirmar:

✓ tenant_id

✓ RLS

✓ JWT

✓ feature flags

✓ isolamento entre tenants

Se houver risco:

PARAR.

Documentar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 6 — TESTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Executar:

Frontend

npx tsc --noEmit

Backend

go build ./...

go vet ./...

go test ./...

Registrar resultado.

Informar:

- total executado
- aprovados
- falhas
- novos testes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 6.1 — DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confirmar:

Frontend

- EXECUTADO
ou
- NÃO EXECUTADO

Backend

- EXECUTADO
ou
- NÃO EXECUTADO

Banco

- EXECUTADO
ou
- NÃO EXECUTADO

Informar:

- commit
- hash
- ambiente

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 7 — RELATÓRIO FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Apresentar:

RESOLVIDO ✓

PARCIAL ⚠

PENDENTE ✗

Informar:

1. O que foi feito

2. O que ficou pendente

3. Riscos existentes

4. Próxima ação recomendada

5. Documentos atualizados

6. Commits realizados

7. Deploy realizado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRA FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Não encerrar a sessão enquanto existir divergência entre:

CÓDIGO

e

DOCUMENTAÇÃO.

A documentação operacional deve permanecer sincronizada com o estado real do sistema.
