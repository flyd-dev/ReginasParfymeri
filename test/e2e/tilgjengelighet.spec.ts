// WCAG 2.1 AA med axe på de viktigste sidene (oppdraget §8).

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const SIDER = [
  '/',
  '/produktkategori/duft/nisjeduft/',
  '/produkt/initio-side-effect-edp/',
  '/merker/',
  '/brand/chanel/',
  '/sok/?q=creed',
  '/kontakt/',
  '/betingelser/',
  '/handlekurv/',
]

// Innganger og avsløringer (R-30) er midlertidige tilstander: tekst som glir inn har lav opacity et øyeblikk.
// axe måler derfor siden slik den står ferdig – med redusert bevegelse, der alt står der fra start.
test.use({ reducedMotion: 'reduce' })

for (const sti of SIDER) {
  test(`ingen WCAG 2.1 AA-brudd på ${sti}`, async ({ page }) => {
    await page.goto(sti)
    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    const brudd = resultat.violations.map(
      (v) => `${v.id}: ${v.nodes.length} (${v.nodes[0]?.target.join(' ')})`,
    )
    expect(brudd).toEqual([])
  })
}

test('menyen kan brukes med tastatur', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Duft', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('link', { name: /^Nisjeduft$/ }).first()).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('link', { name: /^Nisjeduft$/ }).first()).toBeHidden()
})
