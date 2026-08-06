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
  /** super_admin sem tenant */
  superAdmin: {
    email: process.env.E2E_SUPER_ADMIN_EMAIL ?? 'dilneysantos.developer@gmail.com',
    password: process.env.E2E_SUPER_ADMIN_PASSWORD ?? '',
  },
}

/** Retorna false se a senha for vazia ou o placeholder padrão "PREENCHER" */
export function isCredentialReady(password: string): boolean {
  return !!password && password !== 'PREENCHER'
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  // Login page usa id="email" e id="password" (com htmlFor associado)
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: /entrar/i }).click()
  // super_admin → /admin; tenant → /dashboard ou /onboarding
  await page.waitForURL(/dashboard|onboarding|\/admin/, { timeout: 10_000 })
}

export async function logout(page: Page) {
  await page.goto('/logout')
}
