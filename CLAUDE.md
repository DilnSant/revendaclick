Você é um engenheiro sênior especialista em SaaS multi-tenant, arquitetura fullstack moderna e sistemas escaláveis.

Sua tarefa é gerar um sistema COMPLETO, funcional e pronto para produção chamado **RevendaClick**.

IMPORTANTE:

* Gere código REAL (não pseudocódigo)
* Estruture arquivos corretamente
* Pronto para rodar no VSCode
* Evite abstrações vagas

---

# 🧱 STACK OBRIGATÓRIA

Frontend:

* Next.js 16 (App Router)
* SSR
* Server Components
* TailwindCSS

Backend:

* Go (Golang)
* API REST modular

Banco/Auth:

* Supabase (PostgreSQL)
* @supabase/ssr 0.8.0
* RLS (Row Level Security)

Arquitetura:

* Multi-tenant via tenant_id
* slug na URL
* isolamento por RLS

---

# 📁 ESTRUTURA DE PASTAS (OBRIGATÓRIO)

## Frontend (Next.js)

app/
(public)/
[slug]/
page.tsx
[vehicle]/page.tsx

(dashboard)/
dashboard/page.tsx
vehicles/page.tsx
leads/page.tsx
settings/page.tsx

lib/
supabaseServer.ts
supabaseClient.ts
tenant.ts

components/
ui/
crm/
marketplace/

middleware.ts

---

## Backend (Go)

/internal
/tenant
/vehicles
/leads
/users
/plans
/middleware

main.go

---

# 🔐 AUTENTICAÇÃO (SUPABASE SSR)

Implementar:

* createServerClient
* cookies-based auth
* recuperar usuário logado no server
* JWT usado no backend Go

---

# 🧱 MULTI-TENANT (CORE)

* Todas tabelas possuem tenant_id:
  tenants, users, vehicles, leads, sellers

* Middleware:

  * resolve slug
  * busca tenant no Supabase
  * injeta tenant_id no contexto

---

# 🌐 MIDDLEWARE NEXT.JS

Criar middleware.ts que:

* captura slug da URL
* busca tenant no Supabase
* injeta tenant_id
* redireciona se não existir

---

# 🔁 BACKEND GO (API)

Criar endpoints:

GET /api/public/{slug}
GET /api/vehicles
POST /api/vehicles
GET /api/leads
POST /api/leads

Autenticação:

* JWT Supabase
* validar tenant_id

---

# 🗄️ BANCO (SQL COMPLETO)

Criar tabelas:

tenants
users
vehicles
leads
sellers
subscriptions

Incluir:

* índices por tenant_id
* RLS ativo

RLS exemplo:

tenant_id = auth.jwt() ->> 'tenant_id'

---

# 💰 SISTEMA DE PLANOS

Criar PlanService:

STARTER:

* 30 veículos
* 4 usuários

PRO:

* 60 veículos
* 8 usuários

PREMIUM:

* 120 veículos
* 20 usuários

ENTERPRISE:

* ilimitado

---

# 🧠 REGRAS DE MONETIZAÇÃO

* limite = gatilho de upgrade
* uso visível = pressão psicológica
* bloqueio inteligente = conversão

---

# 🚨 ALERTAS

* 80% → aviso
* 85% → banner:

"Você atingiu 85% do seu plano — evite perder vendas"

* 100% → bloquear ação

---

# 🔒 VALIDAÇÕES

* impedir criação de veículos acima do limite
* impedir criação de usuários acima do limite

---

# 📊 MVP FUNCIONALIDADES

* cadastro de veículos
* página pública da loja
* captura de leads
* botão WhatsApp (com mensagem pré-preenchida)

---

# 📞 CRM

* lista de leads
* status:
  novo, atendimento, proposta, fechado
* responsável

---

# 🔥 PRIORIDADE ALTA

* kanban de leads

---

# 🚀 ONBOARDING

Fluxo:

1. cadastro simples:

* nome loja
* whatsapp
* senha

2. checklist:

* adicionar veículo
* configurar whatsapp
* criar página
* adicionar vendedor

3. mostrar:

"Seu site está pronto:
revendaclick.app/sualoja"

botão:
"Compartilhar no WhatsApp"

---

# 🎯 FRONTEND (UX)

* dashboard com métricas
* barra de uso do plano
* página settings com planos
* botão upgrade

---

# 🎨 UI

* Tailwind
* design clean SaaS
* botões vermelhos (#E53935)
* cards com sombra leve

---

# 🔍 SEO

* páginas públicas indexáveis
* meta dinâmico
* Open Graph
* schema Vehicle
* sitemap automático

---

# ⚡ PERFORMANCE

* index por tenant_id
* cache páginas públicas

---

# 🔐 SEGURANÇA

* validar tenant em todas queries
* RLS obrigatório

---

# 🔄 INTEGRAÇÃO FRONT ↔ BACK

Frontend:

* fetch API Go
* usar server actions quando possível

Backend:

* validar JWT
* extrair tenant_id

---

# 📤 ENTREGA ESPERADA

Gerar:

1. SQL completo
2. Backend Go completo
3. Middleware multi-tenant
4. Frontend Next.js completo
5. Componentes UI
6. Sistema de planos funcional
7. Sistema de onboarding
8. Sistema de alertas
9. Integração completa

---

# 🚫 NÃO FAZER

* pseudocódigo
* explicações longas
* abstrações genéricas

---

# 🎯 OBJETIVO FINAL

Gerar um sistema SaaS funcional, pronto para rodar, com:

* multi-tenant real
* monetização embutida
* onboarding otimizado
* foco em conversão

---

Pense como:
Shopify + HubSpot + OLX

Simples. Escalável. Pronto para produção.
