# FC063 — Convite de vendedor redirecionava para login em vez de definir senha

**Área:** Equipe / Auth / Frontend
**Severidade:** ALTA
**Data:** 31/07/2026
**Sessão:** 61

---

## Sintoma

Ao gerar convite para um novo vendedor (`inviteVendor`), o link de convite, ao ser clicado,
redirecionava para a tela de login em vez de uma tela para definir senha. Como o usuário era novo
(sem senha), o login falhava e ele ficava sem conseguir acessar a conta.

Relacionado a FC021 (SMTP rate limit) — mesma área, causa diferente.

## Causa Raiz

**Arquivo:** `frontend/app/auth/callback/route.ts`

`admin.auth.admin.generateLink({type: 'invite', ...})` usa o fluxo implícito do Supabase Auth: após
verificar o token em `/auth/v1/verify`, o GoTrue redireciona para `redirect_to` com os tokens no
**fragmento da URL** (`#access_token=...`), nunca em `?code=`. Fragmento de URL nunca chega ao
servidor (é client-side only). `redirectTo` do convite apontava para `/auth/callback`, uma Next.js
Route Handler **server-side**, que só lê `searchParams.get('code')` (fluxo PKCE). Para convites,
`code` é sempre `null` → `redirect('/login?error=missing_code')`.

`frontend/app/forgot-password/page.tsx` (recuperação de senha) já usava `redirectTo: ${appUrl}/reset-password`
— uma página **client-side** que trata corretamente o fragmento via `supabase.auth.onAuthStateChange`
(eventos `PASSWORD_RECOVERY`/`SIGNED_IN`) — por isso a recuperação de senha nunca teve esse problema.

## Correção Aplicada

**Commit:** `c7d27a6`

`frontend/app/(dashboard)/vendors/actions.ts`, `inviteVendor`:
```ts
// Antes
redirectTo: `${appUrl}/auth/callback`,
// Depois
redirectTo: `${appUrl}/reset-password`,
```

## Como Validar

1. Convidar um vendedor novo (`/vendors` → convidar).
2. Gerar convite via Admin API (ou usar o link retornado pela tela) e seguir o redirect.
3. Confirmar que chega em `/reset-password#access_token=...&type=invite` e que a tela mostra o
   formulário de "Nova senha" (não "Validando link…" travado, não `/login`).

Validado em produção nesta sessão: convite de teste gerado via Admin API, redirect seguido via
curl, usuário de teste removido após validação.

## Prevenção

Todo `redirectTo`/`emailRedirectTo` de fluxo de e-mail do Supabase Auth (invite, recovery,
magic link) deve apontar para uma página **client-side** (`'use client'`), nunca para uma Route
Handler server-side — fragmentos de URL nunca chegam ao servidor.
