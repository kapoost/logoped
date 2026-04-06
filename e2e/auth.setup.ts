// e2e/auth.setup.ts
// Loguje przez Supabase API bezpośrednio — niezależne od UI formularza
import { test as setup, expect, request } from '@playwright/test'
import * as fs from 'fs'

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://qeoeqjotlwbbwhdevwxu.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_nR2IzbPhMHczzQYEqrpbVA_Z7qoZU6o'

const ROLES = [
  {
    name:     'admin',
    email:    process.env.TEST_ADMIN_EMAIL    ?? 'kapoost@gmail.com',
    password: process.env.TEST_ADMIN_PASSWORD ?? 'Q2dm1.map',
    file:     'e2e/.auth/admin.json',
  },
  {
    name:     'therapist',
    email:    process.env.TEST_THERAPIST_EMAIL    ?? '',
    password: process.env.TEST_THERAPIST_PASSWORD ?? '',
    file:     'e2e/.auth/therapist.json',
  },
  {
    name:     'patient',
    email:    process.env.TEST_PATIENT_EMAIL    ?? '',
    password: process.env.TEST_PATIENT_PASSWORD ?? '',
    file:     'e2e/.auth/patient.json',
  },
]

setup.beforeAll(() => {
  fs.mkdirSync('e2e/.auth', { recursive: true })
})

for (const role of ROLES) {
  setup(`zaloguj jako ${role.name}`, async ({ browser }) => {
    if (!role.email || !role.password) {
      console.log(`⚠ Brak credentials dla ${role.name} — pomijam`)
      fs.writeFileSync(role.file, JSON.stringify({ cookies: [], origins: [] }))
      return
    }

    // 1. Zaloguj przez Supabase REST API → dostajemy access_token i refresh_token
    const api = await request.newContext()
    const res = await api.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
        },
        data: { email: role.email, password: role.password },
      }
    )

    if (!res.ok()) {
      const body = await res.json().catch(() => ({}))
      console.warn(`⚠ ${role.name}: Supabase auth failed — ${body.error_code ?? res.status()}`)
      fs.writeFileSync(role.file, JSON.stringify({ cookies: [], origins: [] }))
      return
    }

    const { access_token, refresh_token } = await res.json()

    // 2. Otwórz stronę i wstrzyknij sesję przez localStorage (Supabase SSR czyta z cookie)
    const context = await browser.newContext({ baseURL: BASE })
    const page    = await context.newPage()

    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')

    // Wstrzyknij tokeny do localStorage — Supabase client je odbierze
    const storageKey = `sb-${SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`
    await page.evaluate(
      ({ key, access, refresh }) => {
        localStorage.setItem(key, JSON.stringify({
          access_token: access,
          refresh_token: refresh,
          token_type: 'bearer',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }))
      },
      { key: storageKey, access: access_token, refresh: refresh_token }
    )

    // 3. Odśwież stronę — middleware odczyta sesję i przekieruje
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const url = page.url()
    if (url.includes('/login')) {
      console.warn(`⚠ ${role.name}: nadal na /login po wstrzyknięciu sesji`)
      fs.writeFileSync(role.file, JSON.stringify({ cookies: [], origins: [] }))
      await context.close()
      return
    }

    // 4. Zapisz stan sesji (cookies)
    await context.storageState({ path: role.file })
    console.log(`✓ Sesja ${role.name} zapisana (URL: ${url})`)
    await context.close()
  })
}
