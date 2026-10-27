// Kurv i WooCommerce via Store API og overføring til kassen – mot en falsk WooCommerce (test/e2e/falsk-woo.mjs)
// som følger kontrakten i docs/architecture.md. Den ekte testen mot staging står i testoppskriften der.

import { expect, test } from '@playwright/test'

test('kurven ligger i WooCommerce og overføres til kassen', async ({ page }) => {
  await page.goto('/produkt/initio-side-effect-edp/')
  await page.getByText('90 ml', { exact: true }).click()
  await page.getByRole('button', { name: 'Legg i handlekurven' }).click()
  const kurv = page.getByRole('dialog', { name: /Handlekurv/ })
  await expect(kurv.getByRole('link', { name: 'Side Effect EdP' })).toBeVisible()
  await expect(kurv.getByText(/Størrelse: 90/)).toBeVisible()

  // Én vare til, en enkel vare
  await page.keyboard.press('Escape')
  await page.goto('/produktkategori/duft/nisjeduft/?sorter=pris-synkende')
  const enkel = page
    .locator('article', { has: page.getByRole('button', { name: /Legg .* i handlekurven/ }) })
    .first()
  await enkel.getByRole('button', { name: /Legg .* i handlekurven/ }).click()
  await expect(
    page.getByRole('dialog', { name: /Handlekurv/ }).getByRole('heading', { name: 'Handlekurv (2)' }),
  ).toBeVisible()

  await page
    .getByRole('dialog', { name: /Handlekurv/ })
    .getByRole('button', { name: 'Gå til kassen' })
    .click()
  await expect(page).toHaveURL(/^http:\/\/localhost:4010\/\?regina_kurv=t_[0-9a-f]+$/)
  await expect(page.getByRole('heading', { name: 'WooCommerce-kassen (test)' })).toBeVisible()
  await expect(page.locator('#antall')).toHaveText('Varer: 2')
  await expect(page.getByText(/SIDE EFFECT.*90/i)).toBeVisible()
})
