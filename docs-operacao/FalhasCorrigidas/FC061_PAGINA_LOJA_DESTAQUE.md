# FC061 — "Página da Loja" sem destaque: dispersa, escondida e com URL errada

**Sessão:** 60
**Data:** 2026-06-26
**Commit:** (a definir)
**Severidade:** MÉDIA (afeta percepção de valor e conversão da feature pública mais importante do SaaS — a vitrine)

---

## Sintoma

A funcionalidade **"Página da Loja"** (vitrine pública do lojista em `https://app.revendaclick.com.br/{slug}`) era a peça central de geração de leads do produto, mas dentro do sistema do lojista estava:

1. **Escondida na sidebar** — único ponto era um link "Ver loja" (11px) dentro do store-identity panel no sidebar, sem label próprio.
2. **Miniaturizada no dashboard** — `CopyStoreLink` ocupava 1/4 da largura em "Quick links", sem hierarquia visual, abaixo de cash flow e follow-ups.
3. **Bug visual crítico** — `CopyStoreLink.tsx:11` exibia `revendaclick.com.br/${slug}` (domínio raiz errado). A URL pública correta é `https://app.revendaclick.com.br/${slug}`.
4. **Sem CTA de incompletude** — não havia aviso visível quando a loja não estava publicada (faltava `store_contact` configurado); o lojista só descobria pela ausência de leads.
5. **Sem atalho de configuração** — para editar o contato público, o lojista precisava lembrar de ir em `/settings?tab=contact`.
6. **Sem métricas** — não havia nenhum card com "leads gerados pela loja" ou status publicado/não publicado visível ao lojista.

Resultado: lojista subutilizava a feature, não percebia valor, e quando descobria, recebia URL errada para compartilhar.

## Causa Raiz

- **Ausência de rota dedicada** — não existia `/store` (página interna dedicada à gestão da vitrine). O lojista tinha que improvisar entre `/settings?tab=contact`, dashboard e sidebar.
- **Hierarquia visual fraca** — `CopyStoreLink` era um sub-componente de "Quick links" sem identidade própria.
- **Bug de domínio** — copy-paste antigo usava o domínio raiz (`revendaclick.com.br`) ao invés do subdomínio de aplicação (`app.revendaclick.com.br`). Nenhum teste E2E cobriu esse display.
- **Métricas nunca priorizadas** — `StoreMetrics` não existia; rota `/api/leads/follow-ups` existia mas não havia agregação de "leads da loja" nem contagem de visitas.

## Correção Aplicada

### 1. Nova rota dedicada `/store`

Criada página `frontend/app/(dashboard)/store/page.tsx` (Server Component) com:
- Header com título + badge de status (Publicada verde / Não publicada âmbar).
- Botão "Ver Minha Loja" no header (abre `/{slug}` em nova aba).
- Botão "Editar Loja" → `/settings?tab=contact`.
- **CTA condicional âmbar** (Etapa 4): quando `!published`, exibe card `data-testid="store-cta-not-published"` com texto "Sua Página da Loja ainda não está publicada." + botão "Configurar Agora" → `/settings?tab=contact`.
- Sub-componentes:
  - `StoreActions.tsx` (Client) — card de URL pública com botão **Copiar** + **Abrir em nova aba** + **Compartilhar no WhatsApp** (`api.whatsapp.com/send?text=...` com URL pré-preenchida).
  - `StoreMetrics.tsx` (Server) — 3 cards: Status, Leads gerados (do `checklist.received_first_lead` + count real), Origem principal.
- Dicas de divulgação (4 bullets: Instagram, WhatsApp Business bio, base de clientes, link para `/leads`).

### 2. Item dedicado na sidebar (Etapa 2)

`frontend/components/layout/DashboardShell.tsx` — adicionado item em `NAV_BASE` entre **Dashboard** e **Veículos**:

```tsx
{
  href: '/store',
  label: 'Página da Loja',
  icon: <svg /* storefront */ />,
}
```

Mantém a regra "toda feature principal vai para `NAV_BASE`" (visível para todos os planos, igual a Dashboard, Veículos, Interessados).

### 3. Card de destaque no dashboard (Etapa 3 e 5)

Criado `frontend/components/dashboard/StoreCard.tsx` (Client Component) substituindo o obsoleto `CopyStoreLink`:
- Card com gradiente sutil (`from-primary/[0.06]`) e borda `primary/20` para hierarquia visual.
- Ícone de loja em destaque + título "Página da Loja".
- Pill de status absoluta (canto superior direito).
- Linha de URL com botão **Copiar** (`data-testid="store-card-copy"`).
- Botões de ação:
  - **Abrir Loja** (`bg-primary`, principal) — abre `/{slug}` em nova aba (`data-testid="store-card-open"`).
  - **Editar Loja** (secundário) — quando publicada (`data-testid="store-card-edit"`).
  - **Configurar Agora** (âmbar) — quando não publicada (`data-testid="store-card-configure"`).
- Mensagem âmbar inline quando `!published`: "Sua Página da Loja ainda não está publicada. Configure o contato público para aparecer na vitrine."

`CopyStoreLink.tsx` foi **removido** (não era mais importado em lugar nenhum).

### 4. Card lateral no dashboard com atalhos (Etapa 5)

No grid inferior do dashboard (`lg:grid-cols-3`), substituído o antigo bloco "Quick links" simples por:

- **Coluna 2/3:** `<StoreCard slug published />` (novo).
- **Coluna 1/3:**
  - Card "Plano atual" (mantido).
  - Card "Acesso rápido" com 2 botões:
    - **Ver Minha Loja** (`data-testid="dashboard-open-store"`) — abre `/{slug}` em nova aba.
    - **Página da Loja** (`data-testid="dashboard-store-page"`) — link para `/store` (a nova rota).

### 5. Métricas no dashboard (Etapa 6)

Decisão de escopo: **Opção C** — exibir apenas dados que já existem na infra, sem criar nova migration/endpoint.

Métricas disponíveis hoje (sem infra adicional):
- **Status** (publicada/não publicada) — vem de `/api/onboarding` (`checklist.published_store`).
- **Leads gerados** — count real de `/api/leads?limit=500` + flag `checklist.received_first_lead` para "Primeiro lead recebido".
- **Origem principal** — atualmente hardcoded "Vitrine pública" (placeholder honesto: a origem de fato é 100% vitrine hoje, sem tracking de UTM/referrer).

Métricas **deferidas** (requerem nova infra):
- **Visitas da loja** — requer nova tabela `store_visits` + tracking pixel/middleware → **future FC**.
- **Taxa de conversão** — depende de visitas → **future FC**.

Anotação em `landing_page_status.md` (a ser criado) e ticket interno: métricas de tráfego exigem migration + middleware. Estimativa: 1 sessão de meio período.

## Arquivos Alterados

| Tipo | Arquivo |
|---|---|
| Criado | `frontend/app/(dashboard)/store/page.tsx` |
| Criado | `frontend/app/(dashboard)/store/_components/StoreActions.tsx` |
| Criado | `frontend/app/(dashboard)/store/_components/StoreMetrics.tsx` |
| Criado | `frontend/components/dashboard/StoreCard.tsx` |
| Removido | `frontend/components/dashboard/CopyStoreLink.tsx` (substituído por StoreCard) |
| Editado | `frontend/app/(dashboard)/dashboard/page.tsx` (substituição CopyStoreLink → StoreCard + novo card "Acesso rápido") |
| Editado | `frontend/components/layout/DashboardShell.tsx` (item "Página da Loja" entre Dashboard e Veículos) |

## Validação

- **TypeScript:** `cd frontend && npx tsc --noEmit` → exit 0.
- **Inspeção visual (manual):** Next.js 16 renderiza dashboard + `/store` sem warnings.
- **Multi-tenant:** Componente é puramente baseado em `slug` (não toca em `tenant_id` direto); verificação manual ao validar `/store` em tenant **santos-car** (Pro/active) e **sandbox-revendaclick** (Pro/active).
- **Planos:** Página `/store` e `StoreCard` não dependem de feature flags de plano → visíveis para Starter, Pro, Premium e Scale (consistente com o restante de `NAV_BASE`).
- **SEO público:** **Não alterado** — `/store` é rota interna (autenticada, sob `(dashboard)`). URLs públicas `app.revendaclick.com.br/{slug}` permanecem idênticas.
- **Regras de negócio:** **Não alteradas** — `published_store` continua sendo derivado de `tenant.store_contact_configured` (regra existente).

## Não escopo (deferido)

- Tracking de visitas e taxa de conversão (requer migration + middleware) → próximo FC quando houver demanda de produto validada.
- Editor visual da loja (drag-and-drop de seções) → fora do escopo deste FC.
- Preview responsivo dentro de `/store` → fora do escopo (vitrine pública já é responsiva por design).