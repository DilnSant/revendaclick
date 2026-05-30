import { Page } from '@playwright/test'

/** Credenciais fixas de teste — nunca usar em produção */
export const TEST_USERS = {
  /** Tenant santos-car — plano Starter */
  starter: {
    email: process.env.E2E_STARTER_EMAIL ?? '',
    password: process.env.E2E_STARTER_PASSWORD ?? '',
  },
  /** super_admin sem tenant */
  superAdmin: {
    email: process.env.E2E_SUPER_ADMIN_EMAIL ?? 'dilneysantos.developer@gmail.com',
    password: process.env.E2E_SUPER_ADMIN_PASSWORD ?? '',
  },
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel(/e-mail/i).fill(email)
  await page.getByLabel(/senha/i).fill(password)
  await page.getByRole('button', { name: /entrar/i }).click()
  await page.waitForURL(/dashboard|onboarding/, { timeout: 10_000 })
}

export async function logout(page: Page) {
  await page.goto('/logout')
}
