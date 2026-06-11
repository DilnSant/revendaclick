/**
 * FLUXO 5 — WhatsApp Automação → Add-on ativo → Evolution → QR → Status
 *
 * Pré-requisitos:
 *   - E2E_PRO_EMAIL com tenant Pro que TEM add-on whatsapp_automation ativo
 *
 * O que testa:
 *   - /automations acessível com add-on ativo (santos-car tem whatsapp_automation)
 *   - Aba WhatsApp visível em /settings (link <a href="?tab=whatsapp">)
 *   - WhatsApp tab mostra links para /whatsapp e /billing/addons
 */

import { test, expect } from '@playwright/test'
import { loginAs, TEST_USERS, isCredentialReady } from './helpers/auth'

test.describe('Fluxo 5 — WhatsApp Add-on', () => {
  test.skip(
    !TEST_USERS.proOwner.email || !isCredentialReady(TEST_USERS.proOwner.password),
    'E2E_PRO_EMAIL / E2E_PRO_PASSWORD não configurados',
  )

  test('Pro com add-on: /automations acessível (HTTP 200)', async ({ page }) => {
    await loginAs(page, TEST_USERS.proOwner.email, TEST_USERS.proOwner.password)
    // Santos-car tem whatsapp_automation ativo — /automations deve retornar 200
    const res = await page.goto('/automations')
    expect(res?.status()).toBe(200)
  })

  test('Configurações → aba WhatsApp visível', async ({ page }) => {
    await loginAs(page, TEST_USERS.proOwner.email, TEST_USERS.proOwner.password)
    await page.goto('/settings')
    // Tabs são <a href="/settings?tab=..."> — não role="tab"
    await expect(page.locator('a[href*="tab=whatsapp"]')).toBeVisible()
  })

  test('Configurações → WhatsApp tab → links para /whatsapp e /billing/addons', async ({ page }) => {
    await loginAs(page, TEST_USERS.proOwner.email, TEST_USERS.proOwner.password)
    // Navega diretamente para a aba ao invés de clicar no <a> simples
    await page.goto('/settings?tab=whatsapp')
    // Botão "Abrir Automação WhatsApp" → /whatsapp
    await expect(page.locator('a[href="/whatsapp"]')).toBeVisible()
    // Link "Ver recursos disponíveis" → /billing/addons
    await expect(page.locator('a[href="/billing/addons"]')).toBeVisible()
  })
})
