import { defineConfig, devices } from '@playwright/test'

// To servere fra samme bygg (`pnpm build` først):
//  :3000 – prototypen med lokal kurv (DATA_SOURCE=json)
//  :3001 – WooCommerce-kurv mot en falsk WooCommerce på :4010 (test/e2e/falsk-woo.mjs)
// Ingen av dem gjør kall mot Reginas butikk utover produktbildene.
export default defineConfig({
  testDir: 'test/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: { locale: 'nb-NO', trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'node test/e2e/falsk-woo.mjs 4010',
      url: 'http://localhost:4010/wp-json/wc/store/v1/cart',
      reuseExistingServer: true,
    },
    {
      command: 'pnpm start -p 3000',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'pnpm start -p 3001',
      url: 'http://localhost:3001',
      reuseExistingServer: true,
      timeout: 120_000,
      env: { KURV: 'woocommerce', WOO_URL: 'http://localhost:4010' },
    },
  ],
  projects: [
    {
      name: 'desktop',
      testIgnore: /woocommerce\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: 'mobil',
      testIgnore: /woocommerce\.spec\.ts|tilgjengelighet\.spec\.ts/,
      use: { ...devices['Pixel 7'], baseURL: 'http://localhost:3000', viewport: { width: 375, height: 812 } },
    },
    {
      name: 'woocommerce',
      testMatch: /woocommerce\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
})
