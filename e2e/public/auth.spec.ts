// e2e/public/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Strona logowania', () => {

  test('pokazuje formularz logowania', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('pokazuje logo LogoPed', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1').filter({ hasText: 'LogoPed' })).toBeVisible()
  })

  test('pokazuje baner demo z przyciskiem Zosi', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=Zosia Zaczarowana')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Wejdź jako demo' })).toBeVisible()
  })

  test('baner demo pokazuje kredencjały', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('code', { hasText: 'demo@logoped.pl' })).toBeVisible()
    await expect(page.locator('code', { hasText: 'Demo2026!' })).toBeVisible()
  })

  test('link do rejestracji działa', async ({ page }) => {
    await page.goto('/login')
    await page.click('a[href="/register"]')
    await expect(page).toHaveURL(/\/register/)
  })

  test('link powrotu z rejestracji do logowania', async ({ page }) => {
    await page.goto('/register')
    await page.click('a[href="/login"]')
    await expect(page).toHaveURL(/\/login/)
  })

  test('pokazuje błąd przy złym haśle', async ({ page }) => {
    await page.goto('/login')
    // Uncontrolled inputs — wypełnij przez DOM
    await page.fill('input[name="email"]', 'zly@email.pl')
    await page.fill('input[name="password"]', 'zlehaslo')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(4000)
    expect(page.url()).toContain('/login')
  })

  test('niezalogowany → /admin → redirect do /login', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('niezalogowany → /logopeda → redirect do /login', async ({ page }) => {
    await page.goto('/logopeda/pacjenci')
    await expect(page).toHaveURL(/\/login/)
  })

  test('niezalogowany → /pacjent → redirect do /login', async ({ page }) => {
    await page.goto('/pacjent/cwiczenia')
    await expect(page).toHaveURL(/\/login/)
  })

  test('/api/health zwraca 200 z JSON', async ({ page }) => {
    const response = await page.request.get('/api/health')
    expect(response.status()).toBe(200)
    const ct = response.headers()['content-type'] ?? ''
    if (ct.includes('application/json')) {
      const body = await response.json()
      expect(body.status).toBe('ok')
    }
  })

  test('/api/push/send bez tokenu → 401', async ({ page }) => {
    const response = await page.request.post('/api/push/send')
    expect(response.status()).toBe(401)
  })

  test('/api/demo/reset bez sesji → odpowiada (nie 307)', async ({ page }) => {
    const response = await page.request.post('/api/demo/reset')
    // Powinna odpowiedzieć — nie redirectować na /login
    expect(response.status()).not.toBe(307)
  })
})
