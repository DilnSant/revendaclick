# FC006 — PIX / Asaas — Whitelist de IP no ambiente errado + API key double-dollar

## Data

2026-05-26

## Severidade

CRÍTICA

## Sintoma

`POST /api/billing/subscribe` retornava:
```json
{"error": {"code": "not_allowed_ip", "message": "IP não autorizado na Asaas"}}
```

Após corrigir o whitelist: erro mudou para HTTP 401 (auth failure), assinatura ainda não criava.

Usuários não conseguiam contratar nenhum plano. O PIX (link de pagamento da Asaas) nunca era gerado.

## Contexto

Billing Asaas em produção. O VPS tem IP fixo `2.24.67.84`. A Asaas exige whitelist de IP para o ambiente de produção (`www.asaas.com`).

## Causa Raiz

### Problema 1 — Whitelist aplicado no sandbox, não na produção

O whitelist do IP `2.24.67.84` foi adicionado em `sandbox.asaas.com`, mas o backend usa `www.asaas.com` (produção). A variável `ASAAS_ENV` não estava definida no `.env` do VPS — o docker-compose usava o default `${ASAAS_ENV:-production}`, que aponta para `www.asaas.com`.

Diagnóstico que confirmou a causa:
```bash
# Dentro do container — confirmar IP do VPS
docker compose exec backend wget -qO- ifconfig.me
# Retornou: 2.24.67.84

# Confirmar que ASAAS_ENV não está definido (usa production)
grep ASAAS_ENV /opt/revendaclick/.env
# (vazio)

# Confirmar que www.asaas.com rejeita IP (401 = auth chegou, logo IP estava OK após fix)
curl -v https://www.asaas.com/api/v3/customers?limit=1 -H "access_token: invalida"
```

### Problema 2 — API key com `$` no `.env` (Docker Compose double-interpolation)

`ASAAS_API_KEY=$$aact_prod_...` no `.env` do VPS. O Docker Compose faz dupla interpolação:
1. Lê `$$aact_prod_...` do `.env`
2. Substitui `${ASAAS_API_KEY}` no compose → resultado: `$$aact_prod_...`
3. Docker Compose processa novamente: `$$` → `$` → trata `$aact_prod_...` como variável de ambiente
4. Variável `aact_prod_...` não existe → **container recebe string vazia**

Log diagnóstico:
```
WARN The "aact_prod_000M..." variable is not set. Defaulting to a blank string.
```

Um `sed` anterior havia removido um `$` da key, quebrando o escaping correto.

## Arquivos Afetados

- `/opt/revendaclick/.env` (VPS) — `ASAAS_API_KEY` e `ASAAS_ENV`
- `backend/internal/billing/service.go` — `asaasUserErr()` para mensagem amigável
- Configuração externa: painel Asaas (www.asaas.com) → Integrações → Whitelist de IPs

## Banco/Migrations

Nenhuma migration.

## Correção Aplicada

**Fix 1 — Whitelist no ambiente correto:**
Adicionado IP `2.24.67.84` em `www.asaas.com` (produção), não em `sandbox.asaas.com`.

**Fix 2 — Restaurar `$$` correto na API key:**
```bash
# Verificar estado atual
grep ASAAS_API_KEY /opt/revendaclick/.env

# Restaurar escape correto (se tiver apenas um $):
sed -i 's/^ASAAS_API_KEY=\$/ASAAS_API_KEY=\$\$/' /opt/revendaclick/.env

# Reiniciar backend
docker compose -f docker-compose.production.yml up -d backend

# Confirmar: warning deve sumir dos logs
docker compose -f docker-compose.production.yml logs backend --tail=10
# deve aparecer: "asaas configured, env: production"
```

**Fix 3 — Mensagem amigável para `not_allowed_ip`:**
```go
// billing/service.go
func asaasUserErr(code string) error {
    switch code {
    case "not_allowed_ip":
        return fmt.Errorf("IP do servidor não autorizado na Asaas. Adicionar %s em www.asaas.com → Integrações → Whitelist", serverIP)
    default:
        return fmt.Errorf("erro Asaas: %s", code)
    }
}
```

## Commit(s)

- `8f053a7cac81167e564e443800a97a43d14a3220` — fix: 5 bugs críticos (inclui asaasUserErr)
- `c15a3a6f4e96fd64774020f758b842ad76758b27` — docs: sync sessão 8 (billing desbloqueado)

## Como Validar

```bash
# 1. Confirmar que backend loga "asaas configured, env: production" (não warning de variável)
docker compose -f docker-compose.production.yml logs backend | grep -i "asaas"

# 2. Testar subscribe (precisa de token fresco do usuário)
TOKEN=$(...)  # extrair do browser: Application → Cookies → sb-...
curl -s -X POST https://api.revendaclick.com.br/api/billing/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"starter","cycle":"monthly"}'
# deve retornar 200 com asaas_payment_link
```

## Resultado Final

- Whitelist `2.24.67.84` ativo em `www.asaas.com` (produção)
- `ASAAS_API_KEY=$$aact_prod_...` correto no `.env` do VPS
- Subscribe end-to-end confirmado: santos-car → `cus_000178518508` → `sub_nrprg7wb1iyf0szo` → `PAYMENT_CONFIRMED` → `status=active`

## Risco de Regressão

**ALTO.**

1. **Se o `.env` do VPS for recriado:** A key precisa ter `$$` (dois cifrões). Com um `$` só, a key fica vazia no container. Ver D18 em `21_DECISOES_TECNICAS.md`.
2. **Se o IP do VPS mudar:** Whitelist precisa ser atualizado na Asaas manualmente.
3. **Se o `sed` for executado na key sem cuidado:** Pode remover um `$` → key vazia.

## Prevenção Futura

1. **Regra D18 (obrigatória):** Toda variável com `$` literal no valor deve usar `$$` no `.env` do VPS. Nunca usar `sed` em variáveis que contêm `$` sem verificar o resultado.
2. Ao criar `.env` do zero no VPS, copiar do template e verificar `ASAAS_API_KEY` manualmente.
3. Ao mudar IP do servidor, atualizar whitelist na Asaas imediatamente (antes do deploy).
4. Monitorar logs de inicialização do backend: warning `variable is not set` indica problema com escaping.
