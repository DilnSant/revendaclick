# FC023 — Listas vazias retornavam null em vez de []

## Data

2026-05-26

## Severidade

BAIXA

## Sintoma

Endpoints de listagem (leads, veículos, clientes, etc.) retornavam `"data": null` quando não havia registros, em vez de `"data": []`. O frontend precisava tratar `null` e `[]` como casos distintos, causando `Cannot read properties of null (reading 'length')` em alguns componentes.

## Contexto

Todos os endpoints de listagem do backend Go. Afeta qualquer tenant novo que ainda não tem registros.

## Causa Raiz

Em Go, uma slice declarada mas não inicializada é `nil`:

```go
var list []*Lead  // nil, não []
```

`encoding/json` serializa `nil` slice como `null` em JSON. Combinado com `omitempty` no campo `Data` do envelope de resposta, o campo era omitido completamente quando a lista era vazia.

```go
// ANTES:
type Envelope struct {
    Data interface{} `json:"data,omitempty"`  // omitido se nil/zero
}

// Para lista vazia: var list []*Lead (nil)
// Resultado: {"data": null} ou {"status": "ok"} (sem "data")
```

## Arquivos Afetados

- `backend/internal/response/response.go` — `Envelope`, `normalizeSlice()`

## Banco/Migrations

Nenhuma.

## Correção Aplicada

```go
// 1. Remover omitempty do campo Data
type Envelope struct {
    Status string      `json:"status"`
    Data   interface{} `json:"data"`  // sempre presente, nunca omitido
}

// 2. normalizeSlice — converte nil slice para slice vazia via reflect
func normalizeSlice(v interface{}) interface{} {
    if v == nil {
        return v
    }
    rv := reflect.ValueOf(v)
    if rv.Kind() == reflect.Slice && rv.IsNil() {
        return reflect.MakeSlice(rv.Type(), 0, 0).Interface()
    }
    return v
}

// 3. Usar normalizeSlice antes de retornar
func OK(c *gin.Context, data interface{}) {
    c.JSON(http.StatusOK, Envelope{
        Status: "ok",
        Data:   normalizeSlice(data),
    })
}
```

**Resultado:** Lista vazia → `{"data": []}`. Lista com itens → `{"data": [...]}`. Nunca `null`.

## Commit(s)

- `43c65ee21b117b71aa5e3b64285f330b95002eca` — fix: lead source validation + nil slice → [] in API responses

## Como Validar

```bash
TOKEN=$(...)

# 1. Listar leads de tenant sem leads (deve retornar [])
curl -s https://api.revendaclick.com.br/api/leads \
  -H "Authorization: Bearer $TOKEN"
# deve retornar: {"data": [], "status": "ok"}  — nunca null

# 2. Verificar que listas com itens ainda funcionam
# (criar um lead e listar — deve retornar array com o item)
```

## Resultado Final

Todas as listagens retornam `[]` quando vazias. Frontend pode usar `.length`, `.map()`, etc. sem checar `null`.

## Risco de Regressão

**BAIXO.** `normalizeSlice` é chamada centralmente em `response.OK`. Risco: se alguém criar um novo handler que não use `response.OK`, pode retornar `null` novamente.

## Prevenção Futura

1. Sempre usar `response.OK(c, data)` para respostas de listagem — nunca `c.JSON(200, data)` diretamente.
2. O frontend usa `json.data ?? []` como fallback defensivo — manter esse padrão mesmo após o fix.
3. Ao criar novos endpoints de listagem, verificar se retornam `[]` para tenant sem registros.
