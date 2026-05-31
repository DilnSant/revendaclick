import { Page } from '@playwright/test'

/** Credenciais fixas de teste — nunca usar em produção */
export const TEST_USERS = {
  /** Tenant santos-car — plano Pro (owner do projeto) */
  proOwner: {
    email: process.env.E2E_PRO_EMAIL ?? '',
    password: process.env.E2E_PRO_PASSWORD ?? '',
  },
  /** Alias retrocompatível — usar proOwner para novos testes */
  get starter() { return this.proOwner },
  /** Tenant sandbox-revendaclick — plano Pro (testes isolados) */
  sandbox: {
    email: process.env.E2E_SANDBOX_EMAIL ?? '',
    password: process.env.E2E_SANDBOX_PASSWORD ?? '',
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
