# FC022 — Lead source inválido retornava internal_error opaco

## Data

2026-05-26

## Severidade

BAIXA

## Sintoma

`POST /api/leads` com `source: "manual"` retornava:
```json
{"error": {"code": "internal_error", "message": "internal server error"}}
```

Sem indicação de qual campo estava errado. O frontend não conseguia saber o motivo da falha.

## Contexto

Endpoint de criação de lead. O campo `source` é um enum PostgreSQL (`lead_source`) com valores fixos. Se enviado um valor fora do enum, o pgx retornava erro de banco, que o handler convertia para `internal_error` genérico.

## Causa Raiz

O modelo de lead não validava o campo `source` antes de enviar para o banco. O enum `lead_source` aceita apenas:

```sql
CREATE TYPE lead_source AS ENUM (
  'marketplace', 'whatsapp', 'referral', 'direct', 'social', 'other'
);
```

O valor `"manual"` não estava no enum. O pgx retornava `ERROR: invalid input value for enum lead_source: "manual"`, que o handler capturava como erro genérico e retornava `internal_error` ao cliente — sem nenhuma informação útil.

## Arquivos Afetados

- `backend/internal/leads/model.go` — `CreateRequest.Validate()`

## Banco/Migrations

Nenhuma migration. O enum já estava correto no banco.

## Correção Aplicada

```go
// backend/internal/leads/model.go

var validLeadSources = map[string]bool{
    "marketplace": true,
    "whatsapp":    true,
    "referral":    true,
    "direct":      true,
    "social":      true,
    "other":       true,
}

func (r *CreateRequest) Validate() error {
    if r.Source != "" && !validLeadSources[r.Source] {
        return fmt.Errorf("source inválido: %q. Valores aceitos: marketplace, whatsapp, referral, direct, social, other", r.Source)
    }
    return nil
}
```

**Retorno ao cliente após o fix:**
```json
{
  "error": {
    "code": "bad_request",
    "message": "source inválido: \"manual\". Valores aceitos: marketplace, whatsapp, referral, direct, social, other"
  }
}
```

## Commit(s)

- `43c65ee21b117b71aa5e3b64285f330b95002eca` — fix: lead source validation + nil slice → [] in API responses

## Como Validar

```bash
TOKEN=$(...)

# 1. Source inválido — deve retornar 400 com mensagem clara
curl -s -X POST https://api.revendaclick.com.br/api/leads \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","phone":"11999999999","source":"manual"}'
# deve retornar 400 com mensagem sobre source inválido

# 2. Source válido — deve criar lead normalmente
curl -s -X POST https://api.revendaclick.com.br/api/leads \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","phone":"11999999999","source":"direct"}'
# deve retornar 201 com o lead criado
```

## Resultado Final

`source` inválido retorna 400 com mensagem explicativa. `internal_error` reservado para erros genuinamente inesperados.

## Risco de Regressão

**BAIXO.** Validação simples de enum. Risco: se o enum `lead_source` for expandido no banco, atualizar `validLeadSources` no código — caso contrário, novos valores válidos seriam rejeitados.

## Prevenção Futura

1. Ao adicionar novos valores ao enum `lead_source`, atualizar `validLeadSources` em `model.go`.
2. Nunca deixar erros de banco chegarem ao cliente como `internal_error` — sempre validar inputs antes de enviar ao banco.
3. Criar validação similar para outros campos enum: `lead_status`, `sale_status`, etc.
