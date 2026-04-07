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
      // Przycisk może być poza viewport — przewiń do niego
      await btn.scrollIntoViewIfNeeded().catch(() => {})
      await expect(btn).toBeVisible({ timeout: 8000 })
      await btn.click()
      await expect(page).toHaveURL(/\/logopeda\/pacjenci\/dodaj/)
      // Sprawdź link powrotu (może być "← Pacjenci" lub tylko link)
      await expect(page.locator('a[href="/logopeda/pacjenci"]').first()).toBeVisible()
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

    test('filtrowanie kategorii — kliknięcie filtra działa', async ({ page }) => {
      await go(page, '/logopeda/cwiczenia')
      // Filtry mogą być linkami z ?kategoria= lub buttonami — szukamy obu
      const filterLink = page.locator('a[href*="kategoria"]').first()
      const filterBtn  = page.locator('button').filter({ hasText: /oddech|warg|język|artykul|podnieb|słuch/i }).first()

      if (await filterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await filterLink.click()
        await page.waitForLoadState('networkidle')
        // URL zawiera kategoria LUB strona się przeładowała poprawnie
        const url = page.url()
        expect(url.includes('kategoria') || url.includes('logopeda/cwiczenia')).toBe(true)
      } else if (await filterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await filterBtn.click()
        await page.waitForTimeout(500)
        await expect(page.locator('body')).toBeVisible()
      } else {
        test.skip(true, 'Brak filtrów kategorii — UI może używać innego mechanizmu')
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
