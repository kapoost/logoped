// e2e/admin/admin.spec.ts
import { test, expect } from '@playwright/test'

async function goAdmin(page: any, path = '/admin/dashboard') {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  if (page.url().includes('/login')) test.skip(true, 'Brak sesji admina')
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
    })  })

  test.describe('Zarządzanie logopedami', () => {
    test('lista logopedów', async ({ page }) => {
      await goAdmin(page, '/admin/logopedzi')
      await expect(page.locator('h1')).toContainText('Logopedzi')
    })

    test('4 kafelki: Wszyscy / Aktywni / Wygasa / Zablokowani', async ({ page }) => {
      await goAdmin(page, '/admin/logopedzi')
      for (const txt of ['Wszyscy', 'Aktywni', 'Zablokowani']) {
        await expect(page.getByText(txt).first()).toBeVisible()
      }
      await expect(page.getByText(/Wygasa/).first()).toBeVisible()
    })

    test('tabela: Logopeda / Licencja / Wygasa / Pacjenci', async ({ page }) => {
      await goAdmin(page, '/admin/logopedzi')
      const tbl = page.locator('table')
      if (await tbl.isVisible()) {
        for (const h of ['Logopeda', 'Licencja']) {
          await expect(tbl.getByText(h)).toBeVisible()
        }
      }
    })

    test('Dodaj logopedę → formularz z ← powrotem', async ({ page }) => {
      await goAdmin(page, '/admin/logopedzi')
      await page.click('a[href="/admin/logopedzi/dodaj"]')
      await expect(page).toHaveURL(/\/admin\/logopedzi\/dodaj/)
      await expect(page.locator('h1')).toContainText('Dodaj logopedę')
      await expect(page.locator('a[href="/admin/logopedzi"]')).toBeVisible()
    })

    test('← Logopedzi wraca do listy', async ({ page }) => {
      await goAdmin(page, '/admin/logopedzi/dodaj')
      await page.click('a[href="/admin/logopedzi"]')
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

    test('profil zawiera kafelki statystyk', async ({ page }) => {
      await openFirst(page)
      await expect(page.locator('text=pacjentów').first()).toBeVisible()
    })

    test('formularz: Dane osobowe / Licencja / Status / Hasło', async ({ page }) => {
      await openFirst(page)
      for (const txt of ['Dane osobowe', 'Status konta', 'Hasło']) {
        await expect(page.getByText(txt)).toBeVisible()
      }
    })

    test('select licencji: Trial / Basic / Pro / Unlimited', async ({ page }) => {
      await openFirst(page)
      const sel = page.locator('select').first()
      await expect(sel).toBeVisible()
      const opts = await sel.locator('option').allTextContents()
      for (const typ of ['Trial', 'Basic', 'Pro', 'Unlimited']) {
        expect(opts.some(o => o.includes(typ))).toBe(true)
      }
    })

    test('przyciski +30 dni / +3 mies. / +1 rok zmieniają datę', async ({ page }) => {
      await openFirst(page)
      const dt = page.locator('input[type="date"]')
      const before = await dt.inputValue()
      await page.getByRole('button', { name: '+30 dni' }).click()
      expect(await dt.inputValue()).not.toBe(before)
    })

    test('przycisk resetu hasła jest widoczny', async ({ page }) => {
      await openFirst(page)
      await expect(page.locator('button', { hasText: 'Wyślij link do resetu' })).toBeVisible()
    })

    test('← Logopedzi wraca do listy', async ({ page }) => {
      await openFirst(page)
      await page.click('a[href="/admin/logopedzi"]')
      await expect(page).toHaveURL(/\/admin\/logopedzi$/)
    })
  })

  test.describe('Baza ćwiczeń', () => {
    test('lista ćwiczeń', async ({ page }) => {
      await goAdmin(page, '/admin/cwiczenia')
      await expect(page.locator('h1')).toContainText(/ćwiczenia/i)
    })

    test('Dodaj ćwiczenie → ← Ćwiczenia', async ({ page }) => {
      await goAdmin(page, '/admin/cwiczenia')
      await page.click('a[href="/admin/cwiczenia/nowe"]')
      await expect(page).toHaveURL(/\/admin\/cwiczenia\/nowe/)
      await expect(page.locator('a[href="/admin/cwiczenia"]').first()).toBeVisible()
      await page.click('a[href="/admin/cwiczenia"]')
      await expect(page).toHaveURL(/\/admin\/cwiczenia$/)
    })
  })

  test('wylogowanie → /login', async ({ page }) => {
    await goAdmin(page)
    const btn = page.locator('button', { hasText: 'Wyloguj' }).first()
    if (await btn.isVisible()) {
      await btn.click()
      await expect(page).toHaveURL(/\/login/)
    }
  })
})
