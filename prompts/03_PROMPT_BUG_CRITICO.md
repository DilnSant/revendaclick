# 03 — PROMPT DE BUG CRÍTICO

Use este prompt para bug crítico, regressão, produção quebrada, billing errado, erro de tenant ou risco de dados.

---

## Prompt

Bug crítico identificado.

Pare qualquer implementação normal.

Antes de corrigir:

1. Leia `CLAUDE.md`.
2. Leia `docs-operacao/00_LEIA_PRIMEIRO.md`.
3. Leia `.claude/02_AUTORIZACOES.md`.
4. Leia `.claude/03_FLUXO_TRABALHO.md`.
5. Leia `.claude/04_VALIDACAO.md`.
6. Leia `docs-operacao/FalhasCorrigidas/README.md`.

Depois:

1. Descreva o sintoma.
2. Identifique arquivos afetados.
3. Identifique fluxo afetado.
4. Identifique se afeta produção.
5. Identifique se afeta multi-tenant.
6. Identifique se afeta billing.
7. Identifique se afeta banco ou RLS.
8. Procure falha parecida em `docs-operacao/FalhasCorrigidas/`.

Antes de implementar, apresente:

1. Causa provável.
2. Evidências.
3. Plano de correção.
4. Arquivos que serão alterados.
5. Riscos.
6. Validação necessária.
7. Se precisa rollback.
8. Se precisa autorização.

Não corrigir por tentativa e erro.

Não alterar arquivos sem aprovação quando houver risco.
