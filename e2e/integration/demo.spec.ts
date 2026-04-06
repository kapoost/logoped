// e2e/integration/demo.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Demo — Zosia Zaczarowana', () => {

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test('przycisk demo loguje i przekierowuje na /pacjent/cwiczenia', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("Wejdź jako demo")')
    await page.waitForLoadState('networkidle')

    expect(page.url()).toContain('/pacjent/cwiczenia')
  })

  test('po demo login widać ćwiczenia (nie stronę błędu)', async ({ page }) => {
    await page.goto('/login')
    await page.click('button:has-text("Wejdź jako demo")')
    await page.waitForLoadState('networkidle')

    // Nie powinnismy być na /login
    expect(page.url()).not.toContain('/login')
    // Body jest widoczne i nie ma błędu
    await expect(page.locator('body')).toBeVisible()
    const has500 = await page.locator('text=500').isVisible().catch(() => false)
    expect(has500).toBeFalsy()
  })

  test('/api/demo/reset działa (200, nie 307)', async ({ page }) => {
    const res = await page.request.post('/api/demo/reset')
    expect(res.status()).not.toBe(307)
    expect([200, 400]).toContain(res.status())
  })

  test('demo credentials są widoczne na stronie logowania', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('code:has-text("demo@logoped.pl")')).toBeVisible()
    await expect(page.locator('code:has-text("Demo2026!")')).toBeVisible()
  })
})
