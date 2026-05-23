# DEPLOY — RevendaClick

> Extraído de: `scripts/`, `infra/scripts/`, `vps-setup.sh`, `.github/workflows/ci.yml`.

---

## Fluxo Normal de Deploy (Automático via CI)

```
1. git push origin main
2. GitHub Actions: test-backend → build-push → deploy (self-hosted runner)
3. Runner no VPS:
   a. git pull origin main
   b. sudo cp nginx.conf /etc/nginx/nginx.conf && nginx -t && nginx -s reload
   c. docker compose pull backend (nova imagem com SHA do commit)
   d. docker compose up -d --remove-orphans
   e. Aguarda health check (24x5s = max 120s)
   f. bash scripts/smoke-test.sh https://api.revendaclick.com.br
```

Veja detalhes completos em `CICD.md`.

---

## Deploy Manual de Produção

**Script:** `scripts/deploy-production.sh`

```bash
bash scripts/deploy-production.sh
```

Usa `docker-compose.production.yml` com `.env` local do VPS.

---

## Deploy Staging

**Script:** `scripts/staging-deploy.sh`

```bash
bash scripts/staging-deploy.sh
```

Usa `docker-compose.staging.yml`.

**Script auxiliar:** `scripts/create-staging-admin.sh`
- Cria usuário admin no ambiente de staging para testes

---

## Provisionamento inicial do VPS

**Script:** `vps-setup.sh` (raiz) / `infra/scripts/vps-setup.sh`

O que faz:
1. Instala Docker CE e Docker Compose V2
2. Instala Nginx
3. Instala Certbot + plugin nginx
4. Cria estrutura de diretórios em `/opt/revendaclick/`
5. Configura firewall (UFW): permite 22, 80, 443
6. Clona repositório (se necessário)
7. Gera `METRICS_TOKEN` (openssl rand -hex 32) se ausente

---

## SSL / Certificados

**Script:** `scripts/deploy-ssl.sh`

```bash
bash scripts/deploy-ssl.sh
```

Executa:
```bash
certbot --nginx -d api.revendaclick.com.br -d evolution.revendaclick.com.br
```

SSL gerenciado por Let's Encrypt + Certbot. Renovação automática via timer systemd.

**Validação pós-SSL:** `scripts/validate-ssl.sh`

---

## Validação de Produção

**Script:** `scripts/validate-production.sh`

Checklist completo pós-deploy:
- Status dos containers Docker
- Healthchecks
- Conectividade com endpoints públicos
- Verificação de variáveis de ambiente críticas

---

## Smoke Test

**Script:** `scripts/smoke-test.sh`

```bash
bash scripts/smoke-test.sh [BASE_URL]
# default: https://api.revendaclick.com.br
```

10 seções de verificação:
1. TLS (api + evolution) — validade > 14 dias
2. Backend health (`/health`, `/api/v1/health`)
3. Security headers (HSTS, X-Content-Type-Options, X-Frame-Options)
4. Public API (200 em /api/plans, 404 em slug inexistente)
5. Auth enforcement (401 sem JWT)
6. Rate limiting (X-Request-ID presente = nginx no path)
7. Webhook rejection (sem token = 401/400)
8. Metrics protection (401 ou 403/000)
9. Nginx cache (X-Cache-Status presente em /api/public/*)
10. Evolution API reachable

Exit 0 = all passed | Exit 1 = algum falhou.

---

## Validação de Billing

**Script:** `scripts/validate-billing.sh`

Testa endpoints de billing (subscribe, cancel, webhooks) em staging ou produção.

---

## Backup

**Arquivo:** `infra/scripts/backup.sh`

Executado diariamente às 03:00 UTC pelo container `backup` em `docker-compose.prod.yml`.

O que faz:
1. `pg_dump $DATABASE_URL` → arquivo com timestamp
2. Salva em `/opt/revendaclick/backups/`
3. Se `BACKUP_S3_BUCKET` configurado → `aws s3 cp` para S3
4. Retém últimos N backups locais (limpa antigos)

---

## Script de Retomada de Deploy

**Script:** `scripts/resume-step7.sh`

Usado para retomar deploy passo a passo quando interrompido na etapa 7.

---

## Localização dos Arquivos no VPS

| Arquivo | Path no VPS |
|---|---|
| Env de produção | `/opt/revendaclick/.env` |
| Compose de produção | `/opt/revendaclick/docker-compose.production.yml` |
| Nginx config | `/etc/nginx/nginx.conf` |
| Backups | `/opt/revendaclick/backups/` |
| Script de backup | `/opt/revendaclick/backup.sh` |
| Scripts | `/opt/revendaclick/scripts/` |
| Repositório git | `/opt/revendaclick/` |

---

## Resumo dos Scripts por Finalidade

| Objetivo | Script |
|---|---|
| Deploy automático | `.github/workflows/ci.yml` |
| Deploy manual produção | `scripts/deploy-production.sh` |
| Deploy staging | `scripts/staging-deploy.sh` |
| Provisionar VPS (primeira vez) | `vps-setup.sh` |
| Instalar SSL | `scripts/deploy-ssl.sh` |
| Validar SSL | `scripts/validate-ssl.sh` |
| Smoke test completo | `scripts/smoke-test.sh` |
| Validar produção | `scripts/validate-production.sh` |
| Validar billing | `scripts/validate-billing.sh` |
| Criar admin staging | `scripts/create-staging-admin.sh` |
| Retomar deploy interrompido | `scripts/resume-step7.sh` |
| Backup diário | `infra/scripts/backup.sh` |

---

## Riscos ao Alterar Deploy

| Mudança | Risco |
|---|---|
| Não rodar `nginx -t` antes de `nginx -s reload` | Nginx para com config inválida — downtime total |
| Deploy sem `--env-file .env` | Backend sobe sem vars de produção — crash ou dados errados |
| Usar `docker-compose.yml` em prod | Portas expostas publicamente sem SSL |
| Alterar compose file referenciado no CI sem atualizar `ci.yml` | CI deploya arquivo diferente do esperado |
| Apagar `/opt/revendaclick/backups/` sem migrar | Perda de backups históricos |
