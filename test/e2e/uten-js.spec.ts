// Innhold skal være synlig uten JavaScript, og kjøp skal fungere som vanlig skjema.

import { expect, test } from '@playwright/test'

test.use({ javaScriptEnabled: false })

test('produktsiden og kjøp virker uten JavaScript', async ({ page }) => {
  await page.goto('/produkt/initio-side-effect-edp/')
  await expect(page.getByRole('heading', { level: 1, name: 'Side Effect EdP' })).toBeVisible()
  await expect(page.getByText(/Parfymens noter av tobakk/)).toBeVisible()
  await page.getByText('90 ml', { exact: true }).click()
  await page.getByRole('button', { name: 'Legg i handlekurven' }).click()
  await expect(page).toHaveURL(/\/handlekurv\/$/)
  await expect(page.getByRole('link', { name: 'Side Effect EdP' })).toBeVisible()
})

test('kategorifiltre er lenker', async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 1024, 'filterpanelet på stor skjerm')
  await page.goto('/produktkategori/duft/nisjeduft/')
  await page
    .getByRole('complementary', { name: 'Filtre' })
    .getByRole('link', { name: /^Initio/ })
    .click()
  await expect(page).toHaveURL(/merke=initio/)
  await expect(page.getByText(/^\d+ produkter$/).first()).toHaveText(/^(1\d|2\d) produkter$/)
})
