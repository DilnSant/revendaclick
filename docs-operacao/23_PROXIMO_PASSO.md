# 23 — PRÓXIMO PASSO

> Atualizado em: 22/05/2026
> Atualizar este arquivo ao final de cada sessão com o que deve ser feito na próxima.

---

## Estado Atual do Projeto

Sistema em produção e operacional:

- Backend Go → `https://api.revendaclick.com.br` ✓
- Frontend Next.js → `https://app.revendaclick.com.br` ✓
- CI/CD GitHub Actions → automático em push para `main` ✓
- Evolution API (WhatsApp) → `https://evolution.revendaclick.com.br` ✓
- Billing Asaas → assinaturas funcionando ✓
- Observabilidade → `/metrics` + BetterStack ✓

---

## Próximos Passos (por prioridade)

### 1. Backup S3 (Média prioridade)

O container `backup` está configurado no `docker-compose.prod.yml` mas S3 é opcional.

Para ativar:
```bash
# No VPS — adicionar ao .env
BACKUP_S3_BUCKET=meu-bucket-s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=sa-east-1
```

Ver `11_DOCKER.md` para detalhes do container de backup.

---

### 2. Uptime Monitoring (Baixa prioridade)

Configurar monitor externo para `https://api.revendaclick.com.br/health`.

Opções gratuitas: UptimeRobot, BetterStack Uptime, Freshping.

Alertar via e-mail ou Slack quando o health check falhar.

---

### 3. Rotação de Secrets (Baixa prioridade)

Definir política semestral para rotação de:
- `ASAAS_API_KEY`
- `EVOLUTION_API_KEY`
- `METRICS_TOKEN`

Ao rodar `ASAAS_WEBHOOK_TOKEN`: atualizar simultaneamente no Asaas dashboard.

---

### 4. Review de Indexes (Baixa prioridade)

Executar `EXPLAIN ANALYZE` nas queries mais frequentes após 30 dias em produção com carga real.

Candidatos: queries de leads com filtros, queries de veículos com preço, queries de analytics.

---

## Decisões Tomadas nesta Sessão

- FlutterFlow: **descartado** (ver D12 em `21_DECISOES_TECNICAS.md`)
- `docs-operacao/`: criado com 24 arquivos como memória viva do projeto

---

## Contexto para a Próxima Sessão

Ao iniciar uma nova sessão:

1. Ler `00_LEIA_PRIMEIRO.md` — visão geral do sistema
2. Ler `20_PENDENCIAS.md` — o que está pendente
3. Ler este arquivo (`23_PROXIMO_PASSO.md`) — o que fazer agora
4. Se for alterar banco: ver `05_SUPABASE.md` primeiro
5. Se for alterar infra: ver `10_INFRA_VPS.md` e `11_DOCKER.md`
6. Se for alterar backend: ver `04_BACKEND.md` e `08_API_ROTAS_REAIS.md`
7. Se for fazer deploy: ver `13_DEPLOY.md` e `12_CICD.md`
