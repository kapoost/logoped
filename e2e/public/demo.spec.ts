import { test, expect } from '@playwright/test'

test.describe('Demo — Zosia Zaczarowana', () => {

  test('przycisk demo jest widoczny bez logowania', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: /Wejdź jako demo/ })).toBeVisible()
  })

  test('formularz logowania ma puste pola (nie nadpisane przez demo)', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    // Widoczne pole login powinno być puste
    const loginVal = await page.locator('input[name="login"]:visible').inputValue()
    expect(loginVal).toBe('')
  })

  test('/api/demo/reset nie jest zablokowany przez middleware', async ({ page }) => {
    await page.goto('/login')
    const res = await page.request.post('/api/demo/reset')
    expect(res.status()).not.toBe(307)
    expect([200, 400, 404, 500]).toContain(res.status())
  })

  test('/api/push/send z tokenem → nie 307', async ({ page }) => {
    await page.goto('/login')
    const res = await page.request.post('/api/push/send', {
      headers: { 'Authorization': 'Bearer 94a8267d726eb64ffe100d5ade91b07b7900a1616249d74675d294e4868a1e52' }
    })
    expect(res.status()).not.toBe(307)
    expect(res.status()).toBe(200)
  })
})
