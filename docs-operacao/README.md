# docs-operacao — RevendaClick

Memória viva do projeto. Atualizada ao final de cada sessão de trabalho.

**Leia `00_LEIA_PRIMEIRO.md` antes de qualquer coisa.**

---

## Índice

| Arquivo | Conteúdo |
|---|---|
| [00_LEIA_PRIMEIRO.md](00_LEIA_PRIMEIRO.md) | Visão geral — para quem não é desenvolvedor |
| [01_ARQUITETURA_REAL.md](01_ARQUITETURA_REAL.md) | Diagrama real de componentes e fluxo de dados |
| [02_MAPA_DE_PASTAS.md](02_MAPA_DE_PASTAS.md) | Cada arquivo, seu caminho e impacto ao alterar |
| [03_FRONTEND.md](03_FRONTEND.md) | Next.js: rotas, componentes, libs, middleware |
| [04_BACKEND.md](04_BACKEND.md) | Go/Gin: módulos, middleware chain, endpoints |
| [05_SUPABASE.md](05_SUPABASE.md) | Banco, Auth, Storage, RLS, funções, triggers |
| [06_AUTENTICACAO.md](06_AUTENTICACAO.md) | JWT, sessões, fluxos de login/registro/onboarding |
| [07_MULTI_TENANT.md](07_MULTI_TENANT.md) | Isolamento de dados, RLS, tenant_id, roles |
| [08_API_ROTAS_REAIS.md](08_API_ROTAS_REAIS.md) | Todas as rotas HTTP com método, auth e roles |
| [09_ENVS.md](09_ENVS.md) | Todas as variáveis de ambiente por serviço |
| [10_INFRA_VPS.md](10_INFRA_VPS.md) | VPS Hostinger, Nginx, SSL, domínios |
| [11_DOCKER.md](11_DOCKER.md) | Compose dev/prod, serviços, volumes, redes |
| [12_CICD.md](12_CICD.md) | GitHub Actions: pipeline, jobs, self-hosted runner |
| [13_DEPLOY.md](13_DEPLOY.md) | Como fazer deploy, rollback, scripts |
| [14_OBSERVABILIDADE.md](14_OBSERVABILIDADE.md) | Métricas Prometheus, logs Zap, BetterStack |
| [15_BILLING_ASAAS.md](15_BILLING_ASAAS.md) | Planos, subscription, webhooks, grace period |
| [16_EVOLUTION.md](16_EVOLUTION.md) | WhatsApp via Evolution API, QR, webhooks |
| [17_FLUXOS_NEGOCIO.md](17_FLUXOS_NEGOCIO.md) | Fluxos completos: lead, venda, onboarding, billing |
| [18_MIGRACAO_FLUTTERFLOW.md](18_MIGRACAO_FLUTTERFLOW.md) | Guia para migrar frontend para FlutterFlow |
| [19_RISCOS.md](19_RISCOS.md) | Riscos conhecidos por componente |
| [20_PENDENCIAS.md](20_PENDENCIAS.md) | Tarefas pendentes com prioridade e responsável |
| [21_DECISOES_TECNICAS.md](21_DECISOES_TECNICAS.md) | Por que cada tecnologia foi escolhida |
| [22_HISTORICO_ALTERACOES.md](22_HISTORICO_ALTERACOES.md) | Registro de toda mudança feita no projeto |
| [23_PROXIMO_PASSO.md](23_PROXIMO_PASSO.md) | Próxima ação recomendada — atualizar a cada sessão |
| [24_RUNBOOK_INCIDENTES.md](24_RUNBOOK_INCIDENTES.md) | Passo a passo para 10 cenários de incidente em produção |

---

## Regra de uso

Todo chat com IA deve começar com:
> "Leia /docs-operacao/* e me informe o status atual antes de alterar código."

Todo chat deve terminar com atualização de:
- `22_HISTORICO_ALTERACOES.md`
- `20_PENDENCIAS.md`
- `23_PROXIMO_PASSO.md`

---

*Gerado em 2026-05-22. Baseado em leitura real dos arquivos do repositório.*
