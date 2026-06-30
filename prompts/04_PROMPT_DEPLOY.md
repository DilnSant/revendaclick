# 04 — PROMPT DE DEPLOY

Use este prompt antes de qualquer deploy ou validação de produção.

---

## Prompt

Preparar ou validar deploy.

Antes de qualquer ação:

1. Leia `CLAUDE.md`.
2. Leia `docs-operacao/00_LEIA_PRIMEIRO.md`.
3. Leia `.claude/02_AUTORIZACOES.md`.
4. Leia `.claude/04_VALIDACAO.md`.
5. Leia `docs-operacao/ENVIRONMENTS.md`.
6. Leia `docs-operacao/REFERENCE.md`.

Não fazer deploy sem autorização explícita.

Antes do deploy, confirmar:

1. Ambiente alvo.
2. Arquivos alterados.
3. Commits envolvidos.
4. Se há migration.
5. Se há alteração de env.
6. Se há alteração de Docker/Nginx/CI.
7. Plano de rollback.
8. Validações necessárias.

Validações mínimas:

Frontend:

cd frontend && npx tsc --noEmit

Backend:

cd backend && go build ./...
cd backend && go vet ./...
cd backend && go test ./...

Healthcheck produção:

curl https://api.revendaclick.com.br/health

Relatório final:

1. Deploy executado ou não.
2. Ambiente.
3. Commit.
4. Resultado do frontend.
5. Resultado do backend.
6. Resultado do banco.
7. Healthcheck.
8. Riscos restantes.
9. Próximo passo.
