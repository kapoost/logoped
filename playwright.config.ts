import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const IS_REMOTE = !BASE_URL.includes('localhost')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'public',
      testMatch: /e2e\/public\/.*/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'integration',
      testMatch: /e2e\/integration\/.*/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'admin',
      testMatch: /e2e\/admin\/.*/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/admin.json' },
    },
    {
      name: 'therapist',
      testMatch: /e2e\/therapist\/.*/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/therapist.json' },
    },
    {
      name: 'completion',
      testMatch: /e2e\/patient\/completion\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, storageState: 'e2e/.auth/patient.json' },
    },
    {
      name: 'api',
      testMatch: /e2e\/api\/.*/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'demo',
      testMatch: /e2e\/demo\/.*/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'patient',
      testMatch: /e2e\/patient\/.*/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        storageState: 'e2e/.auth/patient.json',
      },
    },
  ],
  webServer: IS_REMOTE ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
