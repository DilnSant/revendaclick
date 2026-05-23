# 20 — PENDÊNCIAS

> Atualizado em: 22/05/2026
> Atualizar este arquivo ao iniciar ou concluir cada tarefa.

---

## Como Usar Este Arquivo

- **PENDENTE** → tarefa não iniciada
- **EM ANDAMENTO** → iniciada nesta sessão
- **CONCLUÍDA** → mover para `22_HISTORICO_ALTERACOES.md`

---

## Infraestrutura

| Status | Tarefa | Prioridade | Detalhes |
|---|---|---|---|
| CONCLUÍDA | VPS Hostinger | — | Contratada e configurada |
| CONCLUÍDA | Docker Compose produção | — | `docker-compose.production.yml` ativo |
| CONCLUÍDA | CI/CD GitHub Actions | — | test → build → deploy → smoke-test |
| CONCLUÍDA | SSL Let's Encrypt | — | api + evolution com renovação automática |
| CONCLUÍDA | Nginx reverse proxy | — | rate limiting, cache, security headers |
| CONCLUÍDA | Self-hosted runner | — | Runner ativo no VPS |
| PENDENTE | Backup S3 | Média | `BACKUP_S3_BUCKET` opcional — configurar bucket S3 e credenciais |

---

## Backend

| Status | Tarefa | Prioridade | Detalhes |
|---|---|---|---|
| CONCLUÍDA | Go REST API | — | Todos os módulos implementados |
| CONCLUÍDA | Multi-tenant isolamento | — | RLS + JWT + tenant middleware |
| CONCLUÍDA | Billing Asaas | — | Subscribe, webhooks, grace period |
| CONCLUÍDA | Evolution API | — | Webhook receiver, instâncias, envio |
| CONCLUÍDA | OpenRouter AI | — | classify-lead, suggest-reply |
| CONCLUÍDA | Prometheus metrics | — | Custom registry, coleta DB+negócio |
| CONCLUÍDA | BetterStack logging | — | Tee zap → stdout + HTTP |
| CONCLUÍDA | Onboarding setup | — | Transação + idempotência |

---

## Frontend

| Status | Tarefa | Prioridade | Detalhes |
|---|---|---|---|
| CONCLUÍDA | Next.js 16 SSR | — | App Router, Server Components |
| CONCLUÍDA | Auth flow completo | — | Registro → confirmação → onboarding → dashboard |
| CONCLUÍDA | Dashboard com KPIs | — | Métricas principais |
| CONCLUÍDA | Módulo Leads/CRM | — | Lista, kanban, atividades |
| CONCLUÍDA | Módulo Veículos | — | CRUD + vitrine pública SEO |
| CONCLUÍDA | Módulo Clientes | — | CRUD |
| CONCLUÍDA | Módulo Financeiro | — | Entradas, saídas, fluxo de caixa |
| CONCLUÍDA | Módulo Vendas | — | Pipeline + comissões |
| CONCLUÍDA | Módulo Analytics | — | Plano Pro+ apenas |
| CONCLUÍDA | Settings e Equipe | — | Configurações da loja e vendedores |
| CONCLUÍDA | WhatsApp screen | — | QR code, status, envio |
| CONCLUÍDA | Billing screens | — | Assinatura, planos, faturas |

---

## Banco de Dados

| Status | Tarefa | Prioridade | Detalhes |
|---|---|---|---|
| CONCLUÍDA | Schema completo | — | Todas as tabelas com RLS |
| CONCLUÍDA | Migrations 001-008 | — | Billing, vendors, auditoria |
| CONCLUÍDA | Triggers | — | Grace period, limites de plano, trial automático |
| PENDENTE | Indexes de performance | Média | Revisar EXPLAIN ANALYZE em queries lentas |

---

## FlutterFlow

**CANCELADO em 22/05/2026** — Migração para FlutterFlow descartada. Ver D12 em `21_DECISOES_TECNICAS.md`.
Frontend Next.js continua como stack oficial.

---

## Observabilidade

| Status | Tarefa | Prioridade | Detalhes |
|---|---|---|---|
| CONCLUÍDA | Prometheus metrics | — | endpoint /metrics |
| CONCLUÍDA | BetterStack logs | — | Tee zap |
| PENDENTE | Uptime monitoring | Baixa | Configurar monitor externo (UptimeRobot ou similar) apontando para /health |
| PENDENTE | Alertas automáticos | Baixa | Configurar alerta no BetterStack para erros 5xx |

---

## Segurança

| Status | Tarefa | Prioridade | Detalhes |
|---|---|---|---|
| CONCLUÍDA | Security headers Nginx | — | HSTS, X-Frame-Options, etc. |
| CONCLUÍDA | Rate limiting Nginx | — | Por zona (api, evo, webhook) |
| CONCLUÍDA | Métricas protegidas | — | Bearer token + IP restriction |
| CONCLUÍDA | Input validation | — | MaxBodySize + slug/email regex |
| PENDENTE | Rotação de secrets | Baixa | Definir política de rotação semestral para ASAAS_API_KEY, EVOLUTION_API_KEY |

---

## Documentação

| Status | Tarefa | Prioridade | Detalhes |
|---|---|---|---|
| CONCLUÍDA | docs-operacao/ (24 arquivos) | — | Memória viva do projeto |
| CONCLUÍDA | FLUTTERFLOW_MIGRATION.md | — | Guia completo de migração |
| PENDENTE | Runbook de incidentes | Baixa | Passo a passo para cada cenário de falha |
