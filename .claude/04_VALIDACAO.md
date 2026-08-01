# 04 — VALIDAÇÃO

Este arquivo define os comandos mínimos de validação.

Regra principal: nunca dizer que algo foi validado se o comando não foi executado.

---

## Frontend

Quando alterar frontend, executar:

cd frontend && npx tsc --noEmit

Se existir lint configurado:

cd frontend && npm run lint

---

## Backend

Quando alterar backend, executar:

cd backend && go build ./...

cd backend && go vet ./...

cd backend && go test ./...

---

## Banco de dados

Quando alterar banco:

1. Confirmar número da migration.
2. Confirmar se RLS foi afetado.
3. Confirmar se tenant_id foi preservado.
4. Confirmar se precisa regenerar types.

Regenerar types quando necessário:

cd frontend

npx supabase gen types typescript --project-id ibgaywezfcbbiiziaoac > lib/database.types.ts

---

## Deploy

Quando houver deploy, seguir:

- `prompts/04_PROMPT_DEPLOY.md`
- `docs-operacao/ENVIRONMENTS.md`
- `docs-operacao/REFERENCE.md`

Validar backend:

curl https://api.revendaclick.com.br/health

Validar containers na VPS:

ssh root@2.24.67.84

docker compose -f /opt/revendaclick/docker-compose.production.yml ps

---

## Resultado final

Ao final, informar:

- comando executado
- resultado obtido
- se passou ou falhou
- o que falta validar
