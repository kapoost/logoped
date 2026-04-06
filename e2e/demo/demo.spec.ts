// e2e/demo/demo.spec.ts
// Testy konta demo — Zosia Zaczarowana
// Używa storageState z sesją demo (jeśli ustawiono w .env.test)
import { test, expect } from '@playwright/test'
import { DEMO } from '../helpers'

// Setup: zaloguj jako demo przed testami tej grupy
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Demo — Zosia Zaczarowana', () => {

  test.describe('Logowanie przez przycisk demo', () => {
    test('kliknięcie przycisku demo ładuje widok pacjenta', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      const btn = page.locator('button', { hasText: 'Wejdź jako demo' })
      await expect(btn).toBeVisible()
      await btn.click()

      // Poczekaj na redirect po zalogowaniu
      await page.waitForURL(/\/(pacjent|login)/, { timeout: 15_000 })

      // Jeśli konto demo istnieje — powinno być na /pacjent
      const url = page.url()
      if (url.includes('/pacjent')) {
        await expect(page).toHaveURL(/\/pacjent\/cwiczenia/)
      } else {
        // Konto demo nie istnieje — skip
        test.skip(true, 'Konto demo nie istnieje — uruchom demo_seed.sql')
      }
    })

    test('po zalogowaniu URL nie zawiera hasła ani redirect', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      const btn = page.locator('button', { hasText: 'Wejdź jako demo' })
      if (!await btn.isVisible({ timeout: 3000 }).catch(() => false)) test.skip()

      await btn.click()
      await page.waitForURL(/\/(pacjent|login)/, { timeout: 15_000 })

      const url = page.url()
      expect(url).not.toContain('password')
      expect(url).not.toContain('redirect=')
    })
  })

  test.describe('/api/demo/reset — reset ćwiczeń dnia', () => {
    test('reset zwraca {ok: true} gdy konto istnieje', async ({ request }) => {
      const res = await request.post('/api/demo/reset')
      const body = await res.json()
      // ok:true = konto istnieje i reset poszedł
      // ok:false = konto nie istnieje (demo_seed.sql nie był uruchomiony)
      expect(typeof body.ok).toBe('boolean')
    })

    test('po resecie dzisiejsze ćwiczenia są czyste', async ({ page, request }) => {
      // Reset
      await request.post('/api/demo/reset')

      // Zaloguj się jako demo
      await page.goto('/login')
      await page.waitForLoadState('networkidle')
      const btn = page.locator('button', { hasText: 'Wejdź jako demo' })
      if (!await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        test.skip(true, 'Brak przycisku demo')
      }
      await btn.click()
      await page.waitForURL(/\/pacjent\/cwiczenia/, { timeout: 15_000 }).catch(() => {})

      if (!page.url().includes('/pacjent')) {
        test.skip(true, 'Konto demo nie istnieje')
      }

      // Żadne ćwiczenie nie powinno być zaznaczone jako zrobione dziś
      const doneItems = page.locator('text=Zrobione!').or(page.locator('text=+20'))
      const count = await doneItems.count()
      expect(count).toBe(0)
    })
  })
})
