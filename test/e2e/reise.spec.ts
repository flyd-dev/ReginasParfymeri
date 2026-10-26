// Hovedreisen og tilstandene rundt den, mot det lagrede katalogutdraget.
// Ingen av testene snakker med WooCommerce: produktbilder stoppes der det trengs, og kassen er i konseptmodus.

import { expect, test, type Page } from '@playwright/test'

const erMobil = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear())
})

test('forside → kategori → filter → produkt → variant → handlekurv → kasse', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Dufter du ikke')
  await page.getByRole('link', { name: /Utforsk nisjeduft/ }).click()
  await expect(page).toHaveURL(/\/kategori\/nisjeduft/)
  await expect(page.getByRole('heading', { level: 1, name: 'Nisjeduft' })).toBeVisible()

  // Filter på merke (skuff på mobil).
  if (erMobil(page)) await page.getByRole('button', { name: /^Filtrer/ }).click()
  const filtre = erMobil(page)
    ? page.getByRole('dialog', { name: 'Filtre' })
    : page.getByRole('complementary', { name: 'Filtre' })
  await filtre.getByLabel(/Initio Parfums Privés/).check()
  await expect(page).toHaveURL(/merke=initio/)
  if (erMobil(page)) await filtre.getByRole('button', { name: /^Vis 18 produkter$/ }).click()
  await expect(page.getByRole('list', { name: 'Aktive filtre' })).toContainText('Initio')
  await expect(page.locator('main')).toContainText('18 produkter')

  await page.getByRole('link', { name: 'Side Effect EdP', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Side Effect EdP' })).toBeVisible()

  // Uten valgt størrelse legges ingenting i kurven.
  await page.getByRole('button', { name: 'Legg i handlekurven' }).first().click()
  await expect(page.getByText('Velg størrelse først.')).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Handlekurven' })).toBeHidden()

  await page.getByRole('radio', { name: /90\sml/ }).check({ force: true })
  await expect(page.locator('main')).toContainText('3 305 kr')
  await page.getByRole('button', { name: 'Legg i handlekurven' }).first().click()

  const kurv = page.getByRole('dialog', { name: 'Handlekurven' })
  await expect(kurv).toBeVisible()
  await expect(kurv).toContainText('Lagt i handlekurven: Side Effect EdP · 90 ml')
  await expect(kurv).toContainText('Størrelse: 90 ml')
  await expect(kurv.getByRole('term').filter({ hasText: 'Delsum' }).locator('..')).toContainText('3 305 kr')

  await kurv.getByRole('button', { name: /Ett til av Side Effect EdP/ }).click()
  await expect(kurv).toContainText('6 610 kr')
  await expect(page.getByRole('button', { name: /Handlekurv, 2 varer/ })).toBeAttached()

  await kurv.getByRole('button', { name: /Fjern Side Effect EdP/ }).click()
  await expect(kurv).toContainText('Handlekurven er tom')
  await kurv.getByRole('button', { name: 'Lukk handlekurven' }).click()
  await expect(kurv).toBeHidden()

  // Legg i igjen og gå til kassen.
  await page.getByRole('radio', { name: /50\sml/ }).check({ force: true })
  await page.getByRole('button', { name: 'Legg i handlekurven' }).first().click()
  await kurv.getByRole('link', { name: /Gå til kassen/ }).click()
  await expect(page).toHaveURL(/\/kasse$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Se over bestillingen')
  await expect(page.locator('main')).toContainText('2 645 kr')
  await expect(page.getByRole('note')).toContainText('betaling ikke aktivert')
  // Ingen knapp som later som den betaler.
  await expect(page.getByRole('button', { name: /betal|bestill/i })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /levering og betaling/i })).toHaveCount(0)
})

test('raskt kjøp bare når valget er entydig', async ({ page }) => {
  await page.goto('/merker/ahava')
  const kort = page.locator('article').filter({ hasText: 'Mineral Mud Soap' }).first()
  await kort.getByRole('button', { name: /Legg Mineral Mud Soap i handlekurven/ }).click({ force: true })
  await expect(page.getByRole('dialog', { name: 'Handlekurven' })).toContainText('Mineral Mud Soap')

  await page.goto('/kategori/nisjeduft')
  const variabel = page.locator('article').filter({ hasText: 'Side Effect EdP' }).first()
  await expect(variabel.getByRole('button', { name: /i handlekurven/ })).toHaveCount(0)
})

test('utsolgt produkt kan ikke legges i kurven, men viser veien til butikken', async ({ page }) => {
  await page.goto('/produkt/montblanc-legend-edp')
  await expect(page.locator('main')).toContainText('Utsolgt')
  await page.getByRole('radio', { name: /100\sml/ }).check({ force: true })
  await expect(page.locator('main')).toContainText('utsolgt i nettbutikken')
  await expect(page.getByRole('button', { name: 'Legg i handlekurven' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Ring 948 97 061/ }).first()).toBeVisible()
})

test('søk med treff og uten treff', async ({ page }) => {
  await page.goto('/')
  await page
    .getByRole('button', { name: erMobil(page) ? 'Søk' : /Søk blant/ })
    .first()
    .click()
  const dialog = page.getByRole('dialog', { name: 'Søk' })
  await dialog.getByRole('searchbox').fill('creed aventus')
  await expect(dialog.getByRole('link', { name: /Aventus/ }).first()).toBeVisible()
  await dialog.getByRole('searchbox').press('Enter')
  await expect(page).toHaveURL(/\/sok\?q=creed%20aventus/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('creed aventus')

  await page.goto('/sok?q=xyzzyx')
  await expect(page.locator('main')).toContainText('Ingen treff på «xyzzyx»')
})

test('manglende produktbilder gir plassholder, ikke brutte bilder', async ({ page }) => {
  await page.route(/\/_next\/image\?url=https%3A%2F%2Fnettbutikk/, (r) => r.abort())
  await page.goto('/kategori/nisjeduft')
  await expect(page.getByRole('img', { name: 'Bilde mangler' }).first()).toBeVisible()
})

test('feil fra prissjekken vises med mulighet til å prøve igjen', async ({ page }) => {
  await page.route('**/api/handlekurv', (r) => r.fulfill({ status: 503, body: '{}' }))
  await page.goto('/merker/ahava')
  await page
    .locator('article')
    .filter({ hasText: 'Mineral Mud Soap' })
    .first()
    .getByRole('button', { name: /i handlekurven/ })
    .click({ force: true })
  const kurv = page.getByRole('dialog', { name: 'Handlekurven' })
  await expect(kurv.getByRole('alert')).toContainText('fikk ikke sjekket pris og lager')
  await expect(kurv.getByRole('button', { name: 'Prøv igjen' })).toBeVisible()
})

test('gammel pris i nettleseren blir rettet og forklart', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'regina-kurv-v1',
      JSON.stringify({
        versjon: 1,
        linjer: [
          {
            produktId: 6223,
            variantId: 6224,
            antall: 1,
            slug: 'initio-side-effect-edp',
            merke: 'Initio',
            navn: 'Side Effect EdP',
            variantTekst: 'Størrelse: 50 ml',
            bilde: null,
            enhetspris: 100000,
            maks: 1,
          },
        ],
      }),
    )
  })
  await page.goto('/kasse')
  await expect(page.locator('main')).toContainText('Prisen er endret fra 1 000 kr til 2 645 kr')
  await expect(page.locator('main')).toContainText('2 645 kr')
})

test('megamenyen virker med tastatur', async ({ page }) => {
  test.skip(erMobil(page), 'Megamenyen finnes bare på store skjermer')
  await page.goto('/')
  const duft = page.getByRole('button', { name: 'Duft', exact: true })
  await duft.focus()
  await page.keyboard.press('Enter')
  await expect(duft).toHaveAttribute('aria-expanded', 'true')
  await expect(
    page
      .locator('#panel-duft')
      .getByRole('link', { name: /Nisjeduft/ })
      .first(),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(duft).toHaveAttribute('aria-expanded', 'false')
  await expect(duft).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('#panel-duft a').first()).toBeFocused()
})

test('mobilmenyen har tydelig hierarki og lukkes med Escape', async ({ page }) => {
  test.skip(!erMobil(page), 'Mobilmenyen gjelder små skjermer')
  await page.goto('/')
  await page.getByRole('button', { name: 'Meny' }).click()
  const meny = page.getByRole('dialog', { name: 'Meny' })
  await meny.getByRole('button', { name: 'Hudpleie' }).click()
  await expect(meny.getByRole('link', { name: /Alt i hudpleie/ })).toBeVisible()
  await meny.getByRole('button', { name: 'Tilbake' }).click()
  await expect(meny.getByRole('button', { name: 'Duft' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(meny).toBeHidden()
})

test('redusert bevegelse slår av animasjonene', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.mouse.wheel(0, 1600)
  await page.waitForTimeout(400)
  // Ingen inngangs- eller avdekkingsanimasjoner kjører.
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
  await expect(page.getByRole('heading', { name: 'Hva leter du etter?' })).toBeVisible()
})

test('merkebåndet kan stoppes, og står stille ved redusert bevegelse', async ({ page }) => {
  await page.goto('/')
  const baand = page.getByRole('region', { name: 'Utvalgte merker', exact: true })
  const spor = baand.locator('ul').first().locator('..')
  const pause = baand.getByRole('button', { name: 'Stopp merkebåndet' })
  await expect(pause).toHaveAttribute('aria-pressed', 'false')
  // Båndet står stille utenfor skjermen; på mobil ligger det under heroen.
  await baand.scrollIntoViewIfNeeded()
  // Båndet beveger seg …
  const forskyvning = () => spor.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41)
  const for1 = await forskyvning()
  await page.waitForTimeout(600)
  expect(await forskyvning()).not.toBe(for1)
  // … til det stoppes med knappen (farten bygges ned mykt, så vi venter litt).
  await pause.click()
  await expect(baand.getByRole('button', { name: 'Start merkebåndet' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.waitForTimeout(1200)
  const stopp = await forskyvning()
  await page.waitForTimeout(500)
  expect(await forskyvning()).toBe(stopp)
  // Merkene i første rekke er lenker; kopiene er skjult for skjermlesere.
  await expect(baand.getByRole('link', { name: 'Creed', exact: true })).toHaveCount(1)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await expect(baand.getByRole('button', { name: /merkebåndet/ })).toHaveCount(0)
  await expect(baand.getByRole('region', { name: 'Merkene, rull sideveis' })).toHaveAttribute('tabindex', '0')
})

test('kategorikortene viser antall og leder til kategorien', async ({ page }) => {
  await page.goto('/')
  const kort = page.getByRole('link', { name: /^Nisjeduft 161 produkter/ })
  await expect(kort).toBeVisible()
  await kort.click()
  await expect(page.getByRole('heading', { level: 1, name: 'Nisjeduft' })).toBeVisible()
})

test('headeren glir bort ved rulling nedover og kommer tilbake ved rulling opp', async ({ page }) => {
  test.skip(erMobil(page), 'Samme oppførsel på mobil; testes på stor skjerm')
  await page.goto('/')
  const header = page.locator('header').first()
  await page.mouse.move(700, 880)
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 300)
  await expect(header).toHaveAttribute('data-skjult', 'true')
  await page.mouse.wheel(0, -200)
  await expect(header).not.toHaveAttribute('data-skjult')
  // Tastaturfokus i headeren henter den alltid fram.
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 300)
  await expect(header).toHaveAttribute('data-skjult', 'true')
  await page.getByRole('button', { name: 'Duft', exact: true }).focus()
  await expect(header).not.toHaveAttribute('data-skjult')
})
