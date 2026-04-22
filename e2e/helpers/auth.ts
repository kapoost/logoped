// e2e/helpers/auth.ts
import { Page } from '@playwright/test'

export async function login(page: Page, email: string, password: string, isTherapist = false) {
  const loginPath = isTherapist ? '/login/logopeda' : '/login'
  await page.goto(loginPath)
  await page.waitForLoadState('networkidle')

  await page.locator('input[name="login"]:visible').fill(email)
  await page.locator('input[name="password"]:visible').fill(password)
  await page.getByRole('button', { name: 'Zaloguj się' }).click()
}

export async function logout(page: Page) {
  const logoutBtn = page.locator('button', { hasText: 'Wyloguj' })
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click()
    await page.waitForURL('**/login')
  }
}
