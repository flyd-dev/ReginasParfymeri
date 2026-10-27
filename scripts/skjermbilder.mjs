// Tar skjermbilder til docs/screenshots/ (oppdraget §9: forside, kategori og produkt, mobil og desktop).
// Bruk: node scripts/skjermbilder.mjs <fase> [base-url]   – serveren må kjøre (pnpm build && pnpm start).

import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'

const fase = process.argv[2] ?? 'fase-x'
const base = process.argv[3] ?? 'http://localhost:3000'
const sider = (
  process.env.SIDER ?? '/,/produktkategori/duft/nisjeduft/,/produkt/initio-side-effect-edp/'
).split(',')
const visninger = [
  { navn: 'mobil', width: 375, height: 812 },
  { navn: 'desktop', width: 1280, height: 800 },
]

mkdirSync('docs/screenshots', { recursive: true })
const nettleser = await chromium.launch()
for (const v of visninger) {
  const side = await nettleser.newPage({
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: 1,
    locale: 'nb-NO',
  })
  for (const sti of sider) {
    await side.goto(base + sti, { waitUntil: 'load' })
    // Rull gjennom siden så bilder som lastes når de kommer til syne, er med på helsidebildet.
    await side.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 120))
      }
      window.scrollTo(0, 0)
    })
    await side.waitForTimeout(1200)
    const navn = sti === '/' ? 'forside' : sti.split('/').filter(Boolean).slice(0, 2).join('-')
    const fil = `docs/screenshots/${fase}-${navn}-${v.navn}.jpg`
    await side.screenshot({ path: fil, fullPage: process.env.HELE === '1', type: 'jpeg', quality: 80 })
    console.log(fil)
  }
  await side.close()
}
await nettleser.close()
