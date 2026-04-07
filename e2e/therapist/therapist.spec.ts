// e2e/therapist/therapist.spec.ts
import { test, expect } from '@playwright/test'

async function go(page: any, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  if (page.url().includes('/login')) test.skip(true, 'Brak sesji logopedy')
}

test.describe('Panel logopedy', () => {

  test.describe('Pacjenci', () => {
    test('lista pacjentów się ładuje', async ({ page }) => {
      await go(page, '/logopeda/pacjenci')
      await expect(page.locator('body')).toBeVisible()
    })

    test('Dodaj pacjenta → formularz z ← powrotem', async ({ page }) => {
      await go(page, '/logopeda/pacjenci')
      const btn = page.locator('a[href="/logopeda/pacjenci/dodaj"]')
      await expect(btn).toBeVisible({ timeout: 8000 })
      await btn.click()
      await expect(page).toHaveURL(/\/logopeda\/pacjenci\/dodaj/)
      await expect(page.locator('a[href="/logopeda/pacjenci"]')).toBeVisible()
    })

    test('← Pacjenci wraca do listy', async ({ page }) => {
      await go(page, '/logopeda/pacjenci/dodaj')
      await page.locator('a[href="/logopeda/pacjenci"]').first().click()
      await expect(page).toHaveURL(/\/logopeda\/pacjenci$/)
    })

    test('kliknięcie pacjenta otwiera profil', async ({ page }) => {
      await go(page, '/logopeda/pacjenci')
      const link = page.locator('a[href*="/logopeda/pacjenci/"]').first()
      if (!await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        test.skip(true, 'Brak pacjentów')
      }
      await link.click()
      await expect(page).toHaveURL(/\/logopeda\/pacjenci\/.+/)
    })

    test('profil pacjenta zawiera link powrotu', async ({ page }) => {
      await go(page, '/logopeda/pacjenci')
      const link = page.locator('a[href*="/logopeda/pacjenci/"]').first()
      if (!await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        test.skip(true, 'Brak pacjentów')
      }
      await link.click()
      await expect(page.locator('a[href="/logopeda/pacjenci"]')).toBeVisible()
    })
  })

  test.describe('Plany ćwiczeń', () => {
    test('lista planów się ładuje', async ({ page }) => {
      await go(page, '/logopeda/plany')
      await expect(page.locator('body')).toBeVisible()
    })

    test('nowy plan — formularz z ← powrotem', async ({ page }) => {
      await go(page, '/logopeda/plany/nowy')
      await expect(page.locator('h1').first()).toBeVisible()
      await expect(page.locator('a[href="/logopeda/plany"]').first()).toBeVisible()
    })

    test('← Plany wraca do listy', async ({ page }) => {
      await go(page, '/logopeda/plany/nowy')
      await page.locator('a[href="/logopeda/plany"]').first().click()
      await expect(page).toHaveURL(/\/logopeda\/plany$/)
    })

    test('nowy plan z kontekstem pacjenta — link do pacjenta', async ({ page }) => {
      await go(page, '/logopeda/pacjenci')
      const patientLink = page.locator('a[href*="/logopeda/pacjenci/"]').first()
      if (!await patientLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        test.skip(true, 'Brak pacjentów')
      }
      const href = await patientLink.getAttribute('href') ?? ''
      const id   = href.split('/').pop()
      await page.goto(`/logopeda/plany/nowy?pacjent=${id}`)
      await page.waitForLoadState('networkidle')
      await expect(page.locator(`a[href*="/logopeda/pacjenci/${id}"]`).first()).toBeVisible()
    })
  })

  test.describe('Baza ćwiczeń', () => {
    test('lista ćwiczeń z nagłówkiem', async ({ page }) => {
      await go(page, '/logopeda/cwiczenia')
      await expect(page.locator('h1')).toBeVisible()
    })

    test('filtrowanie kategorii zmienia URL', async ({ page }) => {
      await go(page, '/logopeda/cwiczenia')
      const filter = page.locator('a[href*="kategoria"]').first()
      if (await filter.isVisible({ timeout: 8000 }).catch(() => false)) {
        await filter.click()
        await page.waitForLoadState('networkidle')
        expect(page.url()).toContain('kategoria')
      }
    })

    test('nowe ćwiczenie → ← Ćwiczenia', async ({ page }) => {
      await go(page, '/logopeda/cwiczenia/nowe')
      await expect(page.locator('h1').first()).toBeVisible()
      await expect(page.locator('a[href="/logopeda/cwiczenia"]').first()).toBeVisible()
      await page.locator('a[href="/logopeda/cwiczenia"]').first().click()
      await expect(page).toHaveURL(/\/logopeda\/cwiczenia$/)
    })
  })

  test.describe('Nawigacja', () => {
    test('header jest widoczny', async ({ page }) => {
      await go(page, '/logopeda/pacjenci')
      await expect(page.locator('header').first()).toBeVisible()
    })

    test('wylogowanie → /login', async ({ page }) => {
      await go(page, '/logopeda/pacjenci')
      const btn = page.getByRole('button', { name: /wyloguj/i }).first()
      if (await btn.isVisible()) {
        await btn.click()
        await expect(page).toHaveURL(/\/login/)
      }
    })
  })
})
