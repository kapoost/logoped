// e2e/public/demo.spec.ts
// Testy konta demo — Zosia Zaczarowana
import { test, expect } from '@playwright/test'

test.describe('Demo — Zosia Zaczarowana', () => {

  test('przycisk demo jest widoczny bez logowania', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    const btn = page.locator('button', { hasText: 'Wejdź jako demo' })
    await expect(btn).toBeVisible()
  })

  test('przycisk demo nie wymaga wypełnienia formularza', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    // Pola są puste — demo nie używa formularza
    const emailVal    = await page.locator('input[name="email"]').inputValue()
    const passwordVal = await page.locator('input[name="password"]').inputValue()
    expect(emailVal).toBe('')
    expect(passwordVal).toBe('')
  })

  test('/api/demo/reset nie jest zablokowany przez middleware', async ({ page }) => {
    await page.goto('/login')
    const response = await page.request.post('/api/demo/reset')
    // Nie powinno być 307 redirect
    expect(response.status()).not.toBe(307)
    // Może być 200 (konto istnieje) lub inny kod — ale nie redirect
    expect([200, 400, 404, 500]).toContain(response.status())
  })

  test('/api/push/send z właściwym tokenem → nie 307', async ({ page }) => {
    await page.goto('/login')
    const response = await page.request.post('/api/push/send', {
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET ?? '94a8267d726eb64ffe100d5ade91b07b7900a1616249d74675d294e4868a1e52'}`
      }
    })
    expect(response.status()).not.toBe(307)
    expect(response.status()).toBe(200)
  })
})
