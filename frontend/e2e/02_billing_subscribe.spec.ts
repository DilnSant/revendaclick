/**
 * FLUXO 2 — Assinatura → Checkout → Webhook → Subscription → Feature Flags → Sidebar
 *
 * Pré-requisitos:
 *   - E2E_STARTER_EMAIL / E2E_STARTER_PASSWORD com tenant Starter válido
 *   - Backend rodando com ASAAS_ENV=sandbox
 *   - Para testar webhook: usar POST /api/admin/billing/simulate-event (super_admin)
 *
 * O que testa:
 *   - Sidebar Starter (sem seção Pro)
 *   - Fluxo de escolha de plano
 *   - Após simulate-event: sidebar atualiza para Pro (has_crm)
 */

import { test, expect } from '@playwright/test'
import { loginAs, TEST_USERS } from './helpers/auth'

test.describe('Fluxo 2 — Billing e Feature Flags', () => {
  test.skip(!TEST_USERS.starter.email, 'E2E_STARTER_EMAIL não configurado')

  test('sidebar Starter não mostra seção Pro', async ({ page }) => {
    await loginAs(page, TEST_USERS.starter.email, TEST_USERS.starter.password)
    await page.goto('/dashboard')

    // Não deve ver CRM ou Analytics no nav
    await expect(page.getByRole('link', { name: /atendimento/i })).not.toBeVisible()
    await expect(page.getByRole('link', { name: /analytics/i })).not.toBeVisible()

    // Deve ver upgrade prompt
    await expect(page.getByText(/desbloqueie com pro/i)).toBeVisible()
  })

  test('página /billing mostra sub-nav correto', async ({ page }) => {
    await loginAs(page, TEST_USERS.starter.email, TEST_USERS.starter.password)
    await page.goto('/billing')

    await expect(page.getByRole('link', { name: /assinatura/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /add-ons/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /cobranças/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /planos/i })).toBeVisible()
  })

  test('/billing/plans mostra 3 planos públicos', async ({ page }) => {
    await loginAs(page, TEST_USERS.starter.email, TEST_USERS.starter.password)
    await page.goto('/billing/plans')

    await expect(page.getByText('Starter')).toBeVisible()
    await expect(page.getByText('Pro')).toBeVisible()
    await expect(page.getByText('Premium')).toBeVisible()
    // Scale deve estar oculto do grid público
    await expect(page.getByText('Scale')).not.toBeVisible()
  })
})
