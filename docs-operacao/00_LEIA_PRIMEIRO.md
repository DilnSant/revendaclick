# 00 — LEIA PRIMEIRO

> Para quem não é desenvolvedor.
> Explica o que é o RevendaClick, onde fica cada coisa e como tudo se conecta.

---

## O que é o RevendaClick?

É uma plataforma SaaS (software por assinatura) para **revendas de veículos**.

Cada cliente (revenda) tem sua própria conta isolada com:
- Vitrine pública de veículos na internet
- CRM de leads (clientes interessados)
- Controle financeiro e de vendas
- Integração com WhatsApp
- Painel administrativo completo

---

## Onde fica cada parte do sistema?

### 1. O site/aplicativo que o usuário vê (Frontend)

**Tecnologia:** Next.js (JavaScript/TypeScript)
**Pasta:** `/frontend/`
**URL em produção:** `https://revendaclick.com.br` / `https://app.revendaclick.com.br`
**Hospedagem:** Coolify (no mesmo VPS)

O que está aqui:
- Tela de login, registro, onboarding
- Dashboard do cliente (leads, veículos, financeiro, etc.)
- Vitrine pública da revenda (página com o slug: `revendaclick.com.br/nome-da-revenda`)
- Comunicação com o backend

**Para editar tela/visual:** mexer em `/frontend/app/` ou `/frontend/components/`

---

### 2. O servidor que processa tudo (Backend)

**Tecnologia:** Go (Golang) com framework Gin
**Pasta:** `/backend/`
**URL em produção:** `https://api.revendaclick.com.br`
**Hospedagem:** Docker no VPS Hostinger

O que está aqui:
- Todas as regras de negócio
- Validação de autenticação (JWT)
- Isolamento de dados por cliente (tenant)
- Integração com Asaas (pagamentos)
- Integração com Evolution API (WhatsApp)
- Integração com OpenRouter (IA)
- Métricas de sistema (Prometheus)

**Para editar uma regra de negócio:** mexer em `/backend/internal/<módulo>/service.go`
**Para editar uma rota da API:** mexer em `/backend/internal/server/server.go`

---

### 3. O banco de dados (Supabase/PostgreSQL)

**Tecnologia:** PostgreSQL hospedado no Supabase Cloud
**Pasta de migrações:** `/database/migrations/`
**Gerenciador:** Supabase (painel em supabase.com)

O que está aqui:
- Todos os dados: tenants, veículos, leads, usuários, finanças
- Autenticação (Supabase Auth gerencia senhas e sessões)
- Armazenamento de fotos (Supabase Storage)
- Políticas de segurança (RLS — cada cliente só vê seus dados)

**Para ver/editar dados:** Supabase Dashboard → Table Editor
**Para mudar estrutura do banco:** criar migration em `/database/migrations/`
**NUNCA editar banco diretamente em produção sem migration.**

---

### 4. O pagamento (Billing — Asaas)

**Tecnologia:** Asaas (gateway de pagamento brasileiro)
**Pasta:** `/backend/internal/billing/`
**Frontend:** `/frontend/app/(dashboard)/billing/`

O que está aqui:
- Planos: Starter (R$97), Pro (R$197), Premium (R$397), Enterprise (R$797)
- Cada cliente tem uma assinatura
- Asaas cobra automaticamente e avisa via webhook
- Sistema bloqueia acesso se assinatura vence e não renova (após 3 dias de grace)

**Para mudar preço dos planos:** editar tabela `plans` no banco de dados
**Para testar billing:** usar `ASAAS_ENV=sandbox` e contas de teste da Asaas

---

### 5. O WhatsApp (Evolution API)

**Tecnologia:** Evolution API (self-hosted)
**Pasta backend:** `/backend/internal/evolution/`
**Frontend:** `/frontend/app/(dashboard)/whatsapp/`
**URL em produção:** `https://evolution.revendaclick.com.br`
**Hospedagem:** Docker no mesmo VPS

O que está aqui:
- Cada revenda escaneia QR code para conectar seu WhatsApp
- Quando o WhatsApp da revenda recebe mensagem → Evolution API → backend → cria/atualiza lead
- Vendedor pode enviar mensagem pelo painel
- IA classifica o lead automaticamente (OpenRouter)

**Para resetar conexão WhatsApp:** `/whatsapp` no painel → Desconectar → Reconectar

---

### 6. A autenticação (Supabase Auth)

**Tecnologia:** Supabase Auth (JWT)
**Pasta frontend:** `/frontend/lib/supabaseServer.ts`, `/frontend/middleware.ts`
**Pasta backend:** `/backend/internal/middleware/auth.go`

O que está aqui:
- Login e senha gerenciados pelo Supabase
- Após login, o sistema gera um "token" (JWT) que prova quem é o usuário
- Esse token carrega: ID do usuário, ID da revenda (tenant), cargo (owner/admin/seller)
- O backend valida esse token em TODA request

**Para resetar senha de um usuário:** Supabase Dashboard → Authentication → Users

---

### 7. O servidor VPS (Infraestrutura)

**Provedor:** Hostinger
**Sistema:** Linux Ubuntu
**Orquestração:** Docker Compose V2
**Proxy:** Nginx (redireciona domínios para serviços internos)
**SSL:** Let's Encrypt (certificado grátis, renova automático)

**Para ver status dos serviços:** `docker compose ps` no VPS
**Para ver logs:** `docker compose logs backend --tail=100`

---

### 8. O deploy automático (CI/CD)

**Tecnologia:** GitHub Actions
**Arquivo:** `.github/workflows/ci.yml`

O que acontece quando alguém faz `git push main`:
1. Roda testes automáticos
2. Compila e empacota o backend em imagem Docker
3. Envia imagem para GHCR (registro de imagens do GitHub)
4. Runner no VPS baixa a nova imagem e reinicia o serviço
5. Valida se está funcionando (smoke test)

**Para ver status do último deploy:** GitHub → Actions → CI/CD

---

## Onde editar cada coisa

| O que quero mudar | Onde mexer |
|---|---|
| Tela de login | `frontend/app/login/page.tsx` |
| Tela de dashboard | `frontend/app/(dashboard)/dashboard/page.tsx` |
| Vitrine pública | `frontend/app/(public)/[slug]/page.tsx` |
| Regra de negócio de leads | `backend/internal/leads/service.go` |
| Tabela do banco | `database/migrations/00X_nome.sql` |
| Planos e preços | Tabela `plans` no Supabase Dashboard |
| Configuração de email | Supabase Dashboard → Auth → Settings |
| Domínios | Nginx config + DNS do provedor |
| Variáveis de ambiente | `.env` no VPS `/opt/revendaclick/.env` |
| Dados de um cliente específico | Supabase Dashboard → Table Editor |

---

## Regras fundamentais

1. **Nunca edite dados de produção diretamente** sem entender o impacto
2. **Nunca desative RLS** (Row Level Security) nas tabelas — isso expõe dados de todos os clientes
3. **Sempre crie migrations** para mudar estrutura do banco (nunca altere colunas direto)
4. **Nunca commite arquivos `.env`** no Git — eles contêm senhas
5. **O branch `main` vai direto para produção** — nunca faça push de código quebrado

---

## Status atual (2026-05-22)

O sistema está **em produção** com:
- Frontend Next.js (Coolify)
- Backend Go (Docker no VPS)
- Evolution API (Docker no VPS)
- Supabase Cloud (externo)
- Asaas (externo — billing)
- Nginx com SSL (VPS)
- CI/CD GitHub Actions → self-hosted runner

Veja detalhes em `23_PROXIMO_PASSO.md`.
