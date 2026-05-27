# FC015 — Evolution OOM / Baileys sem heap limit (512m → 768m + NODE_OPTIONS)

## Data

2026-05-25

## Severidade

ALTA

## Sintoma

Container Evolution API reiniciava periodicamente sem mensagem de erro explícita. `docker stats` mostrava `rc_evolution` atingindo o limite de memória e sendo OOM-killed pelo kernel. Após o restart, todas as instâncias WhatsApp precisavam ser reconectadas.

## Contexto

Evolution API v2 usa Node.js com a biblioteca Baileys para conexão com o WhatsApp. O Baileys mantém o estado da sessão e a fila de mensagens em memória. Com múltiplos tenants conectados, o uso de memória cresce linearmente.

## Causa Raiz

**Causa 1 — Limite de memória insuficiente (512m):**
O container estava configurado com `memory: 512m`. O Baileys, com múltiplas instâncias ativas e sincronização de histórico de mensagens, ultrapassava esse limite.

**Causa 2 — Sem heap limit no Node.js:**
O Node.js, por padrão, usa o limite automático do V8 para heap (~1.5GB em 64-bit). Sem `--max-old-space-size`, o processo Node tentava alocar mais memória do que o container permitia, levando ao OOM kill pelo Docker.

**Causa 3 — Redis habilitado mas sem dados de sessão:**
`CACHE_REDIS_ENABLED=true` fazia o Baileys buscar sessões no Redis. Como o Redis estava vazio, o Baileys reinicializava do zero a cada restart, consumindo mais memória durante o processo de sincronização.

## Arquivos Afetados

- `docker-compose.production.yml` — memória do container Evolution, NODE_OPTIONS, Redis config

## Banco/Migrations

Nenhuma.

## Correção Aplicada

```yaml
# docker-compose.production.yml

evolution:
  image: evoapicloud/evolution-api:v2.3.7
  deploy:
    resources:
      limits:
        memory: 768m    # era 512m — aumentado para acomodar múltiplas instâncias
  environment:
    NODE_OPTIONS: "--max-old-space-size=400"  # adicionado — limita heap Node.js
    CACHE_REDIS_ENABLED: "false"              # Redis desabilitado para Evolution
    CACHE_REDIS_SAVE_INSTANCES: "false"
```

**Lógica:** `memory: 768m` = limite do container. `--max-old-space-size=400` = limite do heap Node.js em 400MB, deixando ~368MB para o sistema e outros processos do container. O Node vai fazer GC antes de tentar alocar além de 400MB, em vez de causar OOM kill.

## Commit(s)

- `d17025e63110cd16dfbdbb3462f0cf14dfce54ae` — fix: Evolution OOM — NODE_OPTIONS heap limit + increase memory to 768m

## Como Validar

```bash
# 1. Verificar uso de memória do container
docker stats --no-stream rc_evolution
# MEMUSAGE deve estar abaixo de 768m estável

# 2. Verificar NODE_OPTIONS aplicado
docker compose -f docker-compose.production.yml exec evolution \
  sh -c 'echo $NODE_OPTIONS'
# deve retornar: --max-old-space-size=400

# 3. Monitorar por 24h sem restart
docker compose -f docker-compose.production.yml ps evolution
# STATUS deve ser "Up X hours" continuamente
```

## Resultado Final

Container Evolution estável, sem OOM kills. Memória se mantém abaixo de 600MB com múltiplas instâncias ativas.

## Risco de Regressão

**MÉDIO.**

1. **Se o número de tenants crescer significativamente:** 768m pode não ser suficiente. Monitorar `docker stats` e aumentar para `1024m` se necessário.
2. **Se `CACHE_REDIS_ENABLED` for reabilitado:** Testar cuidadosamente — sessions vazias no Redis causam reinicialização extra do Baileys.
3. **Nunca executar `docker compose down -v`** — destrói o volume `evolution_instances` com todas as sessões.

## Prevenção Futura

1. Monitorar `docker stats` periodicamente — um container que cresce indefinidamente indica memory leak.
2. Sempre configurar `NODE_OPTIONS: "--max-old-space-size=X"` onde `X` é menor que o `memory` limit do container.
3. Escala recomendada: 1 instância Evolution por ~10-15 tenants WhatsApp ativos simultaneamente.
4. Se `memory > 768m` nos stats: aumentar para `1024m` no docker-compose + reiniciar.
