# 07 — MULTI-TENANT

> Baseado em: `database/schema.sql`, `backend/internal/middleware/tenant.go`, `backend/internal/middleware/auth.go`, `backend/internal/middleware/plan_gate.go`, `backend/internal/middleware/subscription.go`.

---

## Conceito

Cada **revenda** que se cadastra no RevendaClick é um **tenant** — um cliente isolado com seus próprios dados, usuários, veículos, leads e configurações.

O sistema garante que nenhum tenant veja ou acesse dados de outro, mesmo que compartilhem o mesmo banco de dados.

---

## Como o Isolamento é Garantido

### Camada 1 — JWT (`app_metadata`)

Após o onboarding, o JWT de cada usuário carrega:
```json
{
  "app_metadata": {
    "tenant_id": "uuid-do-tenant",
    "user_role": "owner"
  }
}
```

Isso viaja em cada request HTTP sem necessidade de consulta ao banco.

### Camada 2 — Backend Middleware (`tenant.go`)

O backend extrai `tenant_id` do JWT e o injeta no contexto Gin:
```go
c.Set("tenant_id", tenantIDFromJWT)
```

Toda query no banco usa esse `tenant_id`:
```go
tenantID := middleware.TenantIDFromGin(c)
// ↓ usado em todas as queries:
WHERE tenant_id = $1
```

### Camada 3 — RLS do PostgreSQL

Mesmo que o backend seja comprometido, o banco tem uma segunda linha de defesa:

```sql
-- Função que extrai do JWT diretamente no banco:
CREATE FUNCTION auth_tenant_id() RETURNS UUID AS $$
    SELECT NULLIF((auth.jwt() ->> 'tenant_id'), '')::UUID;
$$ LANGUAGE sql STABLE;

-- Política em todas as tabelas de negócio:
CREATE POLICY "tenants_select_own"
    ON tenants FOR SELECT
    USING (id = auth_tenant_id());
```

O Supabase valida o JWT e executa a função `auth_tenant_id()` em cada query.

---

## Tabelas Multi-Tenant

Toda tabela de negócio tem `tenant_id UUID NOT NULL`:

| Tabela | Tem tenant_id | Notas |
|---|---|---|
| `plans` | Não | Tabela global de referência |
| `tenants` | É o tenant | Linha raiz — `id` é o tenant_id |
| `subscriptions` | Sim | Uma por tenant |
| `users` | Sim | Múltiplos por tenant |
| `sellers` | Sim | Perfil de vendedor (extend users) |
| `vehicles` | Sim | Estoque da revenda |
| `leads` | Sim | Leads captados |
| `lead_activities` | Sim | Histórico do CRM |
| `customers` | Sim | Clientes da revenda |
| `onboarding_checklists` | Sim | Uma por tenant |
| `usage_snapshots` | Sim | Histórico de uso |
| `vendor_invitations` | Sim | Convites para equipe |

---

## Resolução do Tenant por Slug (Páginas Públicas)

Vitrine pública usa slug na URL: `revendaclick.com.br/minha-revenda`

Backend resolve sem JWT:
```go
// SlugTenantResolver:
SELECT id::text FROM tenants WHERE slug = $1 AND is_active = TRUE
```

Injeta `tenant_id` no contexto para queries das rotas `/api/public/:slug/*`.

---

## Isolamento de Subscription por Tenant

`subscriptions` tem constraint `UNIQUE (tenant_id)` — um tenant tem exatamente uma subscription ativa.

O `SubscriptionGate` middleware verifica a subscription de cada request:
```go
SELECT status, grace_until FROM subscriptions WHERE tenant_id = $1
```

Impede que tenants inadimplentes acessem recursos pagos.

---

## Limites por Plano (enforçado em 3 camadas)

| Camada | Mecanismo | Onde |
|---|---|---|
| DB trigger | `check_vehicle_limit()`, `check_user_limit()` | PostgreSQL — bloqueia INSERT |
| Backend API | `PlanGate(pool, "feature")` | Middleware Go — 403 se feature não no plano |
| Frontend | `<FeatureGate feature="analytics">` | Componente React — esconde UI |

---

## Roles por Tenant

| Role | Permissões |
|---|---|
| `owner` | Controle total — billing, delete, settings |
| `admin` | Gestão operacional — sem billing |
| `seller` | CRUD dos próprios leads e veículos |
| `viewer` | Apenas leitura |

RLS valida `auth_user_role()` diretamente no banco:
```sql
-- Só owner pode atualizar subscription:
CREATE POLICY "subscriptions_update_own"
    ON subscriptions FOR UPDATE
    USING (tenant_id = auth_tenant_id() AND auth_user_role() = 'owner')
```

---

## Onboarding — Criação do Tenant

Quando um usuário cria sua loja (`POST /api/onboarding/setup`):

```
1. INSERT INTO tenants (slug, name, email, phone_whatsapp)
     → trigger: cria onboarding_checklists
     → trigger: cria subscriptions (trialing, 14 dias, plano Starter)

2. INSERT INTO users (id=auth.uid, tenant_id, role='owner')
     → trigger: check_user_limit (passa — primeiro usuário)

3. PUT Supabase Admin API: app_metadata = { tenant_id, user_role: "owner" }
```

Após o passo 3, o JWT do usuário passa a carregar `tenant_id` em todas as requests.

---

## Dados Públicos vs Privados

### Público (sem autenticação)
- Dados da loja: nome, logo, descrição, contato
- Veículos disponíveis (`status = 'available'`)
- Perfis de vendedores ativos
- Formulário de lead (INSERT sem auth)

### Privado (requer auth + tenant_id correto)
- Todos os leads
- Dados financeiros
- Histórico de vendas
- Usuários da equipe
- Configurações

---

## Regras Absolutas

1. **Todo INSERT deve incluir `tenant_id`** — nunca deixar null
2. **Toda query deve filtrar por `tenant_id`** — nunca retornar dados de todos os tenants
3. **RLS deve estar ativo** em todas as tabelas de negócio — nunca desativar
4. **Nunca confiar no `tenant_id` enviado pelo frontend** — sempre usar o do JWT
5. **Service Role Key** só no servidor — nunca no browser
