# FC038 — ESLint: 13 erros acumulados pós-implementação Super Admin

**Data:** 08/06/2026
**Sessão:** 46
**Severidade:** Baixa (não afetava runtime; apenas qualidade de código e conformidade Next.js)
**Commit:** `4ff2d3e`

---

## Problema

Após a implementação das 8 páginas do Super Admin (commit `ad87d37`, sessão 45), o comando `npm run lint` retornava 13 erros e 4 warnings. Os erros impediam uma auditoria limpa de qualidade de código, embora não causassem falha de build nem erro em runtime.

---

## Erros Encontrados

### 1. `<a>` interno em vez de `<Link>` (5 ocorrências)

**Regra:** `@next/next/no-html-link-for-pages`

| Arquivo | Linha | Href |
|---|---|---|
| `app/(dashboard)/settings/_components/SettingsTabs.tsx` | 708 | `/whatsapp` |
| `app/(dashboard)/settings/_components/SettingsTabs.tsx` | 717 | `/billing/addons` |
| `app/(dashboard)/settings/_components/SettingsTabs.tsx` | 842 | `/settings?tab=store` |
| `app/(dashboard)/billing/plans/_components/PlanCard.tsx` | 287 | `/settings?tab=store` |
| `app/onboarding/page.tsx` | 214 | `/terms` |

**Causa raiz:** Componentes implementados usando `<a href>` HTML nativo para navegação interna no Next.js. O Next.js exige `<Link href>` para navegação client-side com prefetch e sem reload completo.

**Correção:** Substituir `<a href="...">` por `<Link href="...">` em todos os casos. Adicionar `import Link from 'next/link'` nos arquivos que não tinham o import (`PlanCard.tsx`, `onboarding/page.tsx`).

**Prevenção:** Revisar novos componentes em client-component com links internos. ESLint já detecta automaticamente — basta executar `npm run lint` antes de commitar.

---

### 2. `Date.now()` em server component (1 ocorrência)

**Regra:** `react-hooks/purity` (linha 49, coluna 32)

**Arquivo:** `app/(admin)/admin/leads/page.tsx`

**Causa raiz:** A regra `react-hooks/purity` flageia chamadas a funções "impuras" (`Date.now()`, `Math.random()`) dentro de funções de componente React. Em componentes cliente isso seria um problema real (valor diferente a cada render). Porém, este é um **server component assíncrono** que roda uma única vez por request — não há ciclo de render do React. O flag é um falso positivo da regra.

**Correção:** Adicionar `// eslint-disable-next-line react-hooks/purity` antes da linha. A lógica permanece idêntica e correta.

**Prevenção:** Em server components, `Date.now()` é seguro. Suprimir a regra com comentário documentando a razão.

---

### 3. Entidades não escapadas (2 ocorrências)

**Regra:** `react/no-unescaped-entities`

**Arquivo:** `app/privacidade/page.tsx`, linha 374

**Causa raiz:** Texto JSX continha `"Exclusão de Dados"` com aspas duplas literais dentro de um elemento `<strong>`. O linter exige que `"` seja escapado como `&quot;` em texto JSX.

**Correção:** Substituir `"Exclusão de Dados"` por `&quot;Exclusão de Dados&quot;`.

**Prevenção:** Usar `&quot;` para aspas em texto JSX, ou `{'texto "entre aspas"'}`.

---

### 4. eslint-disable não utilizados (2 ocorrências)

**Regra:** `eslint/no-unused-disable-directives`

| Arquivo | Diretiva |
|---|---|
| `app/api/auth/check-email/route.ts` (linha 19) | `// eslint-disable-next-line @typescript-eslint/no-explicit-any` |
| `lib/marketing/events.ts` (linha 1) | `/* eslint-disable @typescript-eslint/no-explicit-any */` |

**Causa raiz:** Diretivas de supressão do `@typescript-eslint/no-explicit-any` foram adicionadas em versões anteriores. Com a evolução das configurações TypeScript/ESLint, a regra `no-explicit-any` deixou de disparar nesses locais, tornando os comentários de supressão obsoletos.

**Correção:** Remover os comentários `eslint-disable` não utilizados.

**Prevenção:** Executar `npm run lint` regularmente para detectar diretivas obsoletas.

---

### 5. Comentário obsoleto (nomenclatura)

**Arquivo:** `frontend/components/layout/DashboardShell.tsx`

**Causa raiz:** Comentário `// Pro+ items — visible when has_crm = true (Pro, Performance, Scale)` usava "Performance" que era o nome interno do plano 3 antes da migration 026. A migration 026 (sessão 25) renomeou definitivamente para "Premium".

**Correção:** Substituir `"Performance"` por `"Premium"` no comentário.

**Prevenção:** Ao executar migrations de renomeação, buscar referências ao nome antigo em comentários (`grep -r "Performance" frontend/`).

---

## Resultado Final

| Métrica | Antes | Depois |
|---|---|---|
| ESLint erros | 13 | **0** |
| ESLint warnings | 4 | **2** (padrão intencional) |
| TypeScript erros | 0 | 0 |
| Build Next.js | limpo | limpo |

**Warnings remanescentes (intencionais):**
- `DashboardShell.tsx:184` — `useEffect(() => { setMobileOpen(false) }, [pathname])` — padrão para fechar sidebar mobile na navegação. Correto e intencional; regra `react-hooks/set-state-in-effect` é overly strict para este caso de uso.
- `AdminShell.tsx:160` — mesmo padrão.
