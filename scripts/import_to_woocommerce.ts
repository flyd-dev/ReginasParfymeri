// Importerer Reginas katalog (data/ og raw/) til et staging-WooCommerce via REST API v3.
//
//   pnpm tsx scripts/import_to_woocommerce.ts              # tørrkjøring (standard) → reports/import-dry-run.*
//   pnpm tsx scripts/import_to_woocommerce.ts --apply      # skriver til staging   → reports/import-apply.md
//   pnpm tsx --env-file=.env.staging scripts/import_to_woocommerce.ts
//
// Miljø: WC_STAGING_URL, WC_STAGING_KEY, WC_STAGING_SECRET. Uten nøkler: offline mot tom butikk.
// Produksjon (nettbutikk.reginaparfymeri.no, reginaparfymeri.no) avvises alltid – det finnes ikke noe
// flagg som overstyrer det. Kjøres fra repo-roten. Logikken ligger i scripts/import/.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { KILDEFILER, kjorImport } from './import/kjor'

async function main(): Promise<void> {
  const rot = process.cwd()
  if (!existsSync(path.join(rot, KILDEFILER.produkter))) {
    throw new Error(`Finner ikke ${KILDEFILER.produkter} – kjør skriptet fra repo-roten`)
  }
  const resultat = await kjorImport({
    argv: process.argv.slice(2),
    env: process.env,
    fetch: (url, init) => fetch(url, init),
    rot,
    lesFil: (sti) => readFile(sti, 'utf8'),
    skrivFil: async (sti, innhold) => {
      await mkdir(path.dirname(sti), { recursive: true })
      await writeFile(sti, innhold, 'utf8')
    },
    logg: (linje) => console.log(linje),
  })
  process.exitCode = resultat.kode
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e))
  process.exitCode = 1
})
