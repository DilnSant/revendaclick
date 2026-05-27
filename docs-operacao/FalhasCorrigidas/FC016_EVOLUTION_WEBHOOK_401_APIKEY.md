# FC016 — Evolution webhook retornava 401 (empty apikey no v2.3.7)

## Data

2026-05-27

## Severidade

ALTA

## Sintoma

Após upgrade para Evolution v2.3.7, todos os webhooks de mensagens WhatsApp retornavam `HTTP 401 Unauthorized`. O backend logava:
```
evolution webhook: invalid apikey got_key_prefix: ""
```

Nenhuma mensagem WhatsApp era registrada no CRM. O lead sync por WhatsApp estava completamente parado.

## Contexto

O backend valida o `apikey` header dos webhooks da Evolution para evitar que terceiros injetem eventos falsos. Em v2.2.3, a Evolution enviava o header `apikey: <chave>`. Em v2.3.7, o comportamento mudou.

## Causa Raiz

Evolution API v2.3.7 envia webhooks **sem o header `apikey`** para instâncias dentro da mesma rede Docker. A instância Evolution e o backend Go compartilham a rede `rc_network` (bridge Docker) — a Evolution considera esse canal interno e não inclui o header de autenticação.

O handler original validava:
```go
if incomingKey != h.apiKey {
    c.Status(http.StatusUnauthorized)
    return
}
```

Com `incomingKey = ""` (header ausente) e `h.apiKey = "revendaclick123"`, a condição era sempre `true` → todos os webhooks rejeitados.

## Arquivos Afetados

- `backend/internal/evolution/handler.go` — `Webhook` handler

## Banco/Migrations

Nenhuma.

## Correção Aplicada

Bypass da validação de apikey para IPs da rede interna Docker (RFC-1918):

```go
func (h *Handler) Webhook(c *gin.Context) {
    incomingKey := c.GetHeader("apikey")
    ip := c.ClientIP()

    // Evolution API (Docker network) pode não incluir apikey header.
    // Confiar em requests de IPs RFC-1918 dentro da rede do container;
    // validar key apenas para requests externos.
    internalIP := strings.HasPrefix(ip, "10.") ||
                  strings.HasPrefix(ip, "172.") ||
                  strings.HasPrefix(ip, "192.168.")

    if !internalIP && h.apiKey != "" && incomingKey != h.apiKey {
        h.logger.Warn("evolution webhook: invalid apikey",
            zap.String("ip", ip))
        c.Status(http.StatusUnauthorized)
        return
    }
    // ...
}
```

**Lógica de segurança:**
- IP interno (10.x, 172.x, 192.168.x) → confiado automaticamente (rede Docker privada)
- IP externo + apikey correta → aceito
- IP externo + apikey errada ou ausente → 401

## Commit(s)

- `ce103a0725eff546a655008866b6fab2f4ae06d3` — fix: accept Evolution webhook from internal Docker network without apikey
- `0b04730eab0dc1678beef45dec97bbdae9aea118` — debug: log incoming apikey prefix on Evolution webhook 401

## Como Validar

```bash
# 1. Verificar que webhook de mensagens retorna 200
docker compose -f docker-compose.production.yml logs backend --tail=50 | grep "evolution webhook"
# deve mostrar "evolution webhook received" sem erros 401

# 2. Enviar mensagem para o número WhatsApp do tenant e verificar log
# A mensagem deve aparecer como atividade no CRM do lead correspondente

# 3. Verificar o IP de onde a Evolution envia webhooks
docker compose -f docker-compose.production.yml logs backend | grep "ip"
# IP deve ser 10.0.4.x (rede Docker interna)

# 4. Testar do lado de fora (deve exigir apikey)
curl -s -X POST https://api.revendaclick.com.br/api/webhooks/evolution \
  -H "Content-Type: application/json" \
  -d '{"event":"test"}' -w "\n%{http_code}"
# deve retornar 401 (IP externo sem apikey)

# Com apikey correta (do external IP):
curl -s -X POST https://api.revendaclick.com.br/api/webhooks/evolution \
  -H "Content-Type: application/json" \
  -H "apikey: revendaclick123" \
  -d '{"event":"test"}' -w "\n%{http_code}"
# deve retornar 400 (parse error) ou 200, não 401
```

## Resultado Final

Webhooks da Evolution aceitos corretamente. Lead sync por WhatsApp funcionando. HTTP 200 em todos os eventos de mensagem.

## Risco de Regressão

**BAIXO.** A lógica de IP interno é robusta para rede Docker. Risco:

1. **Se a rede Docker mudar para um range não-RFC-1918:** o bypass não funcionaria. Improvável com configuração padrão do Docker.
2. **Se a Evolution passar a enviar de IP externo em versões futuras:** precisaria reavaliar o mecanismo de autenticação.

## Prevenção Futura

1. Ao fazer upgrade da Evolution, verificar se o comportamento de webhook mudou (apikey header presente ou não).
2. Manter o log de debug `got_key_prefix` para facilitar diagnóstico futuro de problemas de autenticação.
3. Nunca expor o endpoint de webhook diretamente sem validação de IP ou token — a proteção dual (IP interno OR apikey) é a abordagem correta.
