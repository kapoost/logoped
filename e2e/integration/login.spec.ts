import { test, expect } from '@playwright/test'

test.describe('Logowanie — przepływ integracyjny', () => {

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test('admin loguje się i trafia na dashboard', async ({ page }) => {
    const email    = process.env.TEST_ADMIN_EMAIL    ?? 'kapoost@gmail.com'
    const password = process.env.TEST_ADMIN_PASSWORD ?? 'Q2dm1.map'

    await page.goto('/login')
    await page.locator('input[name="login"]:visible').fill(email)
    await page.locator('input[name="password"]:visible').fill(password)
    await page.getByRole('button', { name: 'Zaloguj się' }).click()
    await page.waitForLoadState('networkidle')

    // Admin lub logopeda (zależy od roli)
    expect(page.url()).not.toContain('/login')
  })

  test('złe hasło → zostaje na /login', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[name="login"]:visible').fill('zly@email.pl')
    await page.locator('input[name="password"]:visible').fill('zlehaslo123')
    await page.getByRole('button', { name: 'Zaloguj się' }).click()
    await page.waitForLoadState('networkidle')

    expect(page.url()).toContain('/login')
  })

  test('demo button → /pacjent/cwiczenia', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /Wejdź jako demo/ }).click()
    await page.waitForLoadState('networkidle')

    expect(page.url()).toContain('/pacjent/cwiczenia')
  })
})
