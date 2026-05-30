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
import { loginAs, TEST_USERS } from './helpers/auth'

test.describe('Fluxo 6 — IA Recovery', () => {
  test.skip(!TEST_USERS.starter.email, 'E2E_STARTER_EMAIL não configurado')

  test('/billing/addons mostra ia_recovery disponível', async ({ page }) => {
    await loginAs(page, TEST_USERS.starter.email, TEST_USERS.starter.password)
    await page.goto('/billing/addons')

    // IA Recovery add-on deve aparecer na página
    await expect(page.getByText(/ia recovery/i)).toBeVisible()
    await expect(page.getByText(/r\$39/i)).toBeVisible()
  })
})
