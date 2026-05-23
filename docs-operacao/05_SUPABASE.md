# 05 — SUPABASE

> Baseado em leitura de: `database/schema.sql`, `database/migrations/001-010`, `frontend/lib/supabaseServer.ts`, `backend/internal/config/config.go`, `backend/internal/onboarding/onboarding.go`.

---

## O que o Supabase fornece

| Serviço | Uso no projeto |
|---|---|
| **PostgreSQL** | Banco de dados principal (todas as tabelas) |
| **Auth** | Gerencia login, senha, JWT, confirmação de email |
| **Storage** | Armazena fotos de veículos |
| **PgBouncer** | Pool de conexões (porta 6543 — transaction mode) |
| **JWKS endpoint** | Chave pública EC para validar JWT no backend Go |

---

## Conexões ao Banco

O projeto usa **dois tipos de conexão** com PostgreSQL via Supabase:

| Tipo | Porta | Modo | Usado por |
|---|---|---|---|
| PgBouncer Transaction | **6543** | SimpleProtocol | Backend Go (pgx) |
| Session Pooler | **5432** | Padrão | Evolution API (Prisma) |

**CRÍTICO:** Nunca inverter as portas. Prisma usa advisory locks — incompatível com transaction mode. pgx com SimpleProtocol — incompatível com modo session sem configuração adicional.

---

## Tabelas do Banco

### `plans` (global — não isolada por tenant)
- Contém os planos disponíveis: Starter, Pro, Premium, Enterprise
- Preços, limites (`max_vehicles`, `max_users`, `max_leads`), features (JSONB array)
- **Para mudar preços ou limites:** UPDATE na tabela `plans` no Supabase Dashboard

### `tenants` (uma linha por revenda)
- `slug` — URL da vitrine: `revendaclick.com.br/slug`
- `theme` — cor primária e fonte da loja (JSONB)
- `asaas_customer_id` — ID do cliente na Asaas (billing)

### `subscriptions` (uma por tenant)
- `status`: `active | trialing | past_due | canceled | paused`
- `grace_until` — até quando aceita requests mesmo com past_due (3 dias)
- `asaas_subscription_id` — vinculo com Asaas

### `users` (vinculada a `auth.users`)
- `id` é o mesmo UUID do Supabase Auth
- `role`: `owner | admin | seller | viewer`
- Um tenant pode ter múltiplos usuários

### `vehicles`
- `slug` — único por tenant: `revendaclick.com.br/minha-loja/carro-modelo-2024`
- `images[]` — array de URLs do Supabase Storage
- `status`: `available | reserved | sold | inactive`
- Limite por plano enforçado via trigger DB

### `leads`
- INSERT público (sem auth) — vitrine aceita leads de qualquer visitante
- RLS permite leitura apenas pelo próprio tenant
- `source`: `marketplace | whatsapp | referral | direct | social | other`

### `vendor_invitations`
- Convites enviados por owner/admin para novos membros
- Expira em 7 dias (`expires_at`)
- Token único de 32 bytes hex

---

## Funções do Banco

| Função | Tipo | O que faz |
|---|---|---|
| `auth_tenant_id()` | STABLE | Extrai `tenant_id` do JWT: `auth.jwt() ->> 'tenant_id'` |
| `auth_user_role()` | STABLE | Extrai `user_role` do JWT |
| `get_tenant_usage(p_tenant_id)` | SECURITY DEFINER | Retorna contagens + % de uso por tenant |
| `set_updated_at()` | TRIGGER | Atualiza `updated_at` em todos os UPDATE |
| `check_vehicle_limit()` | TRIGGER BEFORE INSERT | Bloqueia veículo se atingiu limite do plano |
| `check_user_limit()` | TRIGGER BEFORE INSERT | Bloqueia usuário se atingiu limite do plano |
| `auto_assign_trial_subscription()` | TRIGGER AFTER INSERT tenants | Cria trial 14 dias automaticamente |
| `create_onboarding_checklist()` | TRIGGER AFTER INSERT tenants | Cria checklist vazio automaticamente |
| `set_subscription_grace()` | TRIGGER BEFORE UPDATE subscriptions | Grace 3 dias quando status muda para past_due |
| `increment_vehicle_leads_count()` | TRIGGER AFTER INSERT leads | Incrementa `vehicles.leads_count` |

---

## RLS — Row Level Security

**Regra fundamental:** Cada cliente (tenant) só vê e acessa seus próprios dados.

### Como funciona

```sql
-- O banco extrai o tenant_id do JWT automaticamente:
SELECT auth.jwt() ->> 'tenant_id'  -- retorna o UUID do tenant logado

-- Política típica:
USING (tenant_id = auth_tenant_id())
```

### Exceções (dados públicos)
- `plans` — SELECT público (`USING (TRUE)`)
- `vehicles` — SELECT público para `status = 'available'` (marketplace)
- `sellers` — SELECT público para `is_active = TRUE`
- `leads` — INSERT público sem restrição (formulário de captação)

### Service Role (bypass RLS)
O backend Go e o frontend Next.js (server-side) usam `SUPABASE_SERVICE_ROLE_KEY`, que bypassa RLS automaticamente.

**Nunca** expor `SERVICE_ROLE_KEY` ao browser — daria acesso total a todos os dados.

---

## Auth — Supabase Auth

### JWT Claims usados

```json
{
  "sub": "<user_uuid>",
  "aud": "authenticated",
  "app_metadata": {
    "tenant_id": "<tenant_uuid>",
    "user_role": "owner"
  }
}
```

O campo `app_metadata` é preenchido pelo backend Go via Admin API após o onboarding:
```
PUT <SUPABASE_URL>/auth/v1/admin/users/<user_id>
Authorization: Bearer <SERVICE_ROLE_KEY>
{ "app_metadata": { "tenant_id": "...", "user_role": "owner" } }
```

### Algoritmos JWT suportados
- **ES256** (projetos novos Supabase): chave pública buscada automaticamente via JWKS
- **HS256** (projetos antigos): via `SUPABASE_JWT_SECRET`

### Operações Auth disponíveis
- `signUp()` — registro
- `signInWithPassword()` — login
- `signOut()` — logout
- `resetPasswordForEmail()` — solicita reset
- `updateUser({ password })` — define nova senha
- `exchangeCodeForSession(code)` — PKCE callback
- `getUser()` — verifica sessão (recomendado pelo Supabase para SSR)
- `getSession()` — obtém token de acesso

---

## Storage — Fotos de Veículos

Bucket: `vehicle-photos`

Configurado em `database/migrations/007_storage.sql`.

Acesso:
- **Upload:** via `createServiceClient()` (bypass RLS) em route handler server-side
- **Leitura:** URLs públicas (bucket público)
- **Política:** acesso de leitura público, upload restrito por tenant

---

## Aplicar Migrations

```bash
# Via Supabase CLI (recomendado):
supabase db push

# Via psql direto:
psql $DATABASE_URL -f database/migrations/00X_nome.sql
```

**Nunca** alterar colunas ou tabelas diretamente no banco sem criar uma migration.

---

## Supabase Dashboard — Principais Operações

| Operação | Onde |
|---|---|
| Ver/editar dados | Table Editor |
| Gerenciar usuários | Authentication → Users |
| Resetar senha de usuário | Authentication → Users → Send Magic Link |
| Ver logs de queries | Logs → Postgres |
| Ver erros de auth | Logs → Auth |
| Gerenciar Storage | Storage |
| Executar SQL | SQL Editor |
| Ver limites de uso | Settings → Usage |

---

## Projeto Supabase Linkado

Arquivo: `supabase/.temp/linked-project.json`

Contém o ID do projeto Supabase em produção.

```bash
# Para linkar o CLI ao projeto:
supabase link --project-ref <REF>
```
