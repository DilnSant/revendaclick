# REFERENCE — Quick Lookup

> Valores fixos do projeto. Consultar aqui antes de grepar ou abrir outros docs.
> Atualizar quando algum valor mudar de fato (IP, IDs, URLs, etc).

---

## Infraestrutura

| Item | Valor |
|---|---|
| VPS IP | `2.24.67.84` |
| VPS usuário | `root` |
| Projeto no VPS | `/opt/revendaclick` |
| Compose de produção | `docker-compose.production.yml` |
| Docker rede interna | `rc_network` |

## Containers (nomes exatos)

| Container | Imagem | Porta interna |
|---|---|---|
| `rc_backend` | `ghcr.io/dilnsant/revendaclick-backend` | `8080` |
| `rc_evolution` | `evoapicloud/evolution-api:v2.3.7` | `8080` |
| `rc_redis` | `redis:7-alpine` | `6379` |
| `rc_backup` | `alpine` | — |

## URLs de produção

| Serviço | URL |
|---|---|
| Frontend | `https://app.revendaclick.com.br` (Vercel) |
| API Backend | `https://api.revendaclick.com.br` |
| Evolution API | `https://evolution.revendaclick.com.br` |
| Site público | `https://revendaclick.com.br` |

## Endpoints úteis

```
GET  /health                → status do backend + DB ping
GET  /api/v1/health         → liveness simples
GET  /metrics               → Prometheus (requer METRICS_TOKEN)
```

## Supabase

| Item | Valor |
|---|---|
| Project ID | `ibgaywezfcbbiiziaoac` |
| URL base | `https://ibgaywezfcbbiiziaoac.supabase.co` |
| Pool port (PgBouncer) | `6543` — backend Go |
| Direct port | `5432` — Evolution API (Prisma) |

## GitHub / CI-CD

| Item | Valor |
|---|---|
| Repositório | `https://github.com/DilnSant/revendaclick` |
| Registry imagem | `ghcr.io/dilnsant/revendaclick-backend` |
| Runner CI/CD | Self-hosted no VPS |
| Trigger deploy | Push para `main` |
| Frontend deploy | Vercel — automático via integração GitHub |

## Banco de dados — estado atual

| Item | Valor |
|---|---|
| Migrations aplicadas | 001 → 025 (sem novas em sessão 24) |
| Próxima migration | `026_...` |
| Pasta de migrations | `database/migrations/` |
| Pasta de seeds | `database/seeds/` |

## Documentação de falhas

| Item | Valor |
|---|---|
| Pasta | `docs-operacao/FalhasCorrigidas/` |
| Total documentadas | 29 (FC001–FC029) |
| Próxima FC | **FC030** |

## Comandos frequentes

```bash
# Ver logs do backend em produção
ssh root@2.24.67.84 "docker logs rc_backend --tail 100 -f"

# Status dos containers
ssh root@2.24.67.84 "docker compose -f /opt/revendaclick/docker-compose.production.yml ps"

# Reiniciar backend após mudança de .env
ssh root@2.24.67.84 "cd /opt/revendaclick && docker compose -f docker-compose.production.yml up -d backend"

# Verificar variáveis resolvidas no container
ssh root@2.24.67.84 "docker exec rc_backend env | grep -E 'ASAAS|EVOLUTION|SUPABASE'"

# Forçar rebuild local do backend
cd backend && go build ./... && go vet ./... && go test ./...

# TypeScript check do frontend
cd frontend && npx tsc --noEmit
```

## Feature flags (nomes exatos)

```
has_crm                  → Pro+
has_analytics            → Pro+
has_central_atendimento  → add-on whatsapp_automation ou tenant_feature override
has_whatsapp             → Pro+
has_kanban               → Pro+
has_api_access           → Performance+
has_white_label          → Performance+
has_financial            → Starter+
has_vendors              → Starter+
has_whatsapp_qr          → add-on
```

## Planos (nomes exatos no banco)

| name | display_name comercial | Posição |
|---|---|---|
| `starter` | Starter | 1 |
| `pro` | Pro | 2 |
| `performance` | **Premium** | 3 — `plan.name = 'performance'`; nome comercial = "Premium" |
| `scale` | Scale | 4 — oculto do grid público; CTA "Enterprise" é apenas label de grid |

> **CRÍTICO:** `plan.name` no banco é `performance`, nunca `premium`. O nome comercial exibido ao cliente é "Premium".

## Add-ons (nomes exatos no banco)

| type | Nome comercial | Preço | Feature concedida |
|---|---|---|---|
| `user_extra` | Usuário Extra | R$20/mês | `max_users +1` |
| `whatsapp_automation` | Central de Atendimento | R$39/mês | `has_central_atendimento` |
| `ia_recovery` | IA Recovery | R$39/mês | `has_lead_recovery` |

## Sidebar — gates (definitivo — ver D28)

| Seção | Gate | Módulos |
|---|---|---|
| Base (Starter+) | sempre | Dashboard, Veículos, Interessados, Clientes, Financeiro¹ |
| Pro | `has_crm` | Atendimento (CRM), Analytics |
| Premium | `has_api_access` | Automações, Campanhas |
| Sempre visível | — | Assinatura², Configurações³ |

¹ Financeiro tem sub-nav interno: **Resumo** / **Vendas** / **Comissões**
² Assinatura tem sub-nav: **Assinatura** / **Add-ons** / **Cobranças** / **Planos**
³ Configurações tem tabs: **Loja** / **Contato Público** / **Usuários** / **Plano** / **WhatsApp**

## WhatsApp — dois conceitos distintos

| Conceito | Origem | Função | Tecnologia |
|---|---|---|---|
| **WhatsApp da Loja** | Número público do tenant (campo "Contato Público") | Botão "Falar no WhatsApp" na vitrine `/:slug`; contato público da revenda | Link `wa.me/{telefone}` — **sem Evolution** |
| **Central de Atendimento** | Evolution API v2.3.7 | Atendimento CRM via WhatsApp, mensagens, IA Recovery | Add-on `whatsapp_automation` → `has_central_atendimento` |

> Nunca confundir: WhatsApp da Loja é configurado em Configurações → Contato Público. Central de Atendimento é contratada separadamente em Add-ons.

## Tenants de referência

| Tenant | Plano | Notas |
|---|---|---|
| `santos-car` | Starter | tenant de homologação do owner (ativo) |

> **devecar** foi removido como tenant operacional de referência (2026-05-30).
> Era usado para testar plano Pro; Evolution desconectado desde 28/05 (device_removed).
> Histórico em `22_HISTORICO_ALTERACOES.md`. Novo tenant de referência Pro: criar `sandbox-revendaclick` via onboarding.

## super_admin

- Email: `dilneysantos.developer@gmail.com`
- `public.users.role = 'super_admin'`
- `public.users.tenant_id = NULL` (migration 025)
- Acesso: `GET /admin` no frontend
