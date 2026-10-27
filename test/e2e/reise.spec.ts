// Hovedreisen (oppdraget §8): søk → produkt → variant → kurv → kassen. Prototypen med lokal kurv.

import { expect, test, type Page } from '@playwright/test'

async function sok(page: Page, tekst: string) {
  const mobil = (page.viewportSize()?.width ?? 1280) < 1024
  await page.getByRole('button', { name: mobil ? 'Søk' : /Søk etter duft eller merke/ }).click()
  await page.getByPlaceholder('Søk etter duft, merke eller produkt').fill(tekst)
}

test('søk, velg variant, legg i kurven og gå til kassen', async ({ page }) => {
  await page.goto('/')
  await sok(page, 'side effect')
  await page
    .getByRole('option', { name: /Side Effect EdP/ })
    .first()
    .click()
  await expect(page).toHaveURL(/\/produkt\/initio-side-effect-edp\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Side Effect EdP' })).toBeVisible()

  // Et variabelt produkt får aldri en variant valgt for seg.
  const kjop = page.locator('form[action="/api/kurv/"]').first()
  await expect(kjop.getByText(/fra kr\s2\s645/)).toBeVisible()
  await page.getByRole('button', { name: 'Legg i handlekurven' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Velg størrelse først.' })).toBeVisible()

  await page.getByText('90 ml', { exact: true }).click()
  await expect(kjop.getByText(/fra kr/)).toHaveCount(0)
  await page.getByRole('button', { name: 'Legg i handlekurven' }).click()

  const kurv = page.getByRole('dialog', { name: /Handlekurv/ })
  await expect(kurv).toBeVisible()
  await expect(kurv.getByRole('link', { name: 'Side Effect EdP' })).toBeVisible()
  await expect(kurv.getByText('Størrelse: 90 ml')).toBeVisible()
  await expect(kurv.getByRole('heading', { name: 'Handlekurv (1)' })).toBeVisible()

  await kurv.getByRole('button', { name: 'Gå til kassen' }).click()
  await expect(page).toHaveURL(/\/kasse\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Kassen' })).toBeVisible()
  await expect(page.getByText(/Betaling er ikke koblet til/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Side Effect EdP' })).toBeVisible()
})

test('antall kan endres og varen fjernes i kurven', async ({ page }) => {
  await page.goto('/produkt/initio-side-effect-edp/')
  await page.getByText('50 ml', { exact: true }).click()
  await page.getByRole('button', { name: 'Legg i handlekurven' }).click()
  const kurv = page.getByRole('dialog', { name: /Handlekurv/ })
  await expect(kurv.getByText('Størrelse: 50 ml')).toBeVisible()
  await kurv.getByRole('button', { name: /Fjern Side Effect EdP/ }).click()
  await expect(kurv.getByText('Handlekurven er tom')).toBeVisible()
})

test('utsolgt vare kan ikke kjøpes, men kunden kan be om varsel', async ({ page }) => {
  await page.goto('/sok/?q=creed&lager=')
  await page.goto('/produktkategori/duft/nisjeduft/?sorter=navn')
  const utsolgt = page.locator('article', { has: page.getByText('Utsolgt', { exact: true }) }).first()
  await utsolgt.getByRole('link').first().click()
  await expect(page.getByText('Utsolgt').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Legg i handlekurven' })).toHaveCount(0)
  await expect(page.getByText('Gi meg beskjed når den er tilbake')).toBeVisible()
})
