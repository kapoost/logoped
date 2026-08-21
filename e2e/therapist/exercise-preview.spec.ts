import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })
let cloneUrl = ''

// uwaga: '+ Dodaj własne' też pasuje do prefiksu /logopeda/cwiczenia/ — wykluczamy
const CARD = 'a[href^="/logopeda/cwiczenia/"]:not([href$="/nowe"])'

// Testy klonowania piszą do bazy — sprzątamy sesją admina, żeby nie zostawiać śmieci
test.afterAll(async ({ browser }) => {
  if (!cloneUrl) return
  const id = cloneUrl.split('/').pop()
  const ctx = await browser.newContext({ storageState: 'e2e/.auth/admin.json' })
  await ctx.request.post('/api/admin/delete-exercise', { data: { exercise_id: id } })
  await ctx.close()
})

test('kafelek na liście prowadzi do podglądu', async ({ page }) => {
  await page.goto('/logopeda/cwiczenia')
  await page.waitForLoadState('networkidle')
  const first = page.locator(CARD).first()
  const title = (await first.locator('p').first().textContent())?.trim()
  await first.click()
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/\/logopeda\/cwiczenia\/[0-9a-f-]{36}$/)
  await expect(page.locator('h1')).toContainText(title!)
  // kroki instrukcji wyrenderowane
  await expect(page.locator('ol li').first()).toBeVisible()
  await expect(page.getByText('Przebieg ćwiczenia')).toBeVisible()
})

test('publiczne ćwiczenie oferuje klon, nie edycję', async ({ page }) => {
  await page.goto('/logopeda/cwiczenia')
  await page.waitForLoadState('networkidle')
  await page.locator(CARD).first().click()
  await page.waitForURL(/\/logopeda\/cwiczenia\/[0-9a-f-]{36}$/)
  await expect(page.getByText('z bazy publicznej')).toBeVisible()
  await expect(page.getByRole('button', { name: /Sklonuj po swojemu/ })).toBeVisible()
  await expect(page.getByText('Edytuj ćwiczenie')).toHaveCount(0)
})

test('klon tworzy własną kopię i otwiera edycję', async ({ page }) => {
  await page.goto('/logopeda/cwiczenia')
  await page.waitForLoadState('networkidle')
  await page.locator(CARD).first().click()
  await page.waitForURL(/\/logopeda\/cwiczenia\/[0-9a-f-]{36}$/)
  const orig = (await page.locator('h1').textContent())?.trim()

  await page.getByRole('button', { name: /Sklonuj po swojemu/ }).click()
  await page.waitForURL(/\/edytuj$/, { timeout: 15000 })
  await expect(page.locator('input[type="text"]').first()).toHaveValue(`${orig} (moja wersja)`)
  // kopia jest prywatna
  await expect(page.getByText('Prywatne')).toBeVisible()
  cloneUrl = page.url().replace('/edytuj', '')
})

test('edycja własnej kopii zapisuje się', async ({ page }) => {
  await page.goto(cloneUrl + '/edytuj')
  await page.waitForLoadState('networkidle')
  await page.locator('input[type="text"]').first().fill('Moje autorskie ćwiczenie')
  await page.locator('textarea').fill('1. pierwszy krok\n2. drugi krok')
  await page.getByRole('button', { name: /Zapisz zmiany/ }).click()
  await expect(page.getByText('Zmiany zapisane!')).toBeVisible({ timeout: 10000 })
  await page.waitForURL(cloneUrl, { timeout: 10000 })
  await expect(page.locator('h1')).toContainText('Moje autorskie ćwiczenie')
  await expect(page.getByText('Twoje ćwiczenie')).toBeVisible()
  await expect(page.getByRole('link', { name: /Edytuj ćwiczenie/ })).toBeVisible()
  await expect(page.locator('ol li')).toHaveCount(2)
})

test('cudzego ćwiczenia nie da się edytować bezpośrednim URL-em', async ({ page }) => {
  await page.goto('/logopeda/cwiczenia')
  await page.waitForLoadState('networkidle')
  const href = await page.locator(CARD).first().getAttribute('href')
  await page.goto(`${href}/edytuj`)
  await page.waitForLoadState('networkidle')
  // redirect na podgląd
  await expect(page).toHaveURL(new RegExp(`${href}$`))
})

test('API odrzuca edycję cudzego ćwiczenia', async ({ page }) => {
  await page.goto('/logopeda/cwiczenia')
  const href = await page.locator(CARD).first().getAttribute('href')
  const id = href!.split('/').pop()
  const res = await page.evaluate(async (id) => {
    const r = await fetch('/api/logopeda/update-exercise', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_id: id, title: 'przejęte', instructions: 'x' }),
    })
    return { status: r.status, body: await r.json() }
  }, id)
  expect(res.status).toBe(403)
  expect(res.body.error).toContain('Sklonuj')
})

test('logopeda archiwizuje i przywraca własne ćwiczenie', async ({ page }) => {
  test.skip(!cloneUrl, 'Brak klonu z poprzedniego testu')
  await page.goto(cloneUrl)
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: /Archiwizuj/ }).click()
  await expect(page.getByText('To ćwiczenie jest w archiwum')).toBeVisible({ timeout: 10000 })

  // zniknęło z głównej listy, jest w sekcji archiwum
  await page.goto('/logopeda/cwiczenia')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: /Twoje archiwum/ })).toBeVisible()

  await page.goto(cloneUrl)
  await page.getByRole('button', { name: /Przywróć do bazy/ }).click()
  await expect(page.getByText('To ćwiczenie jest w archiwum')).toHaveCount(0, { timeout: 10000 })
})

test('nieużywane własne ćwiczenie da się usunąć trwale', async ({ page }) => {
  test.skip(!cloneUrl, 'Brak klonu z poprzedniego testu')
  await page.goto(cloneUrl)
  await page.waitForLoadState('networkidle')
  page.on('dialog', d => d.accept())
  await page.getByRole('button', { name: /Usuń trwale/ }).click()
  await page.waitForURL(/\/logopeda\/cwiczenia$/, { timeout: 10000 })
  // usunięte — podgląd zwraca 404
  const res = await page.request.get(cloneUrl)
  expect(res.status()).toBe(404)
  cloneUrl = ''   // afterAll nie ma już czego sprzątać
})
