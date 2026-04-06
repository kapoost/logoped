// e2e/helpers/auth.ts
import { Page } from '@playwright/test'

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  await page.fill('input[type="email"]', email)

  await page.evaluate((pw) => {
    const input = document.querySelector('input[type="password"]') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    setter.call(input, pw)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }, password)

  await page.click('button[type="submit"]')
}

export async function logout(page: Page) {
  const logoutBtn = page.locator('button', { hasText: 'Wyloguj' })
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click()
    await page.waitForURL('**/login')
  }
}
