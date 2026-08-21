// e2e/admin/exercise-lifecycle.spec.ts
// Archiwizacja / przywracanie / blokada twardego usunięcia — panel admina.
// Wymaga migracji 010_exercise_archive.sql.

import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

async function goAdmin(page: any, path: string) {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  if (page.url().includes('/login')) test.skip(true, 'Brak sesji admina')
}

test('lista pokazuje użycie w planach', async ({ page }) => {
  await goAdmin(page, '/admin/cwiczenia')
  await expect(page.locator('th', { hasText: 'Użycie' }).first()).toBeVisible()
  // co najmniej jedno ćwiczenie jest w planach — kolumna to pokazuje
  const used = page.locator('td', { hasText: /\d+ (plan|planów)/ }).first()
  await expect(used).toBeVisible()
})

test('ćwiczenie w planach nie ma przycisku trwałego usunięcia', async ({ page }) => {
  await goAdmin(page, '/admin/cwiczenia')
  const row = page.locator('tr').filter({ has: page.locator('td', { hasText: /\d+ (plan|planów)/ }) }).first()
  await expect(row.getByRole('button', { name: 'Archiwizuj' })).toBeVisible()
  await expect(row.getByRole('button', { name: 'Usuń' })).toHaveCount(0)
  await expect(row.getByText(/w \d+ (planie|planach)/)).toBeVisible()
})

test('API blokuje usunięcie używanego ćwiczenia z czytelnym błędem', async ({ page }) => {
  await goAdmin(page, '/admin/cwiczenia')
  // weź ID z wiersza, który ma niezerowe użycie
  const row = page.locator('tr').filter({ has: page.locator('td', { hasText: /\d+ (plan|planów)/ }) }).first()
  const href = await row.locator('a[href^="/admin/cwiczenia/"]').first().getAttribute('href')
  const id = href!.split('/').pop()

  const res = await page.evaluate(async (id) => {
    const r = await fetch('/api/admin/delete-exercise', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_id: id }),
    })
    return { status: r.status, body: await r.json() }
  }, id)

  expect(res.status).toBe(409)
  expect(res.body.error).toContain('zarchiwizuj')
  expect(res.body.usage.planCount).toBeGreaterThan(0)
})

test('archiwizacja i przywrócenie przechodzą pełny cykl', async ({ page }) => {
  await goAdmin(page, '/admin/cwiczenia')
  const row = page.locator('tbody tr').first()
  const title = (await row.locator('a').first().textContent())!.trim()

  await row.getByRole('button', { name: 'Archiwizuj' }).click()
  await expect(page.getByRole('heading', { name: /Archiwum \(/ })).toBeVisible({ timeout: 10000 })

  const archRow = page.locator('tbody tr').filter({ hasText: title }).last()
  await expect(archRow.getByRole('button', { name: 'Przywróć' })).toBeVisible()

  // zarchiwizowane znika z licznika bazy publicznej
  await expect(page.getByText(/w archiwum/)).toBeVisible()

  await archRow.getByRole('button', { name: 'Przywróć' }).click()
  await expect(page.getByRole('heading', { name: /Archiwum \(/ })).toHaveCount(0, { timeout: 10000 })
})

test('podgląd admina pokazuje metryki użycia i akcje', async ({ page }) => {
  await goAdmin(page, '/admin/cwiczenia')
  await page.locator('tbody tr').first().locator('a[href^="/admin/cwiczenia/"]').first().click()
  await page.waitForURL(/\/admin\/cwiczenia\/[0-9a-f-]{36}$/)
  await expect(page.getByText('Przebieg ćwiczenia')).toBeVisible()
  await expect(page.getByText('pacjentów')).toBeVisible()
  await expect(page.getByRole('link', { name: /Edytuj/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Archiwizuj/ })).toBeVisible()
})
