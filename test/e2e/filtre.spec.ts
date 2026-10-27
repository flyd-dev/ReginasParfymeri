import { expect, test } from '@playwright/test'

test.describe('filtre i adressen', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, 'filterpanelet på stor skjerm')

  test('merkefilter kan deles og nullstilles', async ({ page }) => {
    await page.goto('/produktkategori/duft/nisjeduft/')
    const antall = page.getByText(/^\d+ produkter$/).first()
    await expect(antall).toHaveText('161 produkter')
    await page
      .getByRole('complementary', { name: 'Filtre' })
      .getByRole('link', { name: /^Creed/ })
      .click()
    await expect(page).toHaveURL(/merke=creed/)
    await expect(antall).not.toHaveText('161 produkter')
    // Lenken kan deles: samme adresse gir samme liste.
    const url = page.url()
    await page.goto(url)
    await expect(
      page.getByRole('list', { name: 'Aktive filtre' }).getByRole('link', { name: /Creed/ }),
    ).toBeVisible()
    await page.getByRole('link', { name: 'Nullstill' }).click()
    await expect(page).not.toHaveURL(/merke=/)
    await expect(antall).toHaveText('161 produkter')
  })
})

test('mobil: filtrene ligger i en skuff', async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) >= 1024, 'bare mobil')
  await page.goto('/produktkategori/duft/nisjeduft/')
  await page.getByRole('button', { name: /Filtrer/ }).click()
  const skuff = page.getByRole('dialog', { name: 'Filtrer' })
  await skuff.getByRole('link', { name: /^Initio/ }).click()
  await expect(page).toHaveURL(/merke=initio/)
  await expect(skuff.getByRole('button', { name: /Vis \d+ produkter/ })).toBeVisible()
})
