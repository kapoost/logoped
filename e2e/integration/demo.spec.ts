import { test, expect } from '@playwright/test'

test.describe('Demo — Zosia Zaczarowana', () => {

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test('przycisk demo → /pacjent/cwiczenia', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /Wejdź jako demo/ }).click()
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/pacjent/cwiczenia')
  })

  test('po demo login brak strony błędu', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /Wejdź jako demo/ }).click()
    await page.waitForLoadState('networkidle')
    expect(page.url()).not.toContain('/login')
    const has500 = await page.locator('text=500').isVisible().catch(() => false)
    expect(has500).toBeFalsy()
  })

  test('/api/demo/reset działa (nie 307)', async ({ page }) => {
    const res = await page.request.post('/api/demo/reset')
    expect(res.status()).not.toBe(307)
    expect([200, 400]).toContain(res.status())
  })

  test('kredencjały widoczne na stronie logowania', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('code', { hasText: 'demo@logoped.pl' })).toBeVisible()
    await expect(page.locator('code', { hasText: 'Demo2026!' })).toBeVisible()
  })
})
