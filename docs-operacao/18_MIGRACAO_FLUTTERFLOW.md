# 18 — MIGRAÇÃO PARA FLUTTERFLOW

> **⚠ CANCELADO em 22/05/2026.** A migração para FlutterFlow foi descartada.
> Ver decisão D12 em `21_DECISOES_TECNICAS.md`.
> Este documento e `FLUTTERFLOW_MIGRATION.md` na raiz são obsoletos.
> O frontend Next.js continua sendo o stack oficial.

---

*(Conteúdo arquivado abaixo para referência histórica — não executar)*

---

---

## Objetivo

Migrar o frontend Next.js para FlutterFlow **sem reconstruir** o backend Go, banco Supabase nem integrações.

O que **continua intacto:**
- Backend Go REST API
- Banco Supabase PostgreSQL
- Asaas (billing)
- Evolution API (WhatsApp)
- OpenRouter (IA)
- Nginx, Docker, CI/CD
- Webhooks

---

## O Que Muda

| Componente | Antes | Depois |
|---|---|---|
| Frontend | Next.js 16 SSR | FlutterFlow (Flutter Web/Mobile) |
| Hosting frontend | Coolify (self-hosted) | FlutterFlow Cloud ou self-hosted |
| SEO vitrine pública | Excelente (SSR) | Limitado (Flutter Web) |
| App mobile | Não existe | iOS + Android nativos |

---

## Autenticação no FlutterFlow

FlutterFlow suporta Supabase Auth nativamente.

**Configuração:**
1. FlutterFlow → Settings → Supabase → inserir URL e anon key
2. Auth flows suportados: e-mail/senha, magic link, OAuth

**JWT para o backend Go:**
```dart
// Pegar token do Supabase
final session = Supabase.instance.client.auth.currentSession;
final token = session?.accessToken;

// Enviar no header
'Authorization': 'Bearer $token'
```

O backend Go valida o mesmo JWT que o Next.js usa — sem alteração necessária.

---

## Chamadas ao Backend (REST API)

Todas as rotas em `08_API_ROTAS_REAIS.md` funcionam no FlutterFlow via Custom Action.

Padrão:
```dart
final response = await http.get(
  Uri.parse('https://api.revendaclick.com.br/api/vehicles'),
  headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  },
);
```

---

## Acesso ao Supabase (Tabelas com RLS)

FlutterFlow pode acessar tabelas Supabase diretamente — o RLS garante isolamento.

Para tabelas com `tenant_id`:
- RLS usa `auth.jwt() ->> 'tenant_id'` da sessão Supabase
- O FlutterFlow precisa manter a sessão ativa (Supabase SDK cuida disso automaticamente)

---

## Rotas Públicas (Sem Autenticação)

```
GET /api/public/:slug/              → dados da loja
GET /api/public/:slug/vehicles      → veículos disponíveis
GET /api/public/:slug/vehicles/:v   → veículo específico
POST /api/public/:slug/leads        → formulário de contato
GET /api/plans                      → lista de planos
```

**Atenção:** Não enviar header `Authorization` nessas rotas.

---

## Plano de Migração por Fases (8 Semanas)

### Fase 1 — Auth + Onboarding (Semana 1)
- Login, Registro, Forgot Password, Reset Password
- Callback Auth (`/auth/callback` → FlutterFlow deep link)
- Onboarding wizard (nome loja, slug, WhatsApp)
- **API:** `POST /api/onboarding/setup`

### Fase 2 — Dashboard + Layout (Semana 1-2)
- Layout base com menu lateral
- Dashboard com KPIs
- **APIs:** `GET /api/usage`, `GET /api/analytics/summary`, `GET /api/billing/subscription`

### Fase 3 — Veículos (Semana 2-3)
- Listagem com filtros (status, marca, condição, preço)
- Formulário criar/editar veículo
- Upload de fotos → Supabase Storage
- **APIs:** CRUD `/api/vehicles`, `/api/public/:slug/vehicles`

### Fase 4 — Leads (Semana 3)
- Lista de leads com filtros por status
- Detalhes do lead com histórico de atividades
- Kanban (opcional — pode usar lista com seletor de status)
- **APIs:** CRUD `/api/leads`, `/api/leads/:id/activities`, `/api/leads/follow-ups`

### Fase 5 — Clientes e Vendas (Semana 4)
- Cadastro de clientes
- Registro de vendas, completar, cancelar
- **APIs:** CRUD `/api/customers`, CRUD `/api/sales`, `POST /api/sales/:id/complete`

### Fase 6 — Financeiro (Semana 5)
- Lançamentos financeiros
- Fluxo de caixa (gráfico via Custom Widget `fl_chart`)
- Comissões de vendedores
- **APIs:** `/api/financial/entries`, `/api/financial/cash-flow`, `/api/commissions`

### Fase 7 — Equipe e Configurações (Semana 5-6)
- Gerenciar vendedores
- Configurações da loja
- **APIs:** CRUD `/api/users`, `GET/PUT /api/tenants/me`

### Fase 8 — Billing (Semana 6)
- Status da assinatura, próxima renovação
- Comparativo de planos + upgrade
- Histórico de faturas
- **APIs:** `/api/billing/*`

### Fase 9 — WhatsApp (Semana 7)
- Painel de conexão com QR code (`qr_flutter` package)
- **APIs:** `/api/evolution/*`

### Fase 10 — Vitrine Pública (Semana 7-8)
- Homepage da loja (rotas públicas)
- Página do veículo com formulário de contato
- **APIs:** `/api/public/:slug/*`
- **Atenção:** SEO será menor que no Next.js — considerar manter Next.js para vitrine pública

### Fase 11 — Analytics e IA (Semana 8)
- Métricas avançadas (verificar plano antes de exibir)
- Sugestão de resposta IA
- **APIs:** `/api/analytics/summary`, `/api/ai/*`

---

## Custom Widgets Necessários

| Funcionalidade | Package sugerido |
|---|---|
| Kanban drag-and-drop | Custom Widget |
| Gráficos linha/barra | `fl_chart` |
| QR Code WhatsApp | `qr_flutter` |
| Seletores FIPE encadeados | Custom Widget |

---

## Estratégia de Transição Gradual

1. Publicar app FlutterFlow em paralelo com Next.js
2. Usar o mesmo backend Go para ambos simultaneamente
3. Migrar uma tela por vez
4. Quando 100% das telas estiverem no FlutterFlow → deprecar Next.js

---

## Pontos de Atenção

| Item | Detalhe |
|---|---|
| SEO vitrine pública | Next.js gera HTML server-side (ótimo para Google). Flutter Web não. Considerar manter Next.js só para `/` e `/:slug/*` |
| `tenant_id` no JWT | FlutterFlow precisa passar o Bearer token do Supabase em toda chamada ao backend Go |
| Subscription gate | Frontend deve verificar `is_blocked` e redirecionar para billing |
| Plan gate | Verificar plano antes de exibir menu Analytics |
| Upload de fotos | Usar Supabase Storage SDK — funciona nativamente no FlutterFlow |
| Rollback | Next.js continua funcionando enquanto migração não é concluída |

---

## Documento de Referência Completo

O arquivo `FLUTTERFLOW_MIGRATION.md` na raiz do projeto (1.237 linhas) contém:
- Todas as 25 telas com screenshots descritivos
- Todos os campos de cada formulário
- Todas as APIs por tela
- Estrutura completa do Supabase
- Cronograma semana a semana
- Configuração de autenticação passo a passo
