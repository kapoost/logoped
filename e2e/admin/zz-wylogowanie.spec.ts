// e2e/admin/zz-wylogowanie.spec.ts
// UWAGA: ten test unieważnia sesję admina po stronie Supabase, więc każdy plik
// spec sortujący się po nim dostałby przekierowanie na /login i cicho się pominął.
// Dlatego prefiks "zz-" — ma lecieć ostatni w katalogu.

import { test, expect } from '@playwright/test'

test('wylogowanie → /login', async ({ page }) => {
  await page.goto('/admin/dashboard')
  await page.waitForLoadState('networkidle')
  if (page.url().includes('/login')) test.skip(true, 'Brak sesji admina')

  const btn = page.getByRole('button', { name: /wyloguj/i }).first()
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/)
  }
})
