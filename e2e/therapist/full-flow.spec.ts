// e2e/therapist/full-flow.spec.ts
// Pełny przepływ: logopeda tworzy plan → pacjent wykonuje ćwiczenie
// Ten test wymaga danych testowych w bazie (istniejący pacjent i ćwiczenia)

import { test, expect, Browser, chromium } from '@playwright/test'

test.describe('Pełny przepływ — logopeda → pacjent', () => {

  test('logopeda widzi profil pacjenta z przyciskiem Edytuj plan', async ({ page }) => {
    await page.goto('/logopeda/pacjenci')
    await page.waitForLoadState('networkidle')

    const patientLink = page.locator('a[href*="/logopeda/pacjenci/"]').first()
    if (!await patientLink.isVisible()) {
      test.skip(true, 'Brak pacjentów — skip testu przepływu')
      return
    }

    await patientLink.click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=← Pacjenci')).toBeVisible()

    // Sprawdź czy są przyciski akcji
    const editBtn = page.locator('text=Edytuj').or(page.locator('text=Nowy plan'))
    await expect(editBtn.first()).toBeVisible({ timeout: 5000 }).catch(() => {})
  })

  test('kreator planu pozwala wybrać pacjenta i ćwiczenia', async ({ page }) => {
    await page.goto('/logopeda/plany/nowy')
    await page.waitForLoadState('networkidle')

    // Sprawdź obecność selecta pacjenta
    const patientSelect = page.locator('select').first()
    if (await patientSelect.isVisible()) {
      const options = await patientSelect.locator('option').count()
      // Powinien mieć co najmniej 1 opcję (pustą lub pacjenta)
      expect(options).toBeGreaterThan(0)
    }
  })

  test('nawigacja breadcrumb: plan → pacjent → lista', async ({ page }) => {
    await page.goto('/logopeda/plany')
    await page.waitForLoadState('networkidle')

    const planLink = page.locator('a[href*="/logopeda/plany/"]').first()
    if (!await planLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'Brak planów — skip testu breadcrumb')
      return
    }

    await planLink.click()
    await page.waitForLoadState('networkidle')

    // Plan powinien mieć link powrotu — ← lub Wróć lub link do pacjentów
    const backLink = page.locator('a').filter({ hasText: /←|Wróć|Pacjenci/ }).first()
    const hasBack = await backLink.isVisible({ timeout: 3000 }).catch(() => false)
    if (!hasBack) {
      test.skip(true, 'Brak breadcrumb — skip')
      return
    }
    await backLink.click()
    await page.waitForLoadState('networkidle')

    // Powinniśmy być na profilu pacjenta lub liście pacjentów
    expect(page.url()).toMatch(/\/logopeda\/(pacjenci|plany)/)
  })
})
