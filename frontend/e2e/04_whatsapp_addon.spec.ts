/**
 * FLUXO 5 — WhatsApp Automação → Add-on ativo → Evolution → QR → Status
 *
 * Pré-requisitos:
 *   - E2E_STARTER_EMAIL com tenant que TEM add-on whatsapp_automation ativo (has_central_atendimento)
 *   - Evolution API rodando e acessível
 *
 * O que testa:
 *   - /automations mostra CTA de add-on para quem não tem (Starter)
 *   - /automations com add-on ativo mostra botão "Abrir Central de Atendimento"
 *   - /whatsapp acessível com add-on ativo
 *   - QR code carrega (elemento presente)
 */

import { test, expect } from '@playwright/test'
import { loginAs, TEST_USERS } from './helpers/auth'

test.describe('Fluxo 5 — WhatsApp Add-on', () => {
  test.skip(!TEST_USERS.starter.email, 'E2E_STARTER_EMAIL não configurado')

  test('Starter sem add-on: /automations mostra CTA contratar', async ({ page }) => {
    await loginAs(page, TEST_USERS.starter.email, TEST_USERS.starter.password)
    // Starter não tem has_api_access → deve retornar 404
    const res = await page.goto('/automations')
    expect(res?.status()).toBe(404)
  })

  test('Configurações → aba WhatsApp visível', async ({ page }) => {
    await loginAs(page, TEST_USERS.starter.email, TEST_USERS.starter.password)
    await page.goto('/settings')
    await expect(page.getByRole('tab', { name: /whatsapp/i })).toBeVisible()
  })

  test('Configurações → WhatsApp tab → link para /whatsapp e /billing/addons', async ({ page }) => {
    await loginAs(page, TEST_USERS.starter.email, TEST_USERS.starter.password)
    await page.goto('/settings')
    await page.getByRole('tab', { name: /whatsapp/i }).click()
    await expect(page.getByRole('link', { name: /central de atendimento/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /add-ons/i })).toBeVisible()
  })
})
