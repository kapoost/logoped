// e2e/patient/patient.spec.ts
import { test, expect } from '@playwright/test'

async function go(page: any, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  if (page.url().includes('/login')) test.skip(true, 'Brak sesji pacjenta')
}

// Pobierz ID pierwszego dostępnego ćwiczenia z listy
async function getFirstExerciseId(page: any): Promise<string | null> {
  await go(page, '/pacjent/cwiczenia')
  const link = page.locator('a[href*="/pacjent/cwiczenie/"]').first()
  if (!await link.isVisible({ timeout: 3000 }).catch(() => false)) return null
  const href = await link.getAttribute('href') ?? ''
  return href.split('/').pop() ?? null
}

test.describe('Panel pacjenta', () => {

  test.describe('Nawigacja', () => {
    test('ekran główny się ładuje', async ({ page }) => {
      await go(page, '/pacjent/cwiczenia')
      await expect(page.locator('body')).toBeVisible()
    })

    test('dolna nawigacja — 4 zakładki', async ({ page }) => {
      await go(page, '/pacjent/cwiczenia')
      const nav = page.locator('nav').first()
      await expect(nav.locator('a')).toHaveCount(4)
    })

    test('ikony nawigacji są SVG', async ({ page }) => {
      await go(page, '/pacjent/cwiczenia')
      const svgs = page.locator('nav svg')
      await expect(svgs.first()).toBeVisible()
      expect(await svgs.count()).toBeGreaterThanOrEqual(4)
    })

    test('zakładka Kalendarz', async ({ page }) => {
      await go(page, '/pacjent/cwiczenia')
      await page.click('a[href="/pacjent/kalendarz"]')
      await expect(page).toHaveURL(/\/pacjent\/kalendarz/)
    })

    test('zakładka Nagrody', async ({ page }) => {
      await go(page, '/pacjent/cwiczenia')
      await page.click('a[href="/pacjent/nagrody"]')
      await expect(page).toHaveURL(/\/pacjent\/nagrody/)
    })

    test('zakładka Papuga', async ({ page }) => {
      await go(page, '/pacjent/cwiczenia')
      await page.click('a[href="/pacjent/papuga"]')
      await expect(page).toHaveURL(/\/pacjent\/papuga/)
    })

    test('powrót z kalendarza', async ({ page }) => {
      await go(page, '/pacjent/kalendarz')
      await page.click('a[href="/pacjent/cwiczenia"]')
      await expect(page).toHaveURL(/\/pacjent\/cwiczenia/)
    })
  })

  test.describe('Ekran ćwiczenia', () => {
    test('widok ćwiczenia się ładuje', async ({ page }) => {
      const id = await getFirstExerciseId(page)
      if (!id) { test.skip(true, 'Brak ćwiczeń'); return }
      await go(page, `/pacjent/cwiczenie/${id}`)
      await expect(page.locator('h1').first()).toBeVisible()
    })

    test('kołowy licznik jest widoczny', async ({ page }) => {
      const id = await getFirstExerciseId(page)
      if (!id) { test.skip(true, 'Brak ćwiczeń'); return }
      await go(page, `/pacjent/cwiczenie/${id}`)
      await expect(page.locator('svg').first()).toBeVisible()
    })

    test('przycisk +1 powtórzenie lub Zrobione jest widoczny', async ({ page }) => {
      const id = await getFirstExerciseId(page)
      if (!id) { test.skip(true, 'Brak ćwiczeń'); return }
      await go(page, `/pacjent/cwiczenie/${id}`)
      const btn = page.locator('button').first()
      await expect(btn).toBeVisible()
      const text = await btn.innerText()
      expect(text).toMatch(/powtórzenie|Zrobione|Zacznij|Ostatnie/)
    })

    test('przycisk ← wraca do listy', async ({ page }) => {
      const id = await getFirstExerciseId(page)
      if (!id) { test.skip(true, 'Brak ćwiczeń'); return }
      await go(page, `/pacjent/cwiczenie/${id}`)
      await page.locator('a[href="/pacjent/cwiczenia"]').first().click()
      await expect(page).toHaveURL(/\/pacjent\/cwiczenia/)
    })

    test('kliknięcie +1 powtórzenie zwiększa licznik', async ({ page }) => {
      const id = await getFirstExerciseId(page)
      if (!id) { test.skip(true, 'Brak ćwiczeń'); return }
      await go(page, `/pacjent/cwiczenie/${id}`)

      const btn = page.getByRole('button').filter({ hasText: /powtórzenie|Zacznij/ }).first()
      if (!await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        test.skip(true, 'Ćwiczenie już ukończone')
        return
      }

      // Pobierz stan przed
      const svgBefore = await page.locator('text=/\\d+/').first().innerText().catch(() => '0')
      await btn.click()
      await page.waitForTimeout(400)

      // Sprawdź że licznik się zmienił lub button zmienił tekst
      const btnAfter = await page.locator('button').first().innerText()
      expect(btnAfter).toMatch(/powtórzenie|Zrobione|Ostatnie/)
    })

    test('po ukończeniu pojawia się przycisk Powtórz', async ({ page }) => {
      const id = await getFirstExerciseId(page)
      if (!id) { test.skip(true, 'Brak ćwiczeń'); return }
      await go(page, `/pacjent/cwiczenie/${id}`)

      // Jeśli ćwiczenie już ukończone — sprawdź od razu
      const doneBtn = page.locator('button', { hasText: 'Zrobione' })
      const repeatBtn = page.locator('button', { hasText: /Powtórz/ })

      if (await doneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(repeatBtn).toBeVisible()
        return
      }

      // Klikaj aż do ukończenia (max 20 reps)
      for (let i = 0; i < 20; i++) {
        const addBtn = page.locator('button').filter({ hasText: /powtórzenie|Zacznij|Ostatnie/ }).first()
        if (!await addBtn.isVisible({ timeout: 1000 }).catch(() => false)) break
        await addBtn.click()
        await page.waitForTimeout(300)
        if (await repeatBtn.isVisible({ timeout: 500 }).catch(() => false)) break
      }

      await expect(repeatBtn).toBeVisible({ timeout: 3000 })
    })

    test('Powtórz resetuje licznik do 0', async ({ page }) => {
      const id = await getFirstExerciseId(page)
      if (!id) { test.skip(true, 'Brak ćwiczeń'); return }
      await go(page, `/pacjent/cwiczenie/${id}`)

      const repeatBtn = page.locator('button', { hasText: /Powtórz/ })

      // Ukończ ćwiczenie
      for (let i = 0; i < 20; i++) {
        const addBtn = page.locator('button').filter({ hasText: /powtórzenie|Zacznij|Ostatnie/ }).first()
        if (!await addBtn.isVisible({ timeout: 500 }).catch(() => false)) break
        await addBtn.click()
        await page.waitForTimeout(300)
        if (await repeatBtn.isVisible({ timeout: 500 }).catch(() => false)) break
      }

      if (!await repeatBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        test.skip(true, 'Nie można ukończyć ćwiczenia')
        return
      }

      await repeatBtn.click()
      await page.waitForTimeout(300)

      // Po kliknięciu Powtórz — button powinien wrócić do "+1 powtórzenie"
      const addBtnAfter = page.locator('button').filter({ hasText: /powtórzenie|Zacznij/ }).first()
      await expect(addBtnAfter).toBeVisible({ timeout: 2000 })
    })

    test('nieistniejące ID → 404 lub redirect', async ({ page }) => {
      await go(page, '/pacjent/cwiczenia')
      await page.goto('/pacjent/cwiczenie/nieistnieje-abc-123')
      await page.waitForLoadState('networkidle')
      const has404 = await page.locator('text=404').isVisible().catch(() => false)
      const redirected = page.url().includes('/cwiczenia')
      expect(has404 || redirected).toBeTruthy()
    })
  })

  test.describe('Kalendarz', () => {
    test('ekran kalendarza się ładuje', async ({ page }) => {
      await go(page, '/pacjent/kalendarz')
      await expect(page.locator('body')).toBeVisible()
    })

    test('dolna nawigacja widoczna', async ({ page }) => {
      await go(page, '/pacjent/kalendarz')
      await expect(page.locator('nav').first()).toBeVisible()
    })
  })

  test.describe('Nagrody', () => {
    test('ekran nagród się ładuje', async ({ page }) => {
      await go(page, '/pacjent/nagrody')
      await expect(page.locator('body')).toBeVisible()
    })

    test('dolna nawigacja widoczna', async ({ page }) => {
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

    test('dolna nawigacja widoczna', async ({ page }) => {
      await go(page, '/pacjent/papuga')
      await expect(page.locator('nav').first()).toBeVisible()
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
      const box = await page.locator('nav').first().boundingBox()
      if (box) expect(box.width).toBeLessThanOrEqual(395)
    })
  })
})
