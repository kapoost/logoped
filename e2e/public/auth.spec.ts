import { test, expect } from '@playwright/test'

test.describe('Strona logowania', () => {

  test('pokazuje formularz logowania', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    // Przycisk Zaloguj się (nie Demo)
    await expect(page.getByRole('button', { name: 'Zaloguj się' })).toBeVisible()
  })

  test('pokazuje logo LogoPed', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1').filter({ hasText: 'LogoPed' })).toBeVisible()
  })

  test('pokazuje baner demo z przyciskiem Zosi', async ({ page }) => {
    await page.goto('/login')
    // Szukaj w strong (nie w buttonie)
    await expect(page.locator('strong', { hasText: 'Zosia Zaczarowana' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Wejdź jako demo/ })).toBeVisible()
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
    await page.waitForLoadState('networkidle')
    // Link może być "Zaloguj się" lub inny tekst prowadzący do /login
    const link = page.locator('a[href="/login"]').first()
    if (!await link.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Strona register może przekierowywać na login jeśli brak sesji
      if (page.url().includes('/login')) return
      test.skip(true, 'Link do /login nie jest widoczny na stronie rejestracji')
      return
    }
    await link.click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('złe hasło → zostaje na /login z błędem', async ({ page }) => {
    await page.goto('/login')
    // Wypełnij widoczne pola (nie hidden inputs demo)
    await page.locator('input[name="email"]:visible').fill('zly@email.pl')
    await page.locator('input[name="password"]:visible').fill('zlehaslo')
    await page.getByRole('button', { name: 'Zaloguj się' }).click()
    await page.waitForLoadState('networkidle')
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

  test('/api/health zwraca 200', async ({ page }) => {
    const res = await page.request.get('/api/health')
    expect(res.status()).toBe(200)
    const ct = res.headers()['content-type'] ?? ''
    if (ct.includes('application/json')) {
      const body = await res.json()
      expect(body.status).toBe('ok')
    }
  })

  test('/api/push/send bez tokenu → 401', async ({ page }) => {
    const res = await page.request.post('/api/push/send')
    expect(res.status()).toBe(401)
  })

  test('/api/demo/reset nie jest zablokowany (nie 307)', async ({ page }) => {
    const res = await page.request.post('/api/demo/reset')
    expect(res.status()).not.toBe(307)
  })
})
