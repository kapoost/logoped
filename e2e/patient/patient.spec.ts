// e2e/patient/patient.spec.ts
// Konto testowe: andriej.klomogorov@gmail.com (prawdziwy pacjent z planem w DB)
// StorageState z setupu — sesja zalogowanego pacjenta

import { test, expect } from '@playwright/test'

async function go(page: any, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  if (page.url().includes('/login')) test.skip(true, 'Brak sesji pacjenta')
}

async function getFirstExerciseLink(page: any) {
  await go(page, '/pacjent/cwiczenia')
  const link = page.locator('a[href*="/pacjent/cwiczenie/"]').first()
  const visible = await link.isVisible({ timeout: 3000 }).catch(() => false)
  return visible ? link : null
}

// ── NAWIGACJA ────────────────────────────────────────────────────────────────
// Sprawdza że dolna nawigacja działa poprawnie między 4 zakładkami

test.describe('Nawigacja dolna', () => {
  test('4 zakładki są widoczne', async ({ page }) => {
    await go(page, '/pacjent/cwiczenia')
    await expect(page.locator('nav').first().locator('a')).toHaveCount(4)
  })

  test('ikony są SVG (nie emoji)', async ({ page }) => {
    await go(page, '/pacjent/cwiczenia')
    expect(await page.locator('nav svg').count()).toBeGreaterThanOrEqual(4)
  })

  test('Kalendarz → zmienia URL', async ({ page }) => {
    await go(page, '/pacjent/cwiczenia')
    await page.click('a[href="/pacjent/kalendarz"]')
    await expect(page).toHaveURL(/\/pacjent\/kalendarz/)
  })

  test('Nagrody → zmienia URL', async ({ page }) => {
    await go(page, '/pacjent/cwiczenia')
    await page.click('a[href="/pacjent/nagrody"]')
    await expect(page).toHaveURL(/\/pacjent\/nagrody/)
  })

  test('Papuga → zmienia URL', async ({ page }) => {
    await go(page, '/pacjent/cwiczenia')
    await page.click('a[href="/pacjent/papuga"]')
    await expect(page).toHaveURL(/\/pacjent\/papuga/)
  })

  test('powrót z Kalendarza → Ćwiczenia', async ({ page }) => {
    await go(page, '/pacjent/kalendarz')
    await page.click('a[href="/pacjent/cwiczenia"]')
    await expect(page).toHaveURL(/\/pacjent\/cwiczenia/)
  })
})

// ── LISTA ĆWICZEŃ ─────────────────────────────────────────────────────────────
// Sprawdza ekran główny pacjenta: gwiazdki postępu, karty ćwiczeń

test.describe('Lista ćwiczeń (ekran główny)', () => {
  test('ładuje się poprawnie', async ({ page }) => {
    await go(page, '/pacjent/cwiczenia')
    await expect(page.locator('body')).toBeVisible()
  })

  test('imię pacjenta widoczne w nagłówku', async ({ page }) => {
    await go(page, '/pacjent/cwiczenia')
    // Nagłówek z "Cześć, {imię}!"
    const header = page.getByText(/Cześć/).first()
    await expect(header).toBeVisible()
  })

  test('pasek postępu lub gwiazdki widoczne', async ({ page }) => {
    await go(page, '/pacjent/cwiczenia')
    const stars = page.locator('text=⭐').first()
    await expect(stars).toBeVisible({ timeout: 5000 })
  })

  test('karta ćwiczenia jest tapowalna (link do widoku)', async ({ page }) => {
    const link = await getFirstExerciseLink(page)
    if (!link) { test.skip(true, 'Brak ćwiczeń'); return }
    await expect(link).toBeVisible()
  })

  test('przycisk Gotowe! widoczny na aktywnej karcie', async ({ page }) => {
    await go(page, '/pacjent/cwiczenia')
    // Przycisk szybkiego zaznaczenia bez otwierania widoku
    const btn = page.getByRole('button', { name: /Gotowe/ }).first()
    await expect(btn).toBeVisible({ timeout: 5000 })
  })
})

// ── WIDOK ĆWICZENIA ───────────────────────────────────────────────────────────
// Sprawdza szczegółowy widok ćwiczenia: licznik, kroki, przycisk +1

test.describe('Widok ćwiczenia — przepływ', () => {
  test('widok ładuje się i pokazuje tytuł', async ({ page }) => {
    const link = await getFirstExerciseLink(page)
    if (!link) { test.skip(true, 'Brak ćwiczeń'); return }
    await link.click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('kołowy licznik SVG jest widoczny', async ({ page }) => {
    const link = await getFirstExerciseLink(page)
    if (!link) { test.skip(true, 'Brak ćwiczeń'); return }
    await link.click()
    await page.waitForLoadState('networkidle')
    // SVG licznika z circle progress
    await expect(page.locator('svg').first()).toBeVisible()
  })

  test('kółka powtórzeń są widoczne', async ({ page }) => {
    const link = await getFirstExerciseLink(page)
    if (!link) { test.skip(true, 'Brak ćwiczeń'); return }
    await link.click()
    await page.waitForLoadState('networkidle')
    // Kółka div z rounded-full
    const circles = page.locator('.rounded-full.border-2')
    expect(await circles.count()).toBeGreaterThan(0)
  })

  test('instrukcje (kroki) są widoczne', async ({ page }) => {
    const link = await getFirstExerciseLink(page)
    if (!link) { test.skip(true, 'Brak ćwiczeń'); return }
    await link.click()
    await page.waitForLoadState('networkidle')
    // Kroki z numerkami 1, 2, 3
    await expect(page.locator('text=1').first()).toBeVisible()
  })

  test('przycisk akcji w widoku ćwiczenia jest widoczny', async ({ page }) => {
    const link = await getFirstExerciseLink(page)
    if (!link) { test.skip(true, 'Brak ćwiczeń'); return }
    await link.click()
    await page.waitForLoadState('networkidle')

    // Sprawdź że jest JAKIKOLWIEK przycisk (główny lub Powtórz)
    const anyBtn = page.locator('button').first()
    await expect(anyBtn).toBeVisible({ timeout: 5000 })

    // Sprawdź że jest SVG licznika (kołowy progress)
    await expect(page.locator('svg circle').first()).toBeVisible()
  })

  test('← wraca do listy ćwiczeń', async ({ page }) => {
    const link = await getFirstExerciseLink(page)
    if (!link) { test.skip(true, 'Brak ćwiczeń'); return }
    await link.click()
    await page.waitForLoadState('networkidle')
    await page.locator('a[href="/pacjent/cwiczenia"]').first().click()
    await expect(page).toHaveURL(/\/pacjent\/cwiczenia/)
  })

  test('kliknięcie +1 zmienia stan przycisku', async ({ page }) => {
    const link = await getFirstExerciseLink(page)
    if (!link) { test.skip(true, 'Brak ćwiczeń'); return }
    await link.click()
    await page.waitForLoadState('networkidle')

    // Tylko jeśli nie ukończono — tap +1
    const addBtn = page.locator('button').filter({ hasText: /powtórzenie|Zacznij/ }).first()
    if (!await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      test.skip(true, 'Ćwiczenie już ukończone — skip')
      return
    }

    const textBefore = await addBtn.innerText()
    await addBtn.click()
    await page.waitForTimeout(400)
    const textAfter = await page.locator('button').first().innerText()
    // Tekst się zmienił (licznik wzrósł) lub ćwiczenie ukończone
    expect(textAfter).not.toBe(textBefore)
  })

  test('po ukończeniu przez listę: widok pokazuje Zrobione + Powtórz', async ({ page }) => {
    // Strategia: użyj "Gotowe!" z listy (nie przez rep-counting w widoku)
    // Dzięki temu: completed_today=true w DB, widok ćwiczenia od razu pokazuje stan ukończony
    await go(page, '/pacjent/cwiczenia')

    // Sprawdź czy jest przycisk Gotowe! na liście
    const gotowBtn = page.getByRole('button', { name: /Gotowe/ }).first()
    if (!await gotowBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'Brak aktywnych ćwiczeń na liście')
      return
    }

    // Zapamiętaj href ćwiczenia PRZED kliknięciem Gotowe
    const exerciseLink = page.locator('a[href*="/pacjent/cwiczenie/"]').first()
    const href = await exerciseLink.getAttribute('href').catch(() => null)
    if (!href) { test.skip(true, 'Brak linku do ćwiczenia'); return }

    // Kliknij Gotowe! — zapisuje do DB bez nawigacji
    await gotowBtn.click()
    await page.waitForTimeout(500)

    // Teraz otwórz widok ukończonego ćwiczenia
    await page.goto(href)
    await page.waitForLoadState('networkidle')

    // Powinien od razu pokazać stan ukończony (completed_today=true)
    const repeatBtn = page.locator('button', { hasText: /Powtórz/ })
    await expect(repeatBtn).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Zrobione').first()).toBeVisible()
  })

  test('Powtórz → resetuje licznik (przycisk wraca do +1)', async ({ page }) => {
    const link = await getFirstExerciseLink(page)
    if (!link) { test.skip(true, 'Brak ćwiczeń'); return }
    await link.click()
    await page.waitForLoadState('networkidle')

    const repeatBtn = page.locator('button', { hasText: /Powtórz/ })
    const addBtn    = page.locator('button').filter({ hasText: /powtórzenie|Zacznij|Ostatnie/ }).first()

    // Ukończ jeśli nie ukończone
    for (let i = 0; i < 20; i++) {
      if (!await addBtn.isVisible({ timeout: 500 }).catch(() => false)) break
      await addBtn.click()
      await page.waitForTimeout(300)
      if (await repeatBtn.isVisible({ timeout: 300 }).catch(() => false)) break
    }

    if (!await repeatBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      test.skip(true, 'Nie można ukończyć — skip')
      return
    }

    await repeatBtn.click()
    await page.waitForTimeout(400)

    // Po Powtórz — licznik wraca do 0, przycisk pokazuje "Zacznij" lub "1/N"
    const addBtnAfter = page.locator('button').filter({ hasText: /powtórzenie|Zacznij/ }).first()
    await expect(addBtnAfter).toBeVisible({ timeout: 2000 })
  })

  test('nieistniejące ID → 404 lub redirect do listy', async ({ page }) => {
    await go(page, '/pacjent/cwiczenia')
    await page.goto('/pacjent/cwiczenie/nie-istnieje-000-abc')
    await page.waitForLoadState('networkidle')
    const has404     = await page.locator('text=404').isVisible().catch(() => false)
    const redirected = page.url().includes('/cwiczenia')
    expect(has404 || redirected).toBeTruthy()
  })
})

// ── INNE EKRANY ──────────────────────────────────────────────────────────────

test.describe('Kalendarz', () => {
  test('ekran kalendarza się ładuje', async ({ page }) => {
    await go(page, '/pacjent/kalendarz')
    await expect(page.locator('body')).toBeVisible()
  })

  test('nawigacja dolna widoczna', async ({ page }) => {
    await go(page, '/pacjent/kalendarz')
    await expect(page.locator('nav').first()).toBeVisible()
  })
})

test.describe('Nagrody', () => {
  test('ekran nagród się ładuje', async ({ page }) => {
    await go(page, '/pacjent/nagrody')
    await expect(page.locator('body')).toBeVisible()
  })

  test('nawigacja dolna widoczna', async ({ page }) => {
    await go(page, '/pacjent/nagrody')
    await expect(page.locator('nav').first()).toBeVisible()
  })
})

test.describe('Papuga', () => {
  test('ekran papugi się ładuje', async ({ page }) => {
    await go(page, '/pacjent/papuga')
    await expect(page.locator('body')).toBeVisible()
  })

  test('wielka papuga (SVG) jest w DOM', async ({ page }) => {
    await go(page, '/pacjent/papuga')
    await expect(page.locator('svg').first()).toBeVisible()
  })

  test('nawigacja dolna widoczna', async ({ page }) => {
    await go(page, '/pacjent/papuga')
    await expect(page.locator('nav').first()).toBeVisible()
  })
})

// ── RESPONSYWNOŚĆ ─────────────────────────────────────────────────────────────
// Viewport 390x844 (iPhone) — ustawiony w playwright.config.ts dla projektu patient

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

  test('przycisk +1 ma odpowiednią wysokość (min 56px)', async ({ page }) => {
    const link = await getFirstExerciseLink(page)
    if (!link) { test.skip(true, 'Brak ćwiczeń'); return }
    await link.click()
    await page.waitForLoadState('networkidle')
    const btn = page.locator('button').first()
    const box = await btn.boundingBox()
    if (box) expect(box.height).toBeGreaterThanOrEqual(56)
  })
})
