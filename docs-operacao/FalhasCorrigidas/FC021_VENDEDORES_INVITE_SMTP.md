# FC021 — Vendedores invite — "Error sending invite email" (SMTP rate limit)

## Data

2026-05-25

## Severidade

MÉDIA

## Sintoma

Ao clicar em "Convidar membro" / "Novo vendedor", o sistema retornava:
```
Error sending invite email
```

O convite não era enviado. Nenhum email chegava ao destinatário.

## Contexto

Feature de gestão de equipe (`/vendors` e `/settings` → aba Usuários). Permite que o admin convide novos vendedores para o tenant.

## Causa Raiz

`inviteUserByEmail` da SDK do Supabase depende de **SMTP configurado no Supabase** para enviar o email de convite. O free tier do Supabase tem rate limit severo no envio de emails (por padrão: 2-4 emails por hora). Ao atingir o limite, a chamada falha com "Error sending invite email".

Além disso, mesmo quando o email é enviado com sucesso, se o SMTP do Supabase estiver com problemas ou o email cair em spam, o vendedor não consegue aceitar o convite.

## Arquivos Afetados

- `frontend/app/(dashboard)/vendors/actions.ts` — `inviteVendor` action
- `frontend/app/(dashboard)/vendors/_components/VendorsClient.tsx` — UI de convite
- `frontend/app/(dashboard)/settings/_components/SettingsTabs.tsx` — `UsersTab` com modal de convite

## Banco/Migrations

Nenhuma.

## Correção Aplicada

Substituído `inviteUserByEmail` por `generateLink({ type: 'invite' })`. Gera um link de convite diretamente (sem enviar email) — o admin compartilha o link manualmente via WhatsApp, SMS, etc.

```typescript
// ANTES: dependia de SMTP — falhava com rate limit
const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
  data: { tenant_id: tenantId, role }
})

// DEPOIS: gera link sem enviar email
const { data, error } = await supabaseAdmin.auth.admin.generateLink({
  type: 'invite',
  email,
  options: {
    data: { tenant_id: tenantId, role }
  }
})
// data.properties.action_link — link que o admin compartilha manualmente
```

**UX atualizado:**
- Botão: "Convidar membro" → "Novo vendedor"
- Após gerar o link: modal exibe o link copiável para o admin compartilhar
- Role `Admin` removido do dropdown (apenas Vendedor e Visualizador)
- Cleanup automático do auth user se o backend falhar ao registrar o usuário

## Commit(s)

- `8f053a7cac81167e564e443800a97a43d14a3220` — fix: 5 bugs críticos — vendors invite, billing error, whatsapp status, settings/plan, settings/users

## Como Validar

```bash
# 1. Acessar /vendors ou /settings → Equipe
# 2. Clicar "Novo vendedor"
# 3. Preencher email e role
# 4. Deve exibir o link de convite (não enviar email)
# 5. Copiar o link e abrir em modo anônimo do browser
# 6. Link deve permitir criar senha e completar o registro
# 7. Usuário deve aparecer na lista da equipe do tenant
```

## Resultado Final

Convite funciona independente de SMTP ou rate limit. Admin recebe link e compartilha manualmente. Fluxo mais confiável e rápido.

## Risco de Regressão

**BAIXO.** `generateLink` não depende de email. Risco: se o Supabase desabilitar `generateLink` para o tier free, precisaria de alternativa.

## Prevenção Futura

1. Nunca usar `inviteUserByEmail` em produção com Supabase free tier — rate limit é muito restritivo.
2. Para funcionalidades críticas de auth, preferir `generateLink` + compartilhamento manual.
3. Se no futuro configurar SMTP próprio (SendGrid, Resend, etc.), pode-se considerar reativar `inviteUserByEmail` com email customizado.
