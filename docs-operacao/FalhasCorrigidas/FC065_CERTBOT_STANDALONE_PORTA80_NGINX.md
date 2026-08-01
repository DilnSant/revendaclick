# FC065 — Certbot não renovava (standalone conflitando com Nginx na porta 80)

**Área:** Infra / VPS / SSL
**Severidade:** CRÍTICA
**Data:** 01/08/2026
**Sessão:** 61

---

## Sintoma

Certificado SSL de `api.revendaclick.com.br` (cobre também `evolution.revendaclick.com.br`) a
10 dias de expirar, sem nenhuma renovação automática ter acontecido apesar do timer/cron de
certbot estar ativo (`certbot.timer`, duas vezes ao dia, mais um cron redundante às 2h). Achado
durante verificação do worker de lembrete de vencimento — não relacionado ao trabalho da sessão,
descoberto pelo smoke test do próprio CI/CD (`scripts/smoke-test.sh`), que falha o pipeline sempre
que um certificado está a menos de 15 dias de expirar (mas não impede o deploy do código, que
segue normalmente).

## Causa Raiz

`/etc/letsencrypt/renewal/api.revendaclick.com.br.conf`: `authenticator = standalone`.

O plugin `standalone` do certbot precisa abrir a própria porta 80 temporariamente para validar o
domínio (challenge HTTP-01) — mas a porta 80 já está permanentemente ocupada pelo Nginx (reverse
proxy da stack). Toda tentativa de renovação (manual ou via `certbot.timer`) falhava com:

```
certbot.errors.PluginError: Could not bind TCP port 80 because it is already in use by another
process on this system (such as a web server).
```

Confirmado em `/var/log/letsencrypt/letsencrypt.log`: falhas recorrentes de renovação para
`api.revendaclick.com.br` **e** `api.beautynow.app.br` (outro projeto na mesma VPS, mesmo problema
— fora do escopo desta sessão, não corrigido).

O Nginx já estava corretamente configurado para servir o desafio ACME via webroot
(`nginx.conf`, location `/.well-known/acme-challenge/` → `root /var/www/html`) — só o certbot
nunca foi configurado para usar esse método.

## Correção Aplicada

Reemissão imediata usando o método webroot (compatível com o Nginx já em produção, sem downtime):

```bash
certbot certonly --webroot -w /var/www/html \
  -d api.revendaclick.com.br -d evolution.revendaclick.com.br \
  --non-interactive --deploy-hook 'systemctl reload nginx'
```

Certificado renovado, válido até **2026-10-30**. `authenticator = standalone` foi substituído por
`authenticator = webroot` no arquivo de renovação — todas as renovações futuras (automáticas via
`certbot.timer`/cron) passam a usar o método correto.

## Como Validar

```bash
certbot certificates                                    # expiry deve estar em ~90 dias, não <15
grep authenticator /etc/letsencrypt/renewal/api.revendaclick.com.br.conf  # deve ser "webroot"
certbot renew --cert-name api.revendaclick.com.br --dry-run              # deve concluir sem erro
```

## Pendência relacionada

`api.beautynow.app.br` (mesma VPS, outro projeto) tem exatamente o mesmo problema
(`authenticator = standalone`) e **não foi corrigido nesta sessão** — fora de escopo do
RevendaClick. Registrar como pendência para tratar separadamente.

## Prevenção

Nunca usar o plugin `standalone` do certbot num host onde a porta 80 já é ocupada por um serviço
permanente (Nginx, Apache, etc.) — usar sempre `webroot` (se o servidor já serve arquivos
estáticos) ou o plugin nativo do servidor (`--nginx`). Adicionar `certbot certificates` (checagem
de expiry) ao runbook de manutenção periódica da VPS.
