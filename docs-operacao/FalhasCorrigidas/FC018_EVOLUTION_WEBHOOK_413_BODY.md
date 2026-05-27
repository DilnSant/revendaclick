# FC018 — Evolution webhook 413 — body limit 512KB insuficiente para history sync

## Data

2026-05-27

## Severidade

MÉDIA

## Sintoma

Após conectar o WhatsApp, alguns eventos de webhook da Evolution retornavam `HTTP 413 Request Entity Too Large`. Os logs do nginx mostravam o erro. Mensagens de histórico antigo não eram processadas e podiam se perder.

## Contexto

Evolution v2.3.7 com Baileys: ao conectar uma instância WhatsApp nova ou após longo tempo desconectado, o WhatsApp sincroniza o histórico de mensagens. Esses payloads de sincronização podem ter vários MB (fotos, vídeos em base64, histórico longo).

## Causa Raiz

O handler do webhook estava configurado com limite de 512KB:

```go
// ANTES:
c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 512*1024)
// 512KB — insuficiente para payloads de history-sync do Baileys v2.3.7
```

Evolution v2.3.7 com Baileys envia payloads de `messages.upsert` com base64 de imagens/documentos incluídos, facilmente ultrapassando 512KB durante sincronização de histórico.

## Arquivos Afetados

- `backend/internal/evolution/handler.go` — `Webhook` handler, `MaxBytesReader`

## Banco/Migrations

Nenhuma.

## Correção Aplicada

```go
// DEPOIS:
// Body size guard — Evolution v2.3.7 envia history-sync payloads até ~2MB.
c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 4*1024*1024)
// 4MB — suficiente para payloads normais de history sync
```

**Raciocínio:** 4MB é conservador o suficiente para proteger contra ataques de flooding enquanto acomoda payloads legítimos do Baileys (tipicamente 1-2MB em pico de sincronização).

## Commit(s)

- `9298ca96c0c6f313cb8c0295e87e9156ef259929` — fix: Evolution v2.3.7 sendText flat format + webhook 4MB body limit

## Como Validar

```bash
# 1. Conectar uma instância WhatsApp e verificar que os webhooks passam
docker compose -f docker-compose.production.yml logs backend | grep "evolution webhook"
# não deve ter erro 413 durante sincronização inicial

# 2. Verificar o limite atual no código
grep "MaxBytesReader" backend/internal/evolution/handler.go
# deve mostrar: 4*1024*1024
```

## Resultado Final

Webhooks de até 4MB aceitos. Sincronização de histórico do Baileys processa sem erros 413.

## Risco de Regressão

**BAIXO.** 4MB é suficiente para uso normal. Risco: se o Baileys enviar payloads maiores que 4MB em versões futuras (improvável para texto — apenas possível para múltiplas mídias em batch).

## Prevenção Futura

1. Se aparecerem erros 413 novamente nos logs, aumentar para 8MB e investigar o tipo de payload.
2. Considerar filtrar eventos de `messages.upsert` com mídia (fotos, vídeos) para não processar base64 grande desnecessariamente — o backend só precisa do texto e metadados.
