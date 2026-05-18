# REVENDACLICK — PROJECT CONTEXT

## PROJECT

Name:
RevendaClick

Positioning:
“A plataforma que acelera sua revenda”

Goal:
Build a scalable automotive multi-tenant SaaS platform for vehicle dealerships.

---

# CORE STACK

## Frontend
- Next.js 16
- React
- TailwindCSS
- SSR
- App Router
- Server Components

## Backend
- Go (Golang)
- REST API
- Clean Architecture

## Database
- Supabase
- PostgreSQL
- Auth
- RLS mandatory

## Infrastructure
- VPS Hostinger
- Docker
- Docker Compose V2
- Coolify
- Nginx
- SSL

## Integrations
- OpenRouter
- Evolution API
- Asaas

---

# ARCHITECTURE

Mandatory:
- real multi-tenant architecture
- tenant_id in every business table
- RLS enabled in all tables
- SSR compatible
- SEO-oriented public pages
- production-ready code
- modular architecture
- scalable architecture
- Docker-first architecture
- self-hosted infrastructure

Forbidden:
- SQLite
- Firebase
- Railway
- Vercel
- mock implementations
- placeholder implementations
- fake data
- temporary solutions
- bypassing RLS
- removing Supabase
- removing PostgreSQL

---

# PROJECT STRUCTURE

Root:
- /frontend
- /backend
- /database
- /infra

Frontend:
- Next.js App Router
- proxy.ts
- Tailwind
- SSR

Backend:
- internal/
- modular services
- repository pattern
- middleware separation

Database:
- migrations
- policies
- seeds
- indexes

Infrastructure:
- docker-compose.yml
- docker-compose.prod.yml
- nginx/
- coolify/
- github actions

---

# NEXT.JS RULES

Project uses:
- Next.js 16
- async cookies()
- async params
- App Router only
- proxy.ts instead of middleware.ts

Important:
- do not use cookies() inside unstable_cache
- params must be awaited
- preserve SSR compatibility
- standalone runtime mandatory

---

# SUPABASE SSR RULES

Mandatory:
- use @supabase/ssr
- cookies() must be async
- cookie adapter must contain:
  - get
  - set
  - remove

Never:
- remove set/remove from cookie adapter
- use deprecated auth helpers

---

# MULTI-TENANT RULES

Requirements:
- tenant isolation everywhere
- tenant-aware APIs
- tenant-aware frontend
- tenant-aware SSR
- slug-based public routing
- tenant validation in all queries

All business tables must contain:
- id
- tenant_id
- created_at
- updated_at

Mandatory:
- RLS enabled
- JWT tenant validation
- tenant middleware
- tenant-aware services

Never:
- expose cross-tenant data
- bypass tenant validation
- trust frontend tenant values

---

# BACKEND RULES

Architecture:
- Clean Architecture
- service layer
- repository layer
- DTO separation
- middleware separation

Requirements:
- JWT validation
- tenant validation
- scalable modules
- Docker-ready
- production-ready logging
- healthcheck endpoints

Mandatory:
- validate request payloads
- isolate business logic
- preserve modularity

---

# DATABASE RULES

Requirements:
- PostgreSQL only
- RLS enabled
- indexes optimized
- foreign keys enforced
- auditability
- tenant-safe queries

Default pattern:
tenant_id = auth.jwt() ->> 'tenant_id'

Mandatory:
- migration-based changes
- indexed tenant_id
- timestamps everywhere

Never:
- disable RLS
- query without tenant scope
- use unsafe policies

---

# FRONTEND RULES

Requirements:
- SSR compatible
- SEO optimized
- responsive UI
- scalable components
- clean SaaS design
- reusable components

Design:
- TailwindCSS
- clean dashboard UI
- red primary color (#E53935)

Mandatory:
- server-first approach
- App Router patterns
- loading.tsx when needed
- error.tsx when needed

Never:
- break SSR
- move logic unnecessarily to client
- create giant components

---

# SECURITY RULES

Always:
- validate tenant_id
- validate JWT
- enforce RLS
- isolate tenant data
- sanitize inputs
- validate permissions

Never:
- bypass tenant validation
- expose cross-tenant data
- trust client-only validation

Mandatory:
- secure headers
- HTTPS
- rate limiting ready
- environment isolation

---

# DEVOPS RULES

Infrastructure:
- Dockerized services
- Coolify deployment
- Nginx reverse proxy
- SSL mandatory

Repository:
- keep repository clean
- ignore node_modules
- ignore .next
- ignore build artifacts
- ignore .env files

Mandatory:
- healthchecks
- restart unless-stopped
- isolated docker networks
- production-safe containers

Never:
- expose unnecessary ports
- use development containers in production
- commit secrets

---

# DOCKER RULES

Mandatory:
- always use Docker Compose V2
- always use `docker compose`
- never use legacy `docker-compose`

Production requirements:
- healthchecks mandatory
- restart unless-stopped
- isolated docker network
- nginx reverse proxy
- standalone frontend runtime

Validation commands:
- docker compose build
- docker compose up -d
- docker compose ps
- docker compose logs

Never:
- use deprecated compose syntax
- expose internal services publicly

---

# NGINX RULES

Mandatory:
- reverse proxy
- gzip enabled
- websocket support
- security headers
- HTTPS redirect

Production:
- proxy buffering optimized
- SSR compatible routing
- API reverse proxy isolation

---

# CI/CD RULES

Mandatory:
- GitHub Actions
- containerized builds
- production validation before deploy
- image versioning
- rollback-ready deployments

Workflow:
1. validate
2. build
3. push image
4. deploy
5. validate runtime

Never:
- deploy without validation
- overwrite production blindly

---

# CLAUDE CODE EXECUTION RULES

Always:
- validate real builds
- validate runtime after changes
- execute docker compose after infra modifications
- validate healthchecks
- validate imports
- validate TypeScript
- validate Go build
- validate networking
- validate nginx configuration
- validate environment variables

Never:
- stop after generating files
- assume code works without execution
- finish tasks without runtime validation
- leave broken containers
- leave failing builds
- leave unresolved lint errors

Mandatory after implementation:
1. build
2. runtime validation
3. healthcheck validation
4. container validation
5. final operational summary

---

# RESPONSE RULES

Always:
- generate real code
- generate complete files
- provide exact file paths
- provide exact commands
- implementation-first responses
- concise responses
- preserve architecture

Avoid:
- long explanations
- pseudo code
- giant responses
- unnecessary abstractions
- repeated context

Never:
- provide partial implementations
- omit critical files
- generate fake integrations

---

# EXECUTION STRATEGY

Preferred execution:
- work in isolated blocks
- complete one infrastructure layer at a time
- validate before continuing
- avoid giant multi-feature implementations

Recommended flow:
1. infrastructure
2. deployment
3. authentication
4. multi-tenant
5. integrations
6. onboarding
7. billing
8. observability

Always:
- prefer iterative implementation
- preserve architecture stability
- preserve production compatibility

---

# WORKFLOW RULES

Preferred workflow:
1. small scoped tasks
2. isolated implementation
3. validate
4. commit
5. start new session

Avoid:
- giant prompts
- giant sessions
- multiple unrelated tasks
- context accumulation

Mandatory:
- restart sessions after major blocks
- preserve clean context
- avoid token explosion

---

# VALIDATION CHECKLIST

Before finishing any task validate:

- build success
- runtime success
- docker status
- healthchecks
- TypeScript
- Go compilation
- nginx config
- environment variables
- SSR functionality
- tenant isolation
- API responses

---

# CURRENT OFFICIAL STATUS

Operational:
- full-stack runtime — Next.js 15 SSR + Go backend
- PostgreSQL Supabase + PgBouncer
- Docker Compose V2 (dev + prod)
- nginx reverse proxy com gzip, rate limiting, security headers
- standalone frontend runtime (outputFileTracingRoot configurado)
- multi-tenant RLS completo
- CI/CD GitHub Actions → GHCR → Coolify webhook
- Evolution API integrada (webhook receiver + lead sync por WhatsApp)
- OpenRouter AI integrado (classify lead, suggest reply)
- Módulos: leads, CRM, Kanban, vehicles, customers, financial, sales, analytics
- Register flow de 2 etapas (Supabase Auth + setupTenant)
- Página pública de veículo com schema.org + Open Graph + SEO
- Settings (loja, equipe, plano)
- Vendors (gestão de equipe)
- Onboarding completo
- Domínios: revendaclick.com.br / api.revendaclick.com.br / evolution.revendaclick.com.br

---

# OFFICIAL NEXT PHASES

1. ~~GitHub clean repository~~ (CI/CD pronto)
2. ~~VPS Hostinger~~ (contratada)
3. ~~Production Docker~~ (docker-compose.prod.yml pronto)
4. ~~Coolify~~ (instalado, labels configuradas)
5. ~~Domain~~ (DNS apontado)
6. SSL via Coolify (automático com Let's Encrypt)
7. ~~CI/CD~~ (GitHub Actions configurado)
8. ~~Evolution API~~ (integrada)
9. ~~Multi-tenant authentication~~ (Supabase SSR completo)
10. ~~SaaS onboarding~~ (implementado)
11. Asaas billing (webhook receiver + subscription gate)
12. Observability (logs, Sentry, métricas)
13. Performance optimization
14. Security hardening
15. Production launch

---

# MAIN OBJECTIVE

Build a production-grade automotive SaaS platform combining:
- ERP
- CRM
- Marketplace
- Lead generation
- WhatsApp automation
- Financial management
- AI integration
- SEO public pages
- Subscription billing

Focus:
- scalability
- performance
- monetization
- tenant isolation
- conversion
- operational efficiency
- production stability
