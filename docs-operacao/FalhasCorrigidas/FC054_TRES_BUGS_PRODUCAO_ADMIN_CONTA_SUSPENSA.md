# FC054 — Três bugs de produção: /admin/logs 404, reativar assinatura, copiar email suporte

**Sessão:** 56  
**Data:** 2026-06-15  
**Commit:** `4e22465`  
**Severidade:** Alta (2 bugs de fluxo crítico + 1 UX)

---

## Problemas identificados

### PROBLEMA 1 — `/admin/logs` retornava 404

**Causa raiz:** `frontend/app/(admin)/layout.tsx` usava `supabase.auth.getSession()` para validar o role do usuário. `getSession()` lê o JWT em cache no cookie sem validar no servidor Supabase. Se o JWT foi emitido antes do campo `user_role` ser adicionado ao `raw_app_meta_data`, o `app_metadata.user_role` retorna `undefined`. Resultado: super_admin era redirecionado para `/dashboard`. Como `tenant_id = NULL` para super_admin, o dashboard falhava, aparecendo como 404.

**Padrão:** Mesma causa raiz do FC053 (proxy route.ts), mas em arquivo diferente.

**Arquivo corrigido:** `frontend/app/(admin)/layout.tsx`

```typescript
// ANTES (bugado):
const { data: { session } } = await supabase.auth.getSession()
if (!session) redirect('/login')
const role = session.user?.app_metadata?.user_role as string | undefined

// DEPOIS (correto):
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
const role = user.app_metadata?.user_role as string | undefined
```

---

### PROBLEMA 2 — Tenant `finalcar` cancelado sem caminho de reativação

**Causa raiz:** `SubscriptionsTable.tsx` não tinha mecanismo para limpar `canceled_at` ao reativar uma assinatura. Sem `clear_canceled_at: true`, a transição `canceled → active` atualizava o status mas deixava `canceled_at` preenchido, causando inconsistência de estado. Além disso, não havia botão rápido de "Reativar" — o admin precisava abrir o modal de edição e trocar o status manualmente.

**Arquivo corrigido:** `frontend/app/(admin)/admin/subscriptions/_components/SubscriptionsTable.tsx`

Mudanças:
1. **`handleSave`**: adicionado envio automático de `clear_canceled_at: true` sempre que status sai de `canceled` para outro valor
2. **`handleReactivate`**: nova função — define `status: 'active'`, `clear_canceled_at: true`, `current_period_end: +30 dias`
3. **Botão "Reativar"**: exibido na linha quando `row.status === 'canceled'`, substituindo o botão "Cancelar" (que fica invisível para rows canceladas)

O modal de edição com dropdown de status já suportava todas as transições (`active`, `trialing`, `past_due`, `paused`) — nenhuma mudança de backend necessária pois `UpdateSubscriptionRequest.ClearCanceledAt` já existia.

---

### PROBLEMA 3 — `/conta-suspensa` sem forma de copiar email de suporte

**Causa raiz:** O botão "Contato com suporte" abria o cliente de email local (via `mailto:`), o que não funciona em muitos dispositivos corporativos. Não havia forma de copiar o email de suporte para a área de transferência.

**Arquivos criados/alterados:**
- **CRIADO:** `frontend/app/conta-suspensa/_components/SupportContact.tsx` — componente client (`'use client'`) com:
  - Exibição do email `app.revendaclick@gmail.com`
  - Botão "Copiar Email" usando `navigator.clipboard.writeText()`
  - Feedback visual (ícone de check + texto "Email copiado!" por 2 segundos)
  - Fallback textual: "Se o botão não funcionar, envie email diretamente para o endereço acima."
- **ALTERADO:** `frontend/app/conta-suspensa/page.tsx` — import + render `<SupportContact />` entre o botão mailto e o formulário de logout

---

## Validação

- `npx tsc --noEmit` → zero erros
- Commit `4e22465` pushed → Vercel deploy automático disparado
- Rota `/admin/logs` acessível para super_admin após fix do layout.tsx
- Botão "Reativar" visível para `finalcar` (status canceled) na tabela de assinaturas
- `/conta-suspensa` com bloco de email copiável funcional

---

## Regra derivada

**`getUser()` é mandatório em todo código de autenticação server-side.** `getSession()` lê JWT em cache e pode retornar `app_metadata` desatualizado (sem `user_role`). Todos os arquivos de layout, route handlers e middleware devem usar `getUser()` para validar permissões.

Arquivos já corrigidos para `getUser()`:
- `frontend/middleware.ts` (proxy.ts) — FC053
- `frontend/app/api/admin/[...path]/route.ts` — FC053
- `frontend/app/(admin)/layout.tsx` — FC054
