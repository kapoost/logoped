import { test, expect } from '@playwright/test'

const ADMIN_EMAIL    = process.env.TEST_ADMIN_EMAIL    ?? 'kapoost@gmail.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'Q2dm1.map'

async function loginViaForm(page: any, email: string, password: string) {
  await page.goto('/login')
  await page.locator('input[name="login"]:visible').fill(email)
  await page.locator('input[name="password"]:visible').fill(password)
  await page.getByRole('button', { name: 'Zaloguj się' }).click()
  await page.waitForLoadState('networkidle')
}

async function clickLogoutButton(page: any) {
  // Szukaj przycisku Wyloguj gdziekolwiek na stronie (admin layout, therapist nav, etc.)
  const btn = page.getByRole('button', { name: /wyloguj/i }).first()
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.click()
    await page.waitForLoadState('networkidle')
    return true
  }
  // Fallback: submit formularza logout bezpośrednio przez przeglądarkę (nie page.request)
  const submitted = await page.evaluate(async () => {
    const form = document.querySelector('form[action="/api/auth/logout"]') as HTMLFormElement
    if (!form) return false
    form.submit()
    return true
  })
  if (submitted) {
    await page.waitForLoadState('networkidle')
    return true
  }
  return false
}

test.describe('Wylogowanie — przepływ integracyjny', () => {

  test('wylogowanie przekierowuje na /login', async ({ page }) => {
    await loginViaForm(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    expect(page.url()).not.toContain('/login')

    const loggedOut = await clickLogoutButton(page)
    expect(loggedOut).toBe(true)
    expect(page.url()).toContain('/login')
  })

  test('po wylogowaniu chroniona strona → redirect do /login', async ({ page }) => {
    await loginViaForm(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    const currentUrl = page.url()

    await clickLogoutButton(page)
    expect(page.url()).toContain('/login')

    // Wejdź na tę samą chronioną stronę — powinna zredirectować
    const protectedPath = currentUrl.includes('/admin') ? '/admin/dashboard'
      : currentUrl.includes('/logopeda') ? '/logopeda/pacjenci'
      : '/admin/dashboard'

    await page.goto(protectedPath)
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/login')
  })

  test('/api/auth/logout bez sesji → nie crashuje', async ({ page }) => {
    await page.context().clearCookies()
    const res = await page.request.post('/api/auth/logout')
    expect([200, 303, 302]).toContain(res.status())
  })
})
