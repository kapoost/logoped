// e2e/patient/patient.spec.ts
import { test, expect } from '@playwright/test'

async function go(page: any, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  if (page.url().includes('/login')) test.skip(true, 'Brak sesji pacjenta')
}

test.describe('Panel pacjenta', () => {

  test.describe('Ćwiczenia na dziś', () => {
    test('ekran główny się ładuje', async ({ page }) => {
      await go(page, '/pacjent/cwiczenia')
      await expect(page.locator('body')).toBeVisible()
    })

    test('dolna nawigacja — 4 zakładki', async ({ page }) => {
      await go(page, '/pacjent/cwiczenia')
      const nav = page.locator('nav').first()
      await expect(nav).toBeVisible()
      await expect(nav.locator('a')).toHaveCount(4)
    })

    test('ikony nawigacji są SVG (nie emoji)', async ({ page }) => {
      await go(page, '/pacjent/cwiczenia')
      const svgs = page.locator('nav svg')
      await expect(svgs.first()).toBeVisible()
      expect(await svgs.count()).toBeGreaterThanOrEqual(4)
    })

    test('zakładka Kalendarz — URL zmienia się', async ({ page }) => {
      await go(page, '/pacjent/cwiczenia')
      await page.click('a[href="/pacjent/kalendarz"]')
      await expect(page).toHaveURL(/\/pacjent\/kalendarz/)
    })

    test('zakładka Nagrody — URL zmienia się', async ({ page }) => {
      await go(page, '/pacjent/cwiczenia')
      await page.click('a[href="/pacjent/nagrody"]')
      await expect(page).toHaveURL(/\/pacjent\/nagrody/)
    })

    test('zakładka Papuga — URL zmienia się', async ({ page }) => {
      await go(page, '/pacjent/cwiczenia')
      await page.click('a[href="/pacjent/papuga"]')
      await expect(page).toHaveURL(/\/pacjent\/papuga/)
    })

    test('powrót z kalendarza do ćwiczeń', async ({ page }) => {
      await go(page, '/pacjent/kalendarz')
      await page.click('a[href="/pacjent/cwiczenia"]')
      await expect(page).toHaveURL(/\/pacjent\/cwiczenia/)
    })
  })

  test.describe('Kalendarz', () => {
    test('ekran kalendarza się ładuje', async ({ page }) => {
      await go(page, '/pacjent/kalendarz')
      await expect(page.locator('body')).toBeVisible()
    })

    test('dolna nawigacja widoczna na kalendarzu', async ({ page }) => {
      await go(page, '/pacjent/kalendarz')
      await expect(page.locator('nav').first()).toBeVisible()
    })
  })

  test.describe('Nagrody', () => {
    test('ekran nagród się ładuje', async ({ page }) => {
      await go(page, '/pacjent/nagrody')
      await expect(page.locator('body')).toBeVisible()
    })

    test('dolna nawigacja widoczna na nagrodach', async ({ page }) => {
      await go(page, '/pacjent/nagrody')
      await expect(page.locator('nav').first()).toBeVisible()
    })
  })

  test.describe('Papuga', () => {
    test('ekran papugi się ładuje', async ({ page }) => {
      await go(page, '/pacjent/papuga')
      await expect(page.locator('body')).toBeVisible()
    })

    test('SVG papugi jest w DOM', async ({ page }) => {
      await go(page, '/pacjent/papuga')
      await expect(page.locator('svg').first()).toBeVisible()
    })

    test('dolna nawigacja widoczna na papudze', async ({ page }) => {
      await go(page, '/pacjent/papuga')
      await expect(page.locator('nav').first()).toBeVisible()
    })
  })

  test.describe('Widok ćwiczenia', () => {
    test('nieistniejące ID → 404 lub redirect do /cwiczenia', async ({ page }) => {
      await go(page, '/pacjent/cwiczenia')
      await page.goto('/pacjent/cwiczenie/nie-istnieje-abc-123')
      await page.waitForLoadState('networkidle')
      const has404     = await page.locator('text=404').isVisible().catch(() => false)
      const redirected = page.url().includes('/cwiczenia')
      expect(has404 || redirected).toBeTruthy()
    })
  })

  test.describe('Responsywność mobilna (390px)', () => {
    test('brak poziomego scrollowania', async ({ page }) => {
      await go(page, '/pacjent/cwiczenia')
      const overflow = await page.evaluate(() => document.body.scrollWidth - document.body.clientWidth)
      expect(overflow).toBeLessThanOrEqual(2)
    })

    test('nawigacja mieści się w viewporcie', async ({ page }) => {
      await go(page, '/pacjent/cwiczenia')
      const nav = page.locator('nav').first()
      const box = await nav.boundingBox()
      if (box) {
        expect(box.width).toBeLessThanOrEqual(395)
      }
    })
  })
})
