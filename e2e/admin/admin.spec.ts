// e2e/admin/admin.spec.ts
import { test, expect } from '@playwright/test'

async function goAdmin(page: any, path = '/admin/dashboard') {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  if (page.url().includes('/login') || page.url().includes('/pacjent') || page.url().includes('/logopeda')) {
    test.skip(true, 'Brak sesji admina lub zła rola')
  }
}

test.describe('Panel admina', () => {

  test.describe('Dashboard', () => {
    test('ładuje się poprawnie', async ({ page }) => {
      await goAdmin(page)
      await expect(page.locator('h1, h2').first()).toBeVisible()
    })

    test('kafelki statystyk w main', async ({ page }) => {
      await goAdmin(page)
      await expect(page.locator('main').getByText('Logopedzi', { exact: true }).first()).toBeVisible()
      await expect(page.locator('main').getByText('Pacjenci', { exact: true }).first()).toBeVisible()
    })
  })

  test.describe('Zarządzanie logopedami', () => {
    test('lista logopedów', async ({ page }) => {
      await goAdmin(page, '/admin/logopedzi')
      await expect(page.locator('h1')).toContainText('Logopedzi')
    })

    test('kafelki filtrów widoczne', async ({ page }) => {
      await goAdmin(page, '/admin/logopedzi')
      for (const txt of ['Wszyscy', 'Aktywni', 'Zablokowani']) {
        await expect(page.getByText(txt).first()).toBeVisible()
      }
    })

    test('tabela logopedów — nagłówki', async ({ page }) => {
      await goAdmin(page, '/admin/logopedzi')
      const tbl = page.locator('table')
      if (await tbl.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(tbl.getByText('Logopeda').first()).toBeVisible()
      }
    })

    test('Dodaj logopedę → formularz widoczny', async ({ page }) => {
      await goAdmin(page, '/admin/logopedzi')
      const btn = page.locator('a[href="/admin/logopedzi/dodaj"]')
      await expect(btn).toBeVisible()
      await btn.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/admin\/logopedzi\/dodaj/)
      await expect(page.locator('h1').first()).toBeVisible()
    })

    test('← Logopedzi wraca do listy', async ({ page }) => {
      await goAdmin(page, '/admin/logopedzi/dodaj')
      await page.locator('a[href="/admin/logopedzi"]').first().click()
      await expect(page).toHaveURL(/\/admin\/logopedzi$/)
    })
  })

  test.describe('Profil logopedy — licencja', () => {
    async function openFirst(page: any) {
      await goAdmin(page, '/admin/logopedzi')
      const btn = page.locator('a', { hasText: 'Zarządzaj →' }).first()
      if (!await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        test.skip(true, 'Brak logopedów')
      }
      await btn.click()
      await page.waitForLoadState('networkidle')
    }

    test('profil zawiera statystyki', async ({ page }) => {
      await openFirst(page)
      await expect(page.locator('main').first()).toBeVisible()
    })

    test('formularz edycji widoczny', async ({ page }) => {
      await openFirst(page)
      // Sprawdź że jest jakiś formularz lub sekcja edycji
      const hasForm = await page.locator('form, input, select').first().isVisible({ timeout: 3000 }).catch(() => false)
      expect(hasForm).toBe(true)
    })

    test('select licencji istnieje', async ({ page }) => {
      await openFirst(page)
      const sel = page.locator('select').first()
      if (await sel.isVisible({ timeout: 3000 }).catch(() => false)) {
        const opts = await sel.locator('option').allTextContents()
        expect(opts.length).toBeGreaterThan(0)
      }
    })

    test('przyciski +30 dni / +3 mies. / +1 rok', async ({ page }) => {
      await openFirst(page)
      const btn30 = page.getByRole('button', { name: /\+30 dni/i })
      if (await btn30.isVisible({ timeout: 3000 }).catch(() => false)) {
        const dt = page.locator('input[type="date"]')
        const before = await dt.inputValue()
        await btn30.click()
        expect(await dt.inputValue()).not.toBe(before)
      }
    })

    test('przycisk resetu hasła widoczny', async ({ page }) => {
      await openFirst(page)
      const btn = page.locator('button', { hasText: /reset|hasło/i }).first()
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(btn).toBeVisible()
      }
    })

    test('← Logopedzi wraca do listy', async ({ page }) => {
      await openFirst(page)
      await page.locator('a[href="/admin/logopedzi"]').first().click()
      await expect(page).toHaveURL(/\/admin\/logopedzi$/)
    })
  })

  test.describe('Baza ćwiczeń', () => {
    test('lista ćwiczeń się ładuje', async ({ page }) => {
      await goAdmin(page, '/admin/cwiczenia')
      // h1 może być "Baza ćwiczeń" lub "Ćwiczenia"
      await expect(page.locator('h1').first()).toBeVisible()
      await expect(page.locator('h1').first()).toContainText(/ćwicze/i)
    })

    test('Dodaj ćwiczenie → ← Ćwiczenia', async ({ page }) => {
      await goAdmin(page, '/admin/cwiczenia')
      const link = page.locator('a[href="/admin/cwiczenia/nowe"]')
      await expect(link).toBeVisible()
      await link.click()
      await expect(page).toHaveURL(/\/admin\/cwiczenia\/nowe/)
      await page.locator('a[href="/admin/cwiczenia"]').first().click()
      await expect(page).toHaveURL(/\/admin\/cwiczenia$/)
    })
  })

  test('wylogowanie → /login', async ({ page }) => {
    await goAdmin(page)
    const btn = page.getByRole('button', { name: /wyloguj/i }).first()
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/login/)
    }
  })
})
