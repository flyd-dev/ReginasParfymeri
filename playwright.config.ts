import { defineConfig, devices } from '@playwright/test'

// Kjører mot en Next-server på :3000. Start den selv (`pnpm dev` eller `pnpm build && pnpm start`),
// eller la Playwright starte produksjonsbygget.
export default defineConfig({
  testDir: 'test/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:3000', locale: 'nb-NO', trace: 'retain-on-failure' },
  webServer: {
    command: 'pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobil', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
})
