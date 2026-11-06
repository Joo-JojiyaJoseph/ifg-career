import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests for the HR portal. They need the API running with fresh seed data and this app served:
 *   career-backend: php artisan migrate:fresh --seed && php artisan serve
 *   hr-portal:     npm run dev   (or npm run build && npm run preview)
 * Then: npm run e2e
 */
const baseURL = process.env.E2E_PORTAL_URL ?? 'http://localhost:5174'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'portal', use: { ...devices['Desktop Chrome'], baseURL } },
  ],
})
