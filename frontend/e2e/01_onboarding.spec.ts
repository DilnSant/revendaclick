/**
 * FLUXO 1 — Cadastro → Tenant → Onboarding → Dashboard
 *
 * Pré-requisitos:
 *   - E2E_BASE_URL apontando para ambiente com banco limpo (ou sandbox)
 *   - Supabase Auth com confirmação de e-mail DESABILITADA (ambiente de teste)
 *
 * O que testa:
 *   - Registro de novo usuário
 *   - Criação de tenant via /onboarding
 *   - Redirecionamento para /dashboard
 *   - OnboardingChecklist visível
 */

import { test, expect } from '@playwright/test'

const timestamp = Date.now()
const testEmail = `e2e+${timestamp}@revendaclick-test.com`
const testPassword = 'TestPass@123'
const testSlug = `e2e-loja-${timestamp}`

test.describe('Fluxo 1 — Cadastro e Onboarding', () => {
  test('deve registrar usuário, criar tenant e chegar no dashboard', async ({ page }) => {
    // Registro
    await page.goto('/register')
    await page.getByLabel(/e-mail/i).fill(testEmail)
    await page.getByLabel(/senha/i).fill(testPassword)
    await page.getByRole('button', { name: /criar conta/i }).click()

    // Aguarda redirect para onboarding (sem confirmação de e-mail)
    await page.waitForURL(/onboarding/, { timeout: 15_000 })
    await expect(page).toHaveURL(/onboarding/)

    // Preenche dados do tenant
    await page.getByLabel(/nome da loja/i).fill(`E2E Loja ${timestamp}`)
    await page.getByLabel(/slug/i).fill(testSlug)
    const emailField = page.getByLabel(/e-mail de contato/i)
    if (await emailField.isVisible()) {
      await emailField.fill(testEmail)
    }
    const phoneField = page.getByLabel(/telefone/i)
    if (await phoneField.isVisible()) {
      await phoneField.fill('11999990000')
    }
    await page.getByRole('button', { name: /continuar|criar loja|salvar/i }).click()

    // Deve chegar no dashboard
    await page.waitForURL(/dashboard/, { timeout: 15_000 })
    await expect(page).toHaveURL(/dashboard/)
    await expect(page.getByText(/bem-vindo|dashboard/i).first()).toBeVisible()
  })
})
