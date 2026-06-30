# 02 — PROMPT DE AUDITORIA

Use este prompt para auditoria estrutural, documental ou técnica.

---

## Prompt

Executar auditoria do projeto.

Primeiro leia:

1. `CLAUDE.md`
2. `docs-operacao/00_LEIA_PRIMEIRO.md`
3. `.claude/01_CONTEXTO.md`
4. `.claude/02_AUTORIZACOES.md`
5. `.claude/04_VALIDACAO.md`

Depois leia somente os documentos necessários para a auditoria.

Prioridade da auditoria:

1. Divergência entre código e documentação.
2. Risco multi-tenant.
3. RLS.
4. Autenticação e autorização.
5. Billing.
6. Feature flags.
7. Deploy e ambiente.
8. Nomenclaturas obsoletas.
9. Arquivos duplicados ou contraditórios.
10. Próximo passo operacional.

Regras:

- Não alterar arquivos sem autorização.
- Não fazer refatoração.
- Não fazer deploy.
- Não criar migration.
- Não ler pastas inteiras sem necessidade.

Relatório final:

1. Itens conformes.
2. Divergências encontradas.
3. Riscos críticos.
4. Riscos médios.
5. Documentos que precisam ajuste.
6. Código que precisa ajuste.
7. Próxima ação recomendada.
