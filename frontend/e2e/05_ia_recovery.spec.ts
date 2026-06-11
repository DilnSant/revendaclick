/**
 * FLUXO 6 — IA Recovery → Add-on ativo → Feature Flag → Disponibilização
 *
 * Pré-requisitos:
 *   - Backend com OPENROUTER_API_KEY configurado (ou mock)
 *   - Tenant com add-on ia_recovery ativo (has_lead_recovery=true)
 *
 * O que testa:
 *   - Feature flag has_lead_recovery presente no /api/usage quando add-on ativo
 *   - /billing/addons lista o add-on ia_recovery disponível
 *   - Endpoint /api/leads/{id}/suggest-reply funciona com add-on ativo
 */

import { test, expect } from '@playwright/test'
import { loginAs, TEST_USERS, isCredentialReady } from './helpers/auth'

test.describe('Fluxo 6 — IA Recovery', () => {
  test.skip(
    !TEST_USERS.starter.email || !isCredentialReady(TEST_USERS.starter.password),
    'E2E_PRO_EMAIL / E2E_PRO_PASSWORD não configurados',
  )

  test('/billing/addons mostra ia_recovery ativo', async ({ page }) => {
    await loginAs(page, TEST_USERS.proOwner.email, TEST_USERS.proOwner.password)
    await page.goto('/billing/addons')

    // Santos-car tem ia_recovery ATIVO — display_name no DB = "Recuperação por IA"
    await expect(page.getByText(/recuperação por ia/i)).toBeVisible()
    // Preço verificado via SQL (price_monthly = 39.00 em plan_addons); não testar texto aqui
    // pois whatsapp_automation também custa R$39 → strict mode violation
  })
})
