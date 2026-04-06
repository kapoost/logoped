// e2e/helpers/index.ts
import { Page, expect } from '@playwright/test'

export const URLS = {
  login:           '/login',
  register:        '/register',
  admin:           '/admin/dashboard',
  adminTherapists: '/admin/logopedzi',
  adminExercises:  '/admin/cwiczenia',
  therapist:       '/logopeda/pacjenci',
  patient:         '/pacjent/cwiczenia',
  health:          '/api/health',
  demoReset:       '/api/demo/reset',
  pushSend:        '/api/push/send',
}

export const CRON_SECRET = process.env.CRON_SECRET
  ?? '94a8267d726eb64ffe100d5ade91b07b7900a1616249d74675d294e4868a1e52'

export const DEMO = {
  email:    'demo@logoped.pl',
  password: 'Demo2026!',
}

// Sprawdź czy jesteśmy zalogowani — skip jeśli nie
export async function requireAuth(page: Page, url: string, who = 'użytkownik') {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  if (page.url().includes('/login')) {
    throw new Error(`Brak sesji ${who} — dodaj credentials do .env.test`)
  }
}

// Upewnij się że jesteś na /login
export async function assertRedirectToLogin(page: Page, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  expect(page.url()).toContain('/login')
}

// Sprawdź że URL NIE zawiera redirect parametru
export async function assertNoRedirectInUrl(page: Page) {
  const url = page.url()
  expect(url).not.toContain('redirect=')
  expect(url).not.toContain('password=')
}
