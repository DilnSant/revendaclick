# FC036 — Página de detalhe do veículo sem injeção de --primary CSS variable

**Área:** Frontend / Branding
**Severidade:** ALTA
**Data:** 04/06/2026
**Sessão:** 40

---

## Sintoma

O botão "Quero este veículo" e demais elementos com `btn-primary` / `text-primary` na página de detalhe do veículo (`/[slug]/[vehicleSlug]`) exibiam sempre a cor padrão da plataforma (#E53935) em vez da cor personalizada do tenant.

Tenants com `theme.primary_color` configurado viam sua cor correta na loja pública (`/[slug]`), mas ao abrir o detalhe de um veículo a cor revertia para o vermelho padrão.

---

## Causa Raiz

**Arquivo:** `frontend/app/(public)/[slug]/[vehicleSlug]/page.tsx`

A loja pública (`[slug]/page.tsx`) injeta a variável CSS `--primary` via:
```tsx
<div style={{ '--primary': primaryChannels } as React.CSSProperties}>
```

A página de detalhe do veículo (`[vehicleSlug]/page.tsx`) não tinha esta injeção. O sistema Tailwind usa `rgb(var(--primary) / α)` para todas as classes `bg-primary`, `text-primary`, `btn-primary`. Sem o override, o valor de `--primary` vem de `globals.css :root` (229 57 53 = #E53935 padrão da plataforma).

---

## Correção

Adicionado em `frontend/app/(public)/[slug]/[vehicleSlug]/page.tsx`:

```tsx
import type React from 'react'

function hexToRgbChannels(hex: string): string | null { ... }

// No VehiclePage:
const primaryChannels = hexToRgbChannels(
  (tenant as { theme?: { primary_color?: string } }).theme?.primary_color ?? '#E53935'
) ?? '229 57 53'

return (
  <div style={{ '--primary': primaryChannels } as React.CSSProperties}>
    ...
  </div>
)
```

**Commit:** `1dc7460`

---

## Prevenção

Toda página pública que usa classes `bg-primary`, `text-primary` ou `btn-primary` DEVE injetar `--primary` com a cor do tenant se o tenant tiver tema customizado. Ao criar novas páginas públicas em `app/(public)/`, verificar se a injeção está presente.

Regra: **toda página em `(public)/` precisa do wrapper `style={{ '--primary': primaryChannels }}`**.
