import { test, expect } from '@playwright/test'

async function loginViaForm(page: any, email: string, password: string) {
  await page.goto('/login')
  await page.locator('input[name="email"]:visible').fill(email)
  await page.locator('input[name="password"]:visible').fill(password)
  await page.getByRole('button', { name: 'Zaloguj się' }).click()
  await page.waitForLoadState('networkidle')
}

test.describe('Wylogowanie — przepływ integracyjny', () => {

  test('wylogowanie przekierowuje na /login', async ({ page }) => {
    const email    = process.env.TEST_ADMIN_EMAIL    ?? 'kapoost@gmail.com'
    const password = process.env.TEST_ADMIN_PASSWORD ?? 'Q2dm1.map'

    await loginViaForm(page, email, password)
    expect(page.url()).not.toContain('/login')

    // Przycisk wylogowania — szukaj po tekście globalnie
    const btn = page.getByRole('button', { name: /wyloguj/i }).first()
    await expect(btn).toBeVisible({ timeout: 5000 })
    await btn.click()
    await page.waitForLoadState('networkidle')

    expect(page.url()).toContain('/login')
  })

  test('po wylogowaniu chroniona strona → redirect do /login', async ({ page }) => {
    const email    = process.env.TEST_ADMIN_EMAIL    ?? 'kapoost@gmail.com'
    const password = process.env.TEST_ADMIN_PASSWORD ?? 'Q2dm1.map'

    await loginViaForm(page, email, password)
    const btn = page.getByRole('button', { name: /wyloguj/i }).first()
    if (await btn.isVisible()) {
      await btn.click()
      await page.waitForLoadState('networkidle')
    } else {
      // Fallback — POST bezpośrednio
      await page.request.post('/api/auth/logout')
      await page.goto('/login')
    }

    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/login')
  })

  test('/api/auth/logout bez sesji → nie crashuje', async ({ page }) => {
    await page.context().clearCookies()
    const res = await page.request.post('/api/auth/logout')
    expect([200, 303, 302]).toContain(res.status())
  })
})
