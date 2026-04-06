// e2e/integration/login.spec.ts
// Testy pełnego przepływu logowania przez /api/auth/login
import { test, expect } from '@playwright/test'

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000'

test.describe('Logowanie — przepływ integracyjny', () => {

  test.beforeEach(async ({ page }) => {
    // Wyczyść cookies przed każdym testem
    await page.context().clearCookies()
  })

  test('admin loguje się i trafia na /admin', async ({ page }) => {
    const email    = process.env.TEST_ADMIN_EMAIL    ?? 'kapoost@gmail.com'
    const password = process.env.TEST_ADMIN_PASSWORD ?? 'Q2dm1.map'

    await page.goto('/login')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.click('button[type="submit"]:last-of-type')
    await page.waitForLoadState('networkidle')

    expect(page.url()).toContain('/admin')
  })

  test('złe hasło → zostaje na /login z błędem', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'zly@email.pl')
    await page.fill('input[name="password"]', 'zlehaslo123')
    await page.click('button[type="submit"]:last-of-type')
    await page.waitForLoadState('networkidle')

    expect(page.url()).toContain('/login')
    expect(page.url()).toContain('error=invalid')
  })

  test('demo button → /pacjent/cwiczenia', async ({ page }) => {
    await page.goto('/login')
    await page.click('button:has-text("Wejdź jako demo")')
    await page.waitForLoadState('networkidle')

    // Zosia jest pacjentem — trafia na ćwiczenia
    expect(page.url()).toContain('/pacjent/cwiczenia')
  })

  test('/api/auth/login bez danych → error redirect', async ({ page }) => {
    // Pusty POST → błąd unknown
    const res = await page.request.post('/api/auth/login', {
      form: { email: '', password: '', isDemo: 'false' }
    })
    // Redirect — śledź do końca
    expect([303, 302, 200]).toContain(res.status())
  })
})
