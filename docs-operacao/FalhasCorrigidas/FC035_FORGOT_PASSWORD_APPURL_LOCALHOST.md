# FC035 — forgot-password: appUrl fallback localhost:3000

**Área:** Auth / Frontend
**Severidade:** ALTA
**Data:** 03/06/2026
**Sessão:** 38

---

## Sintoma

Link de recuperação de senha no e-mail apontava para `http://localhost:3000/auth/callback?type=recovery`
em vez de `https://app.revendaclick.com.br/auth/callback?type=recovery`.

O usuário clicava no link e era direcionado para localhost — inacessível em produção.

## Causa Raiz

**Arquivo:** `frontend/app/forgot-password/page.tsx`
**Linha:** 13 (antes da correção)
**Código com bug:**

```tsx
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
```

O fallback hardcoded era `localhost:3000`. Em produção, se `NEXT_PUBLIC_APP_URL` não estivesse configurada
na Vercel, o link de recuperação apontaria para localhost.

O padrão correto já era usado em `register/page.tsx` (linha 35):

```tsx
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
```

`window.location.origin` sempre reflete o domínio real onde o app está rodando.

## Correção Aplicada

**Commit:** `234abe4`

```tsx
// Antes
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// Depois
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
```

## Por que não foi detectado antes

O bug só se manifesta se `NEXT_PUBLIC_APP_URL` não estiver configurada no Vercel.
Com a variável configurada, o fallback nunca é atingido. Com o fallback agora usando
`window.location.origin`, o comportamento é correto em qualquer caso.

## Como Validar

1. Acesse `/forgot-password` em produção
2. Insira um e-mail válido
3. Receba o e-mail de recuperação
4. Verifique que o link aponta para `https://app.revendaclick.com.br/auth/callback?type=recovery`

## Prevenção

Nunca usar strings hardcoded de domínio como fallback em client components.
Padrão obrigatório: `process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin`.
