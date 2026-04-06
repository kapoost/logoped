// e2e/integration/logout.spec.ts
import { test, expect, request } from '@playwright/test'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://qeoeqjotlwbbwhdevwxu.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_nR2IzbPhMHczzQYEqrpbVA_Z7qoZU6o'

async function loginViaRoute(page: any, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]:last-of-type')
  await page.waitForLoadState('networkidle')
}

test.describe('Wylogowanie — przepływ integracyjny', () => {

  test('wylogowanie przekierowuje na /login', async ({ page }) => {
    const email    = process.env.TEST_ADMIN_EMAIL    ?? 'kapoost@gmail.com'
    const password = process.env.TEST_ADMIN_PASSWORD ?? 'Q2dm1.map'

    await loginViaRoute(page, email, password)
    expect(page.url()).not.toContain('/login')

    // Znajdź przycisk wylogowania
    const btn = page.locator('form[action="/api/auth/logout"] button').first()
    await expect(btn).toBeVisible()
    await btn.click()
    await page.waitForLoadState('networkidle')

    expect(page.url()).toContain('/login')
  })

  test('po wylogowaniu /admin → redirect do /login', async ({ page }) => {
    const email    = process.env.TEST_ADMIN_EMAIL    ?? 'kapoost@gmail.com'
    const password = process.env.TEST_ADMIN_PASSWORD ?? 'Q2dm1.map'

    await loginViaRoute(page, email, password)

    const btn = page.locator('form[action="/api/auth/logout"] button').first()
    if (await btn.isVisible()) await btn.click()
    await page.waitForLoadState('networkidle')

    // Próbuj wejść na chronioną stronę
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/login')
  })

  test('/api/auth/logout bez sesji → /login (nie crashuje)', async ({ page }) => {
    await page.context().clearCookies()
    const res = await page.request.post('/api/auth/logout')
    expect([200, 303, 302]).toContain(res.status())
  })
})
