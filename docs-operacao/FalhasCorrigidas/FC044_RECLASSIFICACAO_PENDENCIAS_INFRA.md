# FC044 — Reclassificação de Pendências Não Prioritárias

**Data:** 13/06/2026
**Sessão:** 50
**Tipo:** Decisão de negócio / Atualização documental
**Impacto:** Apenas documentação — sem alteração de código, banco, infra ou deploy

---

## Contexto

O projeto RevendaClick está em operação comercial com tenants reais.
A documentação operacional listava 3 itens como pendentes/bloqueados que não bloqueiam operação.

## Decisão de Negócio

Prioridade atual:
1. Comercialização
2. Captação de lojistas
3. Conversão de trials
4. Onboarding
5. Evolução de produto

Os 3 itens abaixo foram avaliados e deliberadamente adiados.

## Itens Reclassificados

### 1. Backup S3 — Configuração de Variáveis

**O que era:** Próximo Passo 3c — configurar `BACKUP_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` no `/opt/revendaclick/.env` do VPS.

**Estado técnico:** Container `rc_backup` implementado (FC043). Scripts `backup.sh`, `restore-from-s3.sh`, `configure-s3-lifecycle.sh` existem e estão corretos. Apenas as variáveis de ambiente estão ausentes.

**Motivo do adiamento:** Backup local de 7 dias já funciona. Redundância S3 é melhoria de infraestrutura, não requisito de operação.

**Quando retomar:** Quando crescimento de dados ou requisito de compliance justificar redundância offsite.

---

### 2. BetterStack Alerts HTTP 500

**O que era:** PENDENTE (Baixa) — criar alerta no BetterStack para logs backend com status >= 500.

**Estado técnico:** BetterStack ativo para log shipping. Uptime monitoring via cron job no VPS. Falta apenas a criação do alerta de status.

**Motivo do adiamento:** Volume atual de usuários não justifica monitoramento ativo de erros 500. Logs disponíveis via `docker logs rc_backend` e BetterStack dashboard.

**Quando retomar:** Quando volume de usuários reais justificar monitoramento ativo.

---

### 3. Leaked Password Protection (Supabase Pro)

**O que era:** BLOQUEADA — requer upgrade para Supabase Pro para integração com HaveIBeenPwned.org.

**Estado técnico:** Não é erro de implementação. Supabase Free não oferece este recurso. Produto funciona corretamente sem ele.

**Motivo do adiamento:** Não há requisito comercial ou de compliance que exija este recurso no momento.

**Quando retomar:** Quando upgrade Supabase Pro for decidido por outros motivos (volume, SLA, compliance).

---

## Arquivos Alterados

| Arquivo | Mudança |
|---|---|
| `docs-operacao/20_PENDENCIAS.md` | PENDENTE/BLOQUEADA → BACKLOG para 2 itens; nova seção "Backlog de Infraestrutura" |
| `docs-operacao/23_PROXIMO_PASSO.md` | Itens 3a/3b/3c removidos de "Ação manual"; nova seção "Backlog de Infraestrutura" |
| `docs-operacao/REFERENCE.md` | FC044 adicionado; próxima FC: FC045; nota na seção Backup S3 |
| `docs-operacao/22_HISTORICO_ALTERACOES.md` | FC044 no ESTADO ATUAL e entrada cronológica |
| `memory/project_status.md` | Atualização de estado |

## Pendências Ativas Restantes (após reclassificação)

| Pendência | Tipo | Prioridade |
|---|---|---|
| Lead "Joaõ" (48998232010, São José/SC) — status `novo` desde 2026-06-04 | Comercial | IMEDIATA |
| Acompanhamento `revenda-click` (trialing) | Comercial | Alta |
| Acompanhamento `finalcar` (canceled) | Comercial | Média |
| Rotação semestral de secrets | Segurança | Baixa |

## Prevenção

Ao encerrar sessões futuras, itens de infraestrutura sem data definida devem ser classificados como BACKLOG desde o início — não como PENDENTE ou BLOQUEADO — para manter o backlog ativo focado em itens realmente prioritários.
