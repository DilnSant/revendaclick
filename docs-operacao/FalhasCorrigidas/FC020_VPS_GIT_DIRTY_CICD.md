# FC020 — VPS git dirty working tree bloqueando CI/CD deploy

## Data

2026-05-27

## Severidade

MÉDIA

## Sintoma

Deploy via CI/CD (GitHub Actions → self-hosted runner no VPS) falhava em 5-6 segundos com erro:

```
error: Your local changes to the following files would be overwritten by merge:
  docker-compose.production.yml
Please commit your changes or stash them before you merge.
Aborting
```

O runner travava no passo `git pull origin main` e o deploy não avançava.

## Contexto

Durante debugging da Evolution API (sessão 11), o `docker-compose.production.yml` foi modificado localmente no VPS (alterado `LOG_LEVEL: "LOG"` de `"ERROR"` para diagnóstico). Essa mudança não foi commitada. O CI/CD usa `git pull` para atualizar o código — o git recusou porque havia alterações locais não commitadas.

## Causa Raiz

O CI/CD script executa `git pull origin main` no VPS para atualizar o código. Se qualquer arquivo rastreado pelo git tiver alterações locais, o `git pull` aborta com o erro acima. Modificações de debug direto no VPS (sem commit) deixam o working tree "sujo".

## Arquivos Afetados

- `/opt/revendaclick/docker-compose.production.yml` — alteração local de debug não commitada

## Banco/Migrations

Nenhuma.

## Correção Aplicada

```bash
# No VPS — descartar alterações locais e fazer pull
git checkout docker-compose.production.yml
git pull origin main

# Confirmar que está limpo
git status
# deve mostrar: nothing to commit, working tree clean
```

**Atenção:** `git checkout <arquivo>` descarta as alterações não commitadas. No caso, a alteração de `LOG_LEVEL` era apenas para debug — o valor correto (`"ERROR"`) estava no repositório.

## Commit(s)

Nenhum commit — fix operacional direto no VPS.

## Como Validar

```bash
# 1. Verificar que o working tree está limpo
cd /opt/revendaclick && git status
# deve mostrar: nothing to commit, working tree clean

# 2. Fazer um push para main e verificar o CI/CD
# GitHub Actions → deve completar o workflow sem erro no passo de git pull

# 3. Verificar o último deploy bem-sucedido
docker compose -f docker-compose.production.yml ps
# todos os containers devem estar Up
```

## Resultado Final

VPS com working tree limpo. CI/CD deployando normalmente após o fix.

## Risco de Regressão

**MÉDIO.** Esse problema ocorre toda vez que alguém modifica arquivos no VPS diretamente sem commitar. É operacional, não de código.

## Prevenção Futura

1. **Regra operacional:** Nunca modificar arquivos rastreados pelo git diretamente no VPS para debugging. Se precisar mudar `LOG_LEVEL` temporariamente, usar variável de ambiente no `.env` (não rastreada).
2. Após qualquer modificação de debug no VPS, verificar `git status` antes de considerar o trabalho concluído.
3. Se precisar manter uma alteração local no VPS que não deve ir para o repositório, usar `.gitignore` ou `git update-index --assume-unchanged <arquivo>`.
4. Monitorar o CI/CD — se o runner travar em 5-6s no passo de git pull, o diagnóstico é sempre `git status` no VPS.
