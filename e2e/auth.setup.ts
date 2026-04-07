// e2e/auth.setup.ts
// Loguje przez HTML form POST — tak samo jak użytkownik
import { test as setup, expect } from '@playwright/test'
import * as fs from 'fs'

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000'

const ROLES = [
  {
    name:     'admin',
    email:    process.env.TEST_ADMIN_EMAIL    ?? 'kapoost@gmail.com',
    password: process.env.TEST_ADMIN_PASSWORD ?? 'Q2dm1.map',
    file:     'e2e/.auth/admin.json',
    expected: /\/(admin|logopeda|pacjent)/,
  },
  {
    name:     'therapist',
    email:    process.env.TEST_THERAPIST_EMAIL    ?? 'logopeda-test@logoped.test',
    password: process.env.TEST_THERAPIST_PASSWORD ?? 'TestTherapist123!',
    file:     'e2e/.auth/therapist.json',
    expected: /\/logopeda/,
  },
  {
    name:     'patient',
    email:    process.env.TEST_PATIENT_EMAIL    ?? 'pacjent-test@logoped.test',
    password: process.env.TEST_PATIENT_PASSWORD ?? 'TestPatient123!',
    file:     'e2e/.auth/patient.json',
    expected: /\/pacjent/,
  },
]

setup.beforeAll(() => {
  fs.mkdirSync('e2e/.auth', { recursive: true })
})

for (const role of ROLES) {
  setup(`zaloguj jako ${role.name}`, async ({ page }) => {
    if (!role.email || !role.password) {
      console.log(`⚠ Brak credentials dla ${role.name} — pomijam`)
      fs.writeFileSync(role.file, JSON.stringify({ cookies: [], origins: [] }))
      return
    }

    // Loguj przez HTML form — identycznie jak użytkownik
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('networkidle')

    await page.locator('input[name="email"]:visible').fill(role.email)
    await page.locator('input[name="password"]:visible').fill(role.password)
    await page.getByRole('button', { name: 'Zaloguj się' }).click()
    await page.waitForLoadState('networkidle')

    const url = page.url()
    if (url.includes('/login')) {
      console.warn(`⚠ ${role.name}: nadal na /login — złe credentials?`)
      fs.writeFileSync(role.file, JSON.stringify({ cookies: [], origins: [] }))
      return
    }

    await page.context().storageState({ path: role.file })
    console.log(`✓ Sesja ${role.name} zapisana (URL: ${url})`)
  })
}
