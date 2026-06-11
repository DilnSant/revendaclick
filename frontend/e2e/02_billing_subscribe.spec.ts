/**
 * FLUXO 2 — Billing e Feature Flags
 *
 * Pré-requisitos:
 *   - E2E_PRO_EMAIL / E2E_PRO_PASSWORD configurados (tenant Pro ativo)
 *
 * O que testa:
 *   - Sidebar Pro mostra CRM e Analytics (has_crm ativo)
 *   - Sub-nav /billing mostra as 4 abas esperadas
 *   - /billing/plans exibe 3 planos públicos (Scale oculto)
 */

import { test, expect } from '@playwright/test'
import { loginAs, TEST_USERS, isCredentialReady } from './helpers/auth'

test.describe('Fluxo 2 — Billing e Feature Flags', () => {
  test.skip(
    !TEST_USERS.proOwner.email || !isCredentialReady(TEST_USERS.proOwner.password),
    'E2E_PRO_EMAIL / E2E_PRO_PASSWORD não configurados',
  )

  test('Pro user: sidebar mostra CRM e Analytics', async ({ page }) => {
    await loginAs(page, TEST_USERS.proOwner.email, TEST_USERS.proOwner.password)
    await page.goto('/dashboard')

    // Pro tem has_crm → "Atendimento" visível na sidebar
    await expect(page.getByRole('link', { name: /atendimento/i })).toBeVisible()
    // Pro tem has_analytics → "Analytics" visível
    await expect(page.getByRole('link', { name: /analytics/i })).toBeVisible()
  })

  test('página /billing mostra sub-nav correto', async ({ page }) => {
    await loginAs(page, TEST_USERS.proOwner.email, TEST_USERS.proOwner.password)
    await page.goto('/billing')

    // href exato evita colisão com outros links de mesmo nome na página
    await expect(page.locator('a[href="/billing"]').first()).toBeVisible()
    await expect(page.locator('a[href="/billing/addons"]').first()).toBeVisible()
    await expect(page.locator('a[href="/billing/history"]').first()).toBeVisible()
    await expect(page.locator('a[href="/billing/plans"]').first()).toBeVisible()
  })

  test('/billing/plans mostra 3 planos públicos', async ({ page }) => {
    await loginAs(page, TEST_USERS.proOwner.email, TEST_USERS.proOwner.password)
    await page.goto('/billing/plans')

    // Usar heading para evitar strict mode (texto "Starter" aparece em múltiplos elementos)
    await expect(page.getByRole('heading', { name: 'Starter', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pro', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Premium', exact: true })).toBeVisible()
    // Scale deve estar oculto do grid público
    await expect(page.getByRole('heading', { name: 'Scale', exact: true })).not.toBeVisible()
  })
})
