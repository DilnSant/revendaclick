# FC043 — Backup S3 Automatizado

**Data:** 2026-06-13  
**Sessão:** 49  
**Severidade:** MÉDIA (redundância ausente — sem impacto em produção)  
**Área:** Infra / Backup  

---

## Sintoma

Container `rc_backup` gerava backups locais diariamente mas **não enviava para S3** mesmo com `BACKUP_S3_BUCKET` configurado. Dois motivos:

1. O script instalava `aws-cli` via `apk add` a cada execução de backup — lento, exige rede no momento do backup, falha silenciosa possível.
2. `AWS_REGION` não era passada ao container — o docker-compose passava apenas `AWS_DEFAULT_REGION` (nome legado).

Adicionalmente: path S3 sem hierarquia de data dificultava lifecycle e auditoria.

---

## Causa Raiz

| # | Causa |
|---|---|
| 1 | `backup.sh`: `apk add --no-cache aws-cli` rodava dentro de cada chamada de `backup.sh`, não no startup do container |
| 2 | `docker-compose.production.yml`: `AWS_REGION` não estava no bloco `environment` do service `backup` |
| 3 | Path S3: `backups/${FILENAME}` sem prefixo `revendaclick/YYYY/MM/` — sem organização por data |
| 4 | Sem verificação do objeto após upload (S3 poderia retornar 200 e objeto não existir) |
| 5 | Sem política de lifecycle no bucket S3 (retenção S3 indefinida) |

---

## Correção Aplicada

### 1. `backup.sh` — refatorado

- `apk add aws-cli` **removido** do corpo do script (agora instalado no startup do container)
- Path S3 alterado: `backups/NOME` → `revendaclick/YYYY/MM/NOME`
- Verificação após upload: `aws s3 ls $S3_URI` confirma que o objeto existe antes de reportar sucesso
- Suporte a `AWS_REGION` **e** `AWS_DEFAULT_REGION` (fallback encadeado)
- `S3_CONFIGURED` / `S3_OK` — flags booleanas para controle de exit code
- `set -uo pipefail` sem `-e` — erros de S3 não matam o script; falha de pg_dump mata
- Retenção local inalterada: 7 dias

### 2. `docker-compose.production.yml` — service `backup`

- `command` modificado: bloco de startup instala `aws-cli` **uma vez** antes de entrar no loop
- `AWS_REGION` adicionado ao bloco `environment` (aceita valor do `.env` do VPS)
- `AWS_DEFAULT_REGION` mantido como fallback para compatibilidade
- Log de fim de ciclo melhorado: `run completed OK` / `run completed with errors`

### 3. `scripts/restore-from-s3.sh` — criado

Script de validação de restauração. Roda no host VPS usando `docker exec rc_backup` para aws-cli. Sem instalação local necessária.

Funcionalidades:
- Sem argumento: localiza o backup mais recente no S3
- Com argumento: localiza arquivo específico
- Download para volume compartilhado (`/opt/revendaclick/backups/.restore-validate-PID.sql.gz`)
- `gzip -t`: verificação de integridade
- `zcat | head -5 | grep "PostgreSQL"`: verificação de header
- Exibe comando de restore manual ao final
- Cleanup automático via `trap EXIT`

### 4. `scripts/configure-s3-lifecycle.sh` — criado

Configura política de lifecycle no bucket S3 (execução única após criar o bucket):
- Prefixo: `revendaclick/`
- Retenção: **30 dias** (objetos mais antigos deletados automaticamente pelo S3)
- Usa `docker exec rc_backup` para aws-cli
- Verifica a configuração após aplicar

---

## Arquivos Alterados

| Arquivo | Ação |
|---|---|
| `backup.sh` | Modificado |
| `docker-compose.production.yml` | Modificado |
| `scripts/restore-from-s3.sh` | Criado |
| `scripts/configure-s3-lifecycle.sh` | Criado |

---

## Configuração Necessária no VPS

Adicionar ao `/opt/revendaclick/.env`:

```env
BACKUP_S3_BUCKET=nome-do-bucket
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=sa-east-1
```

> O bucket S3 deve ter sido criado previamente com as políticas de acesso corretas (PutObject, GetObject, ListBucket, PutLifecycleConfiguration).

---

## Ativação — Passo a Passo

### 1. Configurar variáveis no VPS

```bash
nano /opt/revendaclick/.env
# Adicionar: BACKUP_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
```

### 2. Fazer push para `main` (CI/CD recria o container automaticamente)

```bash
# O CI/CD faz git pull + docker compose up -d no VPS
# O rc_backup é recriado com o novo command (instala aws-cli no startup)
# Aguardar CI/CD concluir (~3-5 min)
```

### 3. Configurar lifecycle S3 (executar UMA vez)

```bash
chmod +x /opt/revendaclick/scripts/configure-s3-lifecycle.sh
/opt/revendaclick/scripts/configure-s3-lifecycle.sh
```

### 4. Disparar backup manual para validar S3

```bash
docker exec rc_backup bash /scripts/backup.sh
```

Saída esperada (com S3 configurado):
```
[...] backup: starting — backup-2026-07-01T03-00-00Z.sql.gz
[...] backup: dump ok — 2.3M
[...] backup: S3 uploading — s3://bucket/revendaclick/2026/07/backup-...sql.gz
[...] backup: S3 ok — verified (region: sa-east-1)
[...] backup: retention: 0 local file(s) removed (>7d)
[...] backup: done — OK
```

### 5. Validar restauração

```bash
chmod +x /opt/revendaclick/scripts/restore-from-s3.sh
/opt/revendaclick/scripts/restore-from-s3.sh
```

Saída esperada:
```
[...] restore: sem argumento — localizando backup mais recente no S3...
[...] restore: alvo: s3://bucket/revendaclick/2026/07/backup-...sql.gz
[...] restore: download ok — 2.3M
[...] restore: gzip: OK
[...] restore: SQL header: OK — dump PostgreSQL válido
[...] restore: status: APROVADO — backup íntegro
```

---

## Retenção

| Local | Política | Responsável |
|---|---|---|
| VPS `/opt/revendaclick/backups/` | 7 dias (limpa automaticamente no backup.sh) | backup.sh |
| S3 `revendaclick/YYYY/MM/` | 30 dias (lifecycle policy automática do S3) | configure-s3-lifecycle.sh |

---

## Restore Real (PRODUÇÃO — Procedimento Manual)

> Executar apenas em situação de desastre confirmado. Irreversível.

```bash
# 1. Identificar backup alvo
/opt/revendaclick/scripts/restore-from-s3.sh

# 2. Manter o arquivo temporário (antes do cleanup)
# O script exibe: zcat '/opt/revendaclick/backups/.restore-validate-PID.sql.gz' | psql "$DATABASE_URL"

# 3. Restaurar (substitui TODOS os dados)
source /opt/revendaclick/.env
zcat /opt/revendaclick/backups/.restore-validate-PID.sql.gz | psql "$DATABASE_URL"

# 4. Verificar integridade pós-restore
curl https://api.revendaclick.com.br/health
```

> **Atenção:** Supabase cloud é o banco de produção. Restore via `psql` exige conexão direta (porta 5432 ou 6543). Verificar `DATABASE_URL` no `.env`.

---

## Como Validar (Regressão)

```bash
# Verificar logs do container
docker logs rc_backup --tail 50

# Ver backups locais
ls -lh /opt/revendaclick/backups/

# Ver backups no S3 (dentro do container)
docker exec rc_backup aws s3 ls s3://$BACKUP_S3_BUCKET/revendaclick/ --recursive
```

---

## Prevenção

- aws-cli instalado no startup do container — não reinstalado a cada backup
- Verificação S3 após upload — detecta falhas silenciosas
- exit code 1 quando S3 configurado e upload falha — fica visível nos logs do container
- Script de validação de restore documentado e testado
