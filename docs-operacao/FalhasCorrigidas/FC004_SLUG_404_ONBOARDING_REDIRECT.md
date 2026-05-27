# FC004 — Slug 404 / Redirect onboarding após confirmação de email

## Data

2026-05-21

## Severidade

ALTA

## Sintoma

Após confirmar o email de registro, o usuário era redirecionado para uma URL incorreta ou recebia 404. Em alguns casos, o fluxo de confirmação não redirecionava para `/onboarding` — o usuário ficava na tela de confirmação sem avançar para o cadastro da loja.

## Contexto

Fluxo de registro de 2 etapas:
1. Usuário preenche email + senha → `signUp()` → email de confirmação enviado
2. Clica no link do email → deve ir para `/auth/callback` → `/onboarding`

O problema ocorria na transição entre etapa 1 e etapa 2, ou quando a confirmação de email estava desabilitada no Supabase.

## Causa Raiz

**Causa 1 — `emailRedirectTo` não configurado no `signUp`:**
O `signUp` não passava `emailRedirectTo`, então o Supabase usava o redirect padrão (geralmente `localhost:3000` ou a URL de origem). Em produção, isso gerava um redirect para URL errada → 404.

**Causa 2 — Lógica de redirect sem checar se confirmação estava desabilitada:**
Quando o Supabase tem confirmação de email desabilitada (`Email Confirm` = OFF), o usuário é autenticado imediatamente. Mas o frontend aguardava o flow de confirmação → ficava parado na tela de "verifique seu email" sem avançar.

**Causa 3 — Formulário de registro com 2 campos (loja + email):**
O formulário original coletava informações da loja junto com email/senha. Se o onboarding falhava, o usuário precisava refazer tudo. Simplificado para coletar apenas email/senha no registro.

## Arquivos Afetados

- `frontend/app/(auth)/register/` — formulário e ação de registro
- `frontend/app/auth/callback/` — handler de callback
- `frontend/app/onboarding/` — página de onboarding

## Banco/Migrations

Nenhuma migration.

## Correção Aplicada

**Fix 1 — `emailRedirectTo` explícito no signUp:**

```typescript
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  },
})
```

**Fix 2 — Redirect imediato quando confirmação está desabilitada:**

```typescript
// Se confirmação de email desabilitada, Supabase retorna sessão imediatamente
const { data: { session } } = await supabase.auth.getSession()
if (session) {
  redirect('/onboarding')  // pular tela de "verifique seu email"
}
```

**Fix 3 — Registro simplificado (apenas conta):**
Formulário de registro reduzido a email + senha. Configuração da loja (nome, telefone, etc.) movida para `/onboarding` após confirmação de email.

## Commit(s)

- `4e76ced2e7e75c13ba01182c023a181394b2e091` — fix: simplify register to account-only
- `9f3b7e0718acd0988146de11e6566a48f74c93c8` — fix: add emailRedirectTo in signUp
- `de7c02b294355fff1cfe5ec9281e1b5f9c6faeb2` — fix: redirect to /onboarding immediately when email confirmation disabled

## Como Validar

```bash
# 1. Testar registro com email novo
# https://app.revendaclick.com.br/register
# → Preencher email + senha
# → Deve mostrar "verifique seu email" OU redirecionar para /onboarding
#    (dependendo da configuração de confirmação no Supabase)

# 2. Se confirmação habilitada: clicar no link do email
# → Deve redirecionar para /auth/callback
# → Depois para /onboarding (sem 404)

# 3. Verificar no Supabase Dashboard > Authentication > Settings
# se "Email Confirm" está ON ou OFF — comportamento muda
```

## Resultado Final

Fluxo de registro funciona para ambos os casos (confirmação habilitada e desabilitada). Sem 404 no redirect de confirmação.

## Risco de Regressão

**BAIXO.** `emailRedirectTo` fixado com `NEXT_PUBLIC_APP_URL`. Se a URL da aplicação mudar, atualizar a variável de ambiente no Vercel e re-validar o flow.

## Prevenção Futura

1. Sempre passar `emailRedirectTo` explícito no `signUp` — nunca confiar no default do Supabase.
2. Testar o flow completo de registro (com email real ou tool de teste) em staging antes de cada deploy que toque em auth.
3. Verificar se Supabase tem "Email Confirm" habilitado ou não — o código deve lidar com ambos.
