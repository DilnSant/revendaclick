# ENVIRONMENTS — Ambientes do RevendaClick

> Eliminar confusão entre ambientes de produção, homologação e desenvolvimento.
> Consultar aqui antes de qualquer operação sensível (deploy, migration, billing test).

---

## PRODUÇÃO

> Ambiente real. Dados reais. Pagamentos reais. Usuários reais.

| Componente | URL | Deploy | Responsável |
|---|---|---|---|
| **Frontend** | `https://app.revendaclick.com.br` | Vercel — automático via push para `main` | Vercel (integração GitHub) |
| **Backend Go** | `https://api.revendaclick.com.br` | CI/CD GitHub Actions → GHCR → VPS self-hosted runner | Automático |
| **Evolution API** | `https://evolution.revendaclick.com.br` | Docker no VPS (`rc_evolution`) | Manual ou restart container |
| **Database** | Supabase cloud — `ibgaywezfcbbiiziaoac` | Migrations via MCP ou `supabase db push` | Manual |
| **Redis** | VPS interno (`rc_redis:6379`) | Docker | Automático com compose |

### Configurações de Produção

| Variável | Valor produção |
|---|---|
| `ENV` | `production` |
| `ASAAS_ENV` | `production` |
| `ALLOWED_ORIGINS` | `https://app.revendaclick.com.br,...` |
| `EVOLUTION_API_URL` | `http://evolution:8080` (rede Docker interna) |
| `INTERNAL_API_URL` | `http://backend:8080` (rede Docker interna) |
| `DATABASE_URL` | porta **6543** (PgBouncer — backend Go) |
| `EVOLUTION_DATABASE_URL` | porta **5432** (direto — Evolution/Prisma) |

### Integrações Produção

| Integração | Conta | Observação |
|---|---|---|
| Asaas | conta production | IP 2.24.67.84 na whitelist |
| Supabase Auth | projeto `ibgaywezfcbbiiziaoac` | JWT audience `authenticated` |
| Evolution | instância por tenant (slug) | `rc_evolution` no VPS |
| Vercel | projeto `revendaclick-frontend` | env vars configuradas no dashboard |
| GHCR | `ghcr.io/dilnsant/revendaclick-backend` | autenticado via GitHub token |

### Comandos de diagnóstico produção

```bash
# Logs do backend
ssh root@2.24.67.84 "docker logs rc_backend --tail 100 -f"

# Status dos containers
ssh root@2.24.67.84 "docker compose -f /opt/revendaclick/docker-compose.production.yml ps"

# Healthcheck
curl https://api.revendaclick.com.br/health
```

---

## HOMOLOGAÇÃO

> Ambiente de testes com dados reais controlados. Billing em sandbox.

**Status atual:** Não existe ambiente de homologação isolado.
O tenant `santos-car` no banco de produção funciona como tenant de homologação do owner.

| Componente | URL / Localização | Observação |
|---|---|---|
| **Frontend** | `https://app.revendaclick.com.br` | Mesmo frontend de produção |
| **Backend** | `https://api.revendaclick.com.br` | Mesmo backend de produção |
| **Database** | Supabase `ibgaywezfcbbiiziaoac` | Schema público — dados reais |
| **Asaas** | Conta produção | `ASAAS_ENV=production` no VPS; usar `AdminSimulateEvent` para testes sem cobrança |
| **Tenant de ref.** | `santos-car` (Pro) | Tenant real do owner; billing via `dev_test_*` (sem assinatura real) |

**Tenants de referência para testes:**

| Tenant | Plano | Finalidade |
|---|---|---|
| `santos-car` | **Pro** | Tenant principal do owner; testes Pro; Evolution `open` (554888482877) |

> **Sessão 64 (06/08/2026):** `santos-car` é o **único tenant do banco**. Todos os outros
> (`devecar`, `finalcar`, `auditoria-rc-s42`, `revenda-click`) foram excluídos definitivamente
> — eram todos de teste. `sandbox-revendaclick`, citado aqui até então, nunca chegou a existir
> no banco. Ao precisar de um tenant isolado, criar um novo via `/register` e registrá-lo aqui.

**Para simular eventos Asaas sem pagamento real:**
```
POST /api/admin/billing/simulate-event
Authorization: Bearer <super_admin_token>
Body: {
  "event_type":      "PAYMENT_CONFIRMED",
  "subscription_id": "dev_test_<tenant_id>"
}
```

Requer: super_admin (`dilneysantos.developer@gmail.com`).
Campos aceitos: `event_type` (obrigatório), `subscription_id`, `value`, `due_date`.

---

## DESENVOLVIMENTO (Local)

> Ambiente do desenvolvedor. Dados fictícios. Sem cobranças reais.

| Componente | URL | Como subir |
|---|---|---|
| **Frontend** | `http://localhost:3000` | `cd frontend && npm run dev` |
| **Backend** | `http://localhost:8080` | `cd backend && go run ./cmd/api` |
| **Evolution** | `http://localhost:8081` | `docker compose up rc_evolution` |
| **Database** | Supabase cloud (mesmo projeto) | Sem instalação local — usa cloud |
| **Redis** | `localhost:6379` | `docker compose up rc_redis` |

### .env Local (frontend)

```env
NEXT_PUBLIC_SUPABASE_URL=https://ibgaywezfcbbiiziaoac.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=eyJ...
INTERNAL_API_URL=http://localhost:8080
```

### .env Local (backend)

```env
ENV=development
PORT=8080
DATABASE_URL=postgresql://postgres.ibgaywezfcbbiiziaoac:PASS@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require
SUPABASE_URL=https://ibgaywezfcbbiiziaoac.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ASAAS_ENV=sandbox
ASAAS_API_KEY=...sandbox key...
EVOLUTION_API_URL=http://localhost:8081
ALLOWED_ORIGINS=http://localhost:3000
```

### Ativar plano sem Asaas (dev only)

```bash
POST http://localhost:8080/api/billing/dev/activate
Authorization: Bearer <token>
Body: { "plan_name": "pro", "billing_cycle": "monthly" }
```

**ATENÇÃO:** Endpoint `dev/activate` desabilitado em produção (`ENV=production`).

---

## DIFERENÇAS CRÍTICAS ENTRE AMBIENTES

| Aspecto | Desenvolvimento | Produção |
|---|---|---|
| Asaas | `sandbox` — sem cobrança real | `production` — cobrança real |
| `dev/activate` | Ativo | **Desabilitado** |
| HTTPS | Não obrigatório | **Obrigatório** |
| CORS | `localhost:3000` | `app.revendaclick.com.br` |
| Evolution | Local ou sem WhatsApp | VPS — instâncias reais |
| DATABASE_URL porta | 6543 (PgBouncer) | 6543 (PgBouncer) |
| EVOLUTION_DATABASE_URL porta | 5432 | 5432 |
| Logs | stdout | stdout + BetterStack |
| Métricas | sem autenticação | requer `METRICS_TOKEN` |

---

## CHECKLIST ANTES DE FAZER MIGRATION EM PRODUÇÃO

- [ ] Testar migration em development primeiro
- [ ] Verificar impacto nas RLS policies existentes
- [ ] Regenerar `database.types.ts` após aplicar
- [ ] Verificar se `get_tenant_usage()` ainda retorna todas as flags
- [ ] Fazer commit ANTES de aplicar (rastreabilidade)
- [ ] Ter rollback pronto (migration reversa se aplicável)
