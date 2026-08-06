# Plano de Testes E2E — RevendaClick

> Plano oficial de testes end-to-end.
> Implementação: `frontend/e2e/` (Playwright)
> Como executar: `frontend/e2e/README.md`

---

## Pré-requisitos para Execução

```bash
cd frontend
npm install
npx playwright install chromium

# Configurar variáveis de ambiente
cp .env.e2e.example .env.e2e
# Editar .env.e2e com credenciais do tenant de teste

# Subir o app
npm run dev

# Em outro terminal: executar testes
npm run test:e2e
```

**Ambientes suportados:**
- Local: `http://localhost:3000` + backend `http://localhost:8080`
- Staging: configurar `E2E_BASE_URL`

**NUNCA executar contra produção** — billing real, dados reais.

---

## Fluxo 1 — Cadastro e Onboarding

**Spec:** `frontend/e2e/01_onboarding.spec.ts`

```
Registro (email + senha)
  ↓
Supabase Auth cria usuário
  ↓
Redirect /auth/callback → /onboarding
  ↓
Preencher: nome da loja, slug, telefone
  ↓
POST /api/onboarding/setup
  → INSERT tenants + users (transação)
  → PUT Supabase app_metadata
  ↓
Redirect /dashboard
  ↓
OnboardingChecklist visível
```

**Pré-requisitos:**
- Supabase Auth com confirmação de e-mail DESABILITADA
- Banco sem tenant com o slug de teste

**Checklist de validação:**
- [ ] Usuário criado no Supabase Auth
- [ ] Tenant criado no banco com slug correto
- [ ] Usuário tem `app_metadata.tenant_id` preenchido
- [ ] `/dashboard` carrega sem erro
- [ ] Widget OnboardingChecklist visível

---

## Fluxo 2 — Billing: Assinatura e Feature Flags

**Spec:** `frontend/e2e/02_billing_subscribe.spec.ts`

```
Login como tenant Starter
  ↓
Sidebar não mostra seção Pro (has_crm=false)
  ↓
/billing exibe sub-nav: Assinatura / Add-ons / Cobranças / Planos
  ↓
/billing/plans exibe 3 planos (Starter, Pro, Premium)
  ↓
Scale oculto do grid público
```

**Pré-requisitos:**
- `E2E_STARTER_EMAIL` configurado com tenant Starter válido

**Checklist de validação:**
- [ ] Nav não mostra "Atendimento" nem "Analytics" para Starter
- [ ] Upgrade prompt "Desbloqueie com Pro" visível
- [ ] BillingSubNav tem 4 tabs corretas
- [ ] 3 cards de plano visíveis; Scale ausente

---

## Fluxo 3 — Upgrade de Plano

**Spec:** `frontend/e2e/03_upgrade_downgrade.spec.ts`

```
Super admin simula SUBSCRIPTION_UPDATED via /api/admin/billing/simulate-event
  ↓
plan_name = 'pro', status = 'active'
  ↓
Tenant loga novamente
  ↓
/api/usage retorna has_crm = true
  ↓
Sidebar exibe seção Pro: Atendimento + Analytics
```

**Pré-requisitos:**
- `E2E_TEST_TENANT_ID` configurado
- Super admin com credenciais configuradas

**Checklist de validação:**
- [ ] simulate-event retorna 200
- [ ] `/api/usage` após evento tem `has_crm: true`
- [ ] Sidebar mostra seção "Pro"
- [ ] `/crm` acessível (não retorna 404)

---

## Fluxo 4 — Downgrade de Plano

**Spec:** `frontend/e2e/03_upgrade_downgrade.spec.ts`

```
Tenant com plano Pro
  ↓
Simulate SUBSCRIPTION_UPDATED → plan_name = 'starter'
  ↓
Tenant loga novamente
  ↓
has_crm = false
  ↓
Sidebar não mostra seção Pro
  ↓
/crm retorna 404
```

**Checklist de validação:**
- [ ] `has_crm` ausente no `/api/usage`
- [ ] Sidebar volta a mostrar upgrade prompt
- [ ] `/crm` retorna 404

---

## Fluxo 5 — Feature Flags Dinâmicos (sidebar)

```
Tenant Starter: não vê seção Pro nem Premium
  ↓
Admin concede has_crm via tenant_features
  ↓
Tenant loga: vê seção Pro
  ↓
Admin revoga has_crm
  ↓
Tenant loga: não vê seção Pro
```

**Validação manual via admin panel (`/admin`):**
- Admin → tenant → "Conceder feature" → has_crm

---

## Fluxo 6 — Sidebar Dinâmica (3 perfis)

| Perfil | Esperado |
|---|---|
| Starter (`santos-car`) | Base + upgrade prompt Pro |
| Pro (`has_crm`) | Base + seção Pro (Atendimento, Analytics) |
| Premium (`has_automation`) | Base + Pro + seção Premium (Automações, Campanhas) |

**Validação manual:** Login com cada perfil no browser.

---

## Fluxo 7 — Central de Atendimento (WhatsApp)

**Spec:** `frontend/e2e/04_whatsapp_addon.spec.ts`

```
Tenant SEM add-on whatsapp_automation:
  → /automations retorna 404 (sem has_automation)
  → Configurações → aba WhatsApp visível
  → Link "Contratar add-on" → /billing/addons

Tenant COM add-on ativo (has_central_atendimento=true):
  → /automations mostra "Abrir Central de Atendimento"
  → /whatsapp carrega QR code
  → Status da instância Evolution visível
```

**Checklist:**
- [ ] Aba WhatsApp em Configurações visível para qualquer plano
- [ ] /whatsapp bloqueado sem `has_central_atendimento`
- [ ] QR code elemento presente quando add-on ativo
- [ ] Evolution API respondendo

---

## Fluxo 8 — WhatsApp da Loja (vitrine pública)

```
Vitrine pública /:slug
  → Botão "WhatsApp" visível (contato público do tenant)
  → Clique → abre wa.me/{telefone}
  → Não confundir com Central de Atendimento (Evolution)
```

**Validação manual:** Acessar `https://app.revendaclick.com.br/santos-car`

---

## Fluxo 9 — Add-ons

```
/billing/addons
  → Lista 3 add-ons: user_extra, whatsapp_automation, ia_recovery
  → Preços: R$20, R$39, R$39
  → Contratar → POST /api/billing/addon
  → Webhook PAYMENT_CONFIRMED → add-on ativo
  → Feature disponível imediatamente
```

**Spec:** Parcialmente em `04_whatsapp_addon.spec.ts` e `05_ia_recovery.spec.ts`

---

## Fluxo 10 — Super Admin

```
Login como dilneysantos.developer@gmail.com
  → Redirect /admin (não /onboarding — tenant_id=NULL)
  → Lista todos os tenants
  → Ações: ativar plano, conceder feature, simulate-event
```

**Validação manual (super_admin não tem tenant próprio).**

---

## Fluxo 11 — Billing Webhooks (simulate-event)

```
POST /api/admin/billing/simulate-event
Body: { tenant_id, event, plan_name, status }

Eventos suportados:
  PAYMENT_CONFIRMED → status = 'active'
  PAYMENT_OVERDUE   → status = 'past_due'
  SUBSCRIPTION_UPDATED → plan atualizado
  SUBSCRIPTION_CANCELED → status = 'canceled'
```

**Usar em vez de testar com Asaas real.**

---

## Fluxo 12 — IA Recovery

**Spec:** `frontend/e2e/05_ia_recovery.spec.ts`

```
/billing/addons → ia_recovery disponível (R$39)
  ↓
add-on ativo → has_lead_recovery = true
  ↓
/api/leads/{id}/suggest-reply → OpenRouter retorna sugestão
```

**Pré-requisito:** `OPENROUTER_API_KEY` configurado no backend.

---

## Cobertura Atual

| Fluxo | Spec Playwright | Cobertura | Observação |
|---|---|---|---|
| 1. Cadastro/Onboarding | `01_onboarding.spec.ts` | Estruturado | Requer bank limpo |
| 2. Sidebar Starter + Billing | `02_billing_subscribe.spec.ts` | Funcional | Requer E2E_STARTER_EMAIL |
| 3. Upgrade | `03_upgrade_downgrade.spec.ts` | Estruturado | Requer super_admin |
| 4. Downgrade | `03_upgrade_downgrade.spec.ts` | Parcial | Requer super_admin |
| 5. Feature Flags Dinâmicos | — | Manual | Via /admin |
| 6. Sidebar 3 perfis | — | Manual | Via browser |
| 7. Central Atendimento | `04_whatsapp_addon.spec.ts` | Funcional | Requer Evolution |
| 8. WhatsApp da Loja | — | Manual | Via vitrine pública |
| 9. Add-ons | Parcial nos specs | Parcial | |
| 10. Super Admin | — | Manual | |
| 11. Billing Webhooks | — | Manual | Via simulate-event |
| 12. IA Recovery | `05_ia_recovery.spec.ts` | Estruturado | Requer OpenRouter |

---

## Próximos Passos para E2E

1. Criar `.env.e2e` com credenciais do `santos-car`
2. Criar um tenant Pro isolado para testes de upgrade — desde a sessão 64 o banco tem
   apenas `santos-car`; o antigo `sandbox-revendaclick` nunca existiu de fato. O helper
   `TEST_USERS.sandbox` foi removido de `frontend/e2e/helpers/auth.ts` (não era usado por
   nenhum spec); recriar quando houver tenant real para apontar
3. Adicionar step de E2E no CI/CD (staging apenas)
4. Implementar fixtures de banco para Fluxo 1 (onboarding)
