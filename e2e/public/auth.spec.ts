import { test, expect } from '@playwright/test'

test.describe('Strona logowania', () => {

  test('pokazuje formularz logowania', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[name="login"]:visible')).toBeVisible()
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
    await expect(page.getByText('demo', { exact: true })).toBeVisible()
    await expect(page.getByText('Demo2026!')).toBeVisible()
  })

  test('link do logowania logopedy jest widoczny', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('link', { name: /Zaloguj się tutaj/ })).toBeVisible()
  })

  test('złe hasło → zostaje na /login z błędem', async ({ page }) => {
    await page.goto('/login')
    // Wypełnij widoczne pola (nie hidden inputs demo)
    await page.locator('input[name="login"]:visible').fill('zly@email.pl')
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
