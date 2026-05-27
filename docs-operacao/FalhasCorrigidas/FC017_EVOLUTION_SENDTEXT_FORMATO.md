# FC017 — Evolution sendText formato incompatível com v2.3.7

## Data

2026-05-27

## Severidade

ALTA

## Sintoma

`POST /api/evolution/send` retornava `HTTP 400` com mensagem da Evolution:
```json
{"error": "instance requires property text"}
```

Mesmo com a instância WhatsApp conectada (status `open`), mensagens não eram enviadas. O frontend mostrava "Falha ao enviar mensagem. Verifique se o WhatsApp está conectado."

## Contexto

Feature de envio de mensagem manual pelo operador: painel `/whatsapp` → campo "Enviar mensagem" → `POST /api/evolution/send`.

## Causa Raiz

Evolution API v2.3.7 mudou o formato do body de `sendText`. O código usava o formato antigo (v2.2.3) com estrutura aninhada:

```json
// v2.2.3 (FORMATO ANTIGO — não funciona em v2.3.7):
{
  "options": {
    "delay": 1200,
    "presence": "composing"
  },
  "textMessage": {
    "text": "mensagem aqui"
  }
}

// v2.3.7 (FORMATO NOVO — flat):
{
  "number": "5511999999999",
  "text": "mensagem aqui",
  "delay": 1200
}
```

O endpoint `/message/sendText/:instance` da v2.3.7 esperava `text` no nível raiz do JSON. O formato antigo enviava `textMessage.text`, que a v2.3.7 não reconhecia.

## Arquivos Afetados

- `backend/internal/evolution/service.go` — função `SendMessage`

## Banco/Migrations

Nenhuma.

## Correção Aplicada

```go
// ANTES (v2.2.3 — nested format):
body := map[string]any{
    "options": map[string]any{
        "delay":    1200,
        "presence": "composing",
    },
    "textMessage": map[string]any{
        "text": text,
    },
}

// DEPOIS (v2.3.7 — flat format):
body := map[string]any{
    "number": number,
    "text":   text,
    "delay":  1200,
}
```

**Confirmação via curl direto na Evolution:**
```bash
# Formato antigo → 400: "instance requires property text"
curl -X POST http://localhost:8081/message/sendText/santos-car \
  -H "apikey: revendaclick123" \
  -H "Content-Type: application/json" \
  -d '{"textMessage":{"text":"teste"}}'
# → 400

# Formato novo → 200: {"status":"PENDING","key":{...}}
curl -X POST http://localhost:8081/message/sendText/santos-car \
  -H "apikey: revendaclick123" \
  -H "Content-Type: application/json" \
  -d '{"number":"5511999999999","text":"teste","delay":1200}'
# → 200 {"status":"PENDING",...}
```

## Commit(s)

- `9298ca96c0c6f313cb8c0295e87e9156ef259929` — fix: Evolution v2.3.7 sendText flat format + webhook 4MB body limit

## Como Validar

```bash
# 1. Testar envio via API do backend
TOKEN=$(...)
curl -s -X POST https://api.revendaclick.com.br/api/evolution/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone":"5511999999999","message":"Teste de envio"}'
# deve retornar: {"data":{"sent":true}}

# 2. Verificar que a mensagem chegou no WhatsApp do destinatário
```

## Resultado Final

`SendMessage` usa o formato flat do v2.3.7. Envio de mensagens funcionando via painel `/whatsapp`.

## Risco de Regressão

**MÉDIO.** Se a Evolution fizer um downgrade ou mudar o formato novamente em versões futuras, este bug pode reaparecer. Sempre testar sendText ao fazer upgrade da Evolution.

## Prevenção Futura

1. Ao fazer upgrade da Evolution, testar `sendText` diretamente via curl antes de considerar o upgrade completo.
2. Comparar o formato do body com a documentação oficial da versão: https://doc.evolution-api.com/
3. O formato flat (v2.3.7+) é mais simples — preferir essa versão. Nunca voltar para formato nested sem necessidade.
