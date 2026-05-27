# FC011 — Nginx webhook location incorreta — rate limiting ignorado

## Data

2026-05-26

## Severidade

MÉDIA

## Sintoma

Webhooks da Asaas e da Evolution API não estavam sendo limitados pela zona de rate limiting dedicada `webhook_limit`. Em vez disso, usavam o limite geral da API (`api_limit` = 30 req/s), que era mais permissivo. O problema era silencioso — tudo funcionava, mas sem a proteção correta.

## Contexto

Nginx configurado com 3 zonas de rate limiting:
- `api_limit`: 30 req/s para rotas gerais
- `webhook_limit`: 5 req/s, burst=10 para webhooks
- `evo_limit`: para Evolution API

Webhooks reais do projeto:
- `POST /api/webhooks/evolution`
- `POST /api/webhooks/asaas`

## Causa Raiz

O bloco `location` no nginx.conf usava um prefixo incorreto:

```nginx
# ERRADO — nunca casava com as rotas reais
location ~ ^/api/v1/webhooks/ {
    limit_req zone=webhook_limit burst=10 nodelay;
    ...
}

# Rotas reais são:
# /api/webhooks/evolution  (sem "v1")
# /api/webhooks/asaas      (sem "v1")
```

O regex `^/api/v1/webhooks/` nunca casava com as rotas `/api/webhooks/*`. O nginx aplicava o bloco `location ~ ^/api/` (o geral) com `api_limit`, ignorando o `webhook_limit` restrito.

## Arquivos Afetados

- `nginx.conf` — bloco `location` de webhooks

## Banco/Migrations

Nenhuma.

## Correção Aplicada

```nginx
# ANTES:
location ~ ^/api/v1/webhooks/ {
    limit_req zone=webhook_limit burst=10 nodelay;
    proxy_pass http://backend;
}

# DEPOIS:
location ~ ^/api/webhooks/ {
    # Rotas: /api/webhooks/evolution, /api/webhooks/asaas
    limit_req zone=webhook_limit burst=10 nodelay;
    proxy_pass http://backend;
}
```

## Commit(s)

- `39b5a3825cc230568d40729f168a6e29fd0dbb52` — fix: nginx webhook location /api/v1/webhooks/ → /api/webhooks/

## Como Validar

```bash
# 1. Verificar que header X-RateLimit aparece nas requests de webhook
curl -s -X POST https://api.revendaclick.com.br/api/webhooks/asaas \
  -v 2>&1 | grep -i "x-ratelimit\|limit_req"

# 2. Verificar nginx config
nginx -t  # deve passar sem erros
grep -A5 "webhooks" /etc/nginx/nginx.conf  # deve mostrar a location correta

# 3. Teste de rate limit (enviar 15+ requests rápidos)
for i in $(seq 1 15); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST https://api.revendaclick.com.br/api/webhooks/asaas
done
# após burst=10, deve retornar 429 (Too Many Requests)
```

## Resultado Final

Webhooks limitados a 5 req/s com burst de 10. Proteção contra flood de webhooks maliciosos ou mal-configurados.

## Risco de Regressão

**BAIXO.** Localização simples do nginx. Risco: ao adicionar novas rotas de webhook, verificar que o prefixo `/api/webhooks/` está correto.

## Prevenção Futura

1. Ao adicionar nova rota de webhook, verificar que o nginx.conf tem o `location` correspondente com `webhook_limit`.
2. Testar rate limiting com `for` loop antes de cada deploy que toque nginx.
3. Manter comentário no nginx.conf listando as rotas cobertas por cada `location ~ ^/api/webhooks/`.
