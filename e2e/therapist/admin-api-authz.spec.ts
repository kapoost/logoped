import { test, expect } from '@playwright/test'

test('logopeda nie może wywołać /api/admin/update-exercise', async ({ page }) => {
  await page.goto('/logopeda')
  const status = await page.evaluate(async () => {
    const r = await fetch('/api/admin/update-exercise', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_id: '00000000-0000-0000-0000-000000000000', title: 'x', instructions: 'y' }),
    })
    return r.status
  })
  expect(status).toBe(403)
})

test('anonim nie może wywołać /api/admin/update-exercise', async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const res = await ctx.request.post('/api/admin/update-exercise', {
    data: { exercise_id: '00000000-0000-0000-0000-000000000000', title: 'x', instructions: 'y' },
    maxRedirects: 0,
  })
  // middleware odbija anonima na /login zanim route się wykona
  expect(res.status()).toBe(307)
  expect(res.headers()['location']).toContain('/login')
  await ctx.close()
})
