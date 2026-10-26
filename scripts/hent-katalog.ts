// Henter et utdrag av Reginas offentlige katalog fra WooCommerce Store API og lagrer det i
// data/katalog. Bare lesing (GET) mot stiene i `TILLATTE_STIER` – ingen handlekurv, ingen ordre.
//
//   pnpm katalog:hent                 # henter fra https://nettbutikk.reginaparfymeri.no
//   WOO_URL=https://… pnpm katalog:hent
//
// Hvert produktbilde måles (bakgrunn hvit/transparent/flat/foto), så flaten kan legge hvite
// pakkebilder på en flate i bildets egen farge. Miniatyrene mellomlagres i .cache/.

import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { byggKatalog } from '../src/lib/katalog/bygg'
import { hentRaadata, type Raadata } from '../src/lib/katalog/woo/hent'
import type { Avvik, Bildeanalyse } from '../src/lib/katalog/woo/mapping'
import { analyserKant } from './bildeanalyse'

const BUTIKK = process.env.WOO_URL ?? 'https://nettbutikk.reginaparfymeri.no'
const UT = path.join(process.cwd(), 'data', 'katalog')
const CACHE = path.join(process.cwd(), '.cache', 'miniatyrer')

async function hentMiniatyr(url: string): Promise<Buffer> {
  const fil = path.join(CACHE, createHash('sha1').update(url).digest('hex'))
  try {
    return await readFile(fil)
  } catch {
    const svar = await fetch(url, { headers: { 'user-agent': 'Flyd-konsept-regina/0.1' } })
    if (!svar.ok) throw new Error(`${svar.status} ${url}`)
    const data = Buffer.from(await svar.arrayBuffer())
    await writeFile(fil, data)
    return data
  }
}

async function analyser(url: string): Promise<Bildeanalyse> {
  const data = await hentMiniatyr(url)
  const { data: piksler, info } = await sharp(data)
    .ensureAlpha()
    .resize(96, 96, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true })
  return analyserKant(piksler, info.width, info.height)
}

async function iParallell<T>(ting: T[], antall: number, jobb: (t: T) => Promise<void>): Promise<void> {
  let neste = 0
  await Promise.all(
    Array.from({ length: antall }, async () => {
      while (neste < ting.length) {
        const t = ting[neste++] as T
        await jobb(t)
      }
    }),
  )
}

async function main(): Promise<void> {
  await mkdir(UT, { recursive: true })
  await mkdir(CACHE, { recursive: true })
  const raafil = path.join(process.cwd(), '.cache', 'raadata.json')
  let raa: Raadata
  if (process.argv.includes('--fra-cache')) {
    console.log('Bygger katalogen på nytt fra .cache/raadata.json (ingen nettverkskall) …')
    raa = JSON.parse(await readFile(raafil, 'utf8')) as Raadata
  } else {
    console.log(`Leser katalogen fra ${BUTIKK} (bare GET) …`)
    raa = await hentRaadata({ butikk: BUTIKK, pause: 120 })
    await writeFile(raafil, JSON.stringify(raa))
  }
  console.log(
    `${raa.produkter.length} produkter, ${raa.variasjoner.length} variasjoner, ${raa.kategorier.length} kategorier, ${raa.merker.length} merker`,
  )

  const bilder = new Map<string, string>()
  for (const p of raa.produkter) for (const b of p.images) bilder.set(b.src, b.thumbnail || b.src)

  const analyseFil = path.join(UT, 'bildeanalyse.json')
  let analyser_: Record<string, Bildeanalyse> = {}
  try {
    analyser_ = JSON.parse(await readFile(analyseFil, 'utf8')) as Record<string, Bildeanalyse>
  } catch {
    analyser_ = {}
  }
  const mangler = [...bilder.entries()].filter(([src]) => !analyser_[src])
  console.log(`Måler ${mangler.length} av ${bilder.size} bilder …`)
  let ferdig = 0
  await iParallell(mangler, 8, async ([src, miniatyr]) => {
    try {
      analyser_[src] = await analyser(miniatyr)
    } catch (feil) {
      console.warn(`  kunne ikke måle ${miniatyr}: ${(feil as Error).message}`)
    }
    if (++ferdig % 200 === 0) console.log(`  ${ferdig}/${mangler.length}`)
  })

  // Bare analysene for bilder som fortsatt finnes.
  const gjeldende = Object.fromEntries(
    [...bilder.keys()].filter((s) => analyser_[s]).map((s) => [s, analyser_[s]]),
  )
  const avvik: Avvik[] = []
  const katalog = byggKatalog(
    raa,
    gjeldende as Record<string, Bildeanalyse>,
    { kilde: 'utdrag', butikk: BUTIKK, hentet: new Date().toISOString() },
    (a) => avvik.push(a),
  )
  // Funn i butikkens data som Regina bør se på. Rettes i WooCommerce, ikke her.
  const utenMerke = katalog.produkter.filter((p) => !p.merke).map((p) => p.slug)
  const utenBeskrivelse = katalog.produkter.filter((p) => p.beskrivelse.length === 0).map((p) => p.slug)
  await writeFile(
    path.join(UT, 'datakvalitet.json'),
    JSON.stringify({ avvik, utenMerke, utenBeskrivelse }, null, 1),
  )
  console.log(
    `Avvik: ${avvik.length}, uten merke: ${utenMerke.length}, uten beskrivelse: ${utenBeskrivelse.length}`,
  )

  await writeFile(analyseFil, JSON.stringify(gjeldende))
  await writeFile(path.join(UT, 'katalog.json'), JSON.stringify(katalog))

  const fordeling: Record<string, number> = {}
  for (const a of Object.values(gjeldende) as Bildeanalyse[])
    fordeling[a.bakgrunn] = (fordeling[a.bakgrunn] ?? 0) + 1
  console.log('Bildebakgrunner:', fordeling)
  console.log(`Skrev ${katalog.produkter.length} produkter til data/katalog/katalog.json`)
}

main().catch((feil) => {
  console.error(feil)
  process.exit(1)
})
