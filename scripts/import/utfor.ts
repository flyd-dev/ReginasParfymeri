// Utfører planen mot staging (bare med --apply). Rekkefølge: kategorier nivå for nivå (forelder før
// barn), merker, attributter, termer, produkter, varianter. Alt skrives i batcher på maks 100.
//
// Gjentakelse er trygg: WooCommerce avviser en SKU som finnes (`product_invalid_sku`) og en term som
// finnes (`term_exists`), begge med `resource_id`. Et kall som ble behandlet selv om svaret uteble,
// gir derfor ikke duplikater – vi henter ID-en og regner objektet som opprettet.

import { MAKS_PER_BATCH, WooFeil, erBatchFeil } from './klient'
import type { WooKlient } from './klient'
import { ManglerId, kategoriPayload, produktPayload, variasjonPayload } from './plan'
import type { IdOppslag } from './plan'
import { attributtNokkel } from './tekst'
import type {
  Eksisterende,
  Kategori,
  Melding,
  Plan,
  Post,
  Produkt,
  Variasjon,
  WooAttributt,
  WooBilde,
} from './typer'

export interface Telling {
  opprettet: number
  oppdatert: number
  uendret: number
  hoppetOver: number
  feilet: number
  /** Fantes allerede (f.eks. etter et kall som ble behandlet, men der svaret uteble). */
  fantesAllerede: number
}

export type Objekttype = 'kategorier' | 'merker' | 'attributter' | 'termer' | 'produkter' | 'variasjoner'

export interface UtforResultat {
  telling: Record<Objekttype, Telling>
  feil: Melding[]
  advarsler: Melding[]
  avbrutt: string | null
}

export interface UtforValg {
  produkterPerKall: number
  logg: (linje: string) => void
}

class IdRegister implements IdOppslag {
  readonly kategorier = new Map<string, number>()
  readonly merker = new Map<string, number>()
  readonly attributter = new Map<string, number>()
  readonly bilder = new Map<string, number>()
  readonly produkter = new Map<number, number>()
  readonly variasjoner = new Map<number, number>()

  kategori(slug: string) {
    return this.kategorier.get(slug)
  }
  merke(slug: string) {
    return this.merker.get(slug)
  }
  attributt(slug: string) {
    return this.attributter.get(attributtNokkel(slug))
  }
  bilde(src: string) {
    return this.bilder.get(src)
  }
  /** Kildebildene i rekkefølge ↔ bildene WooCommerce svarte med (samme rekkefølge som vi sendte). */
  registrerBilder(kilde: { src: string }[], staging: WooBilde[] | undefined) {
    if (!staging || staging.length !== kilde.length) return
    kilde.forEach((b, i) => {
      const id = staging[i]?.id
      if (id) this.bilder.set(b.src, id)
    })
  }
}

function nyTelling(): Telling {
  return { opprettet: 0, oppdatert: 0, uendret: 0, hoppetOver: 0, feilet: 0, fantesAllerede: 0 }
}

export function delOpp<T>(liste: T[], storrelse: number): T[][] {
  if (!Number.isInteger(storrelse) || storrelse < 1 || storrelse > MAKS_PER_BATCH) {
    throw new Error(`Batchstørrelse må være 1–${MAKS_PER_BATCH}`)
  }
  const ut: T[][] = []
  for (let i = 0; i < liste.length; i += storrelse) ut.push(liste.slice(i, i + storrelse))
  return ut
}

function tekstAv(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/** 401/403 betyr feil nøkler eller rettigheter – da gir det ikke mening å fortsette. */
function erTilgangsfeil(e: unknown): boolean {
  return e instanceof WooFeil && (e.status === 401 || e.status === 403)
}

interface BatchJobb<T> {
  post: Post<T>
  payload: object
}

export async function utforPlan(
  plan: Plan,
  eks: Eksisterende,
  klient: WooKlient,
  valg: UtforValg,
): Promise<UtforResultat> {
  if (klient.bareLesing) throw new Error('utforPlan krever en klient som kan skrive')
  const telling: Record<Objekttype, Telling> = {
    kategorier: nyTelling(),
    merker: nyTelling(),
    attributter: nyTelling(),
    termer: nyTelling(),
    produkter: nyTelling(),
    variasjoner: nyTelling(),
  }
  const feil: Melding[] = []
  const advarsler: Melding[] = []
  const ider = new IdRegister()
  const logg = valg.logg

  // Det som allerede finnes i staging
  for (const p of plan.kategorier) if (p.id !== null) ider.kategorier.set(p.onske.slug, p.id)
  for (const p of plan.merker) if (p.id !== null) ider.merker.set(p.onske.slug, p.id)
  for (const p of plan.attributter)
    if (p.id !== null) ider.attributter.set(attributtNokkel(p.onske.slug), p.id)
  const eksProdukter = new Map(eks.produkter.map((p) => [p.id, p]))
  for (const p of plan.produkter) {
    if (p.id === null || p.handling === 'hopp_over') continue
    ider.produkter.set(p.onske.kildeId, p.id)
    ider.registrerBilder(p.onske.bilder, eksProdukter.get(p.id)?.images)
  }
  for (const p of plan.variasjoner) if (p.id !== null) ider.variasjoner.set(p.onske.kildeId, p.id)

  const tell = <T>(type: Objekttype, poster: Post<T>[]) => {
    telling[type].uendret += poster.filter((p) => p.handling === 'uendret').length
    telling[type].hoppetOver += poster.filter((p) => p.handling === 'hopp_over').length
  }
  const skalSkrives = <T>(poster: Post<T>[]) =>
    poster.filter((p) => p.handling === 'opprett' || p.handling === 'oppdater')
  const meldFeil = (type: Objekttype, nokkel: string, tekst: string) => {
    telling[type].feilet += 1
    feil.push({ kode: `apply_${type}`, tekst: `${nokkel}: ${tekst}` })
  }

  /** Felles for alle batch-kall: bygger nyttelast, sender, fordeler svarene tilbake på postene. */
  async function kjorBatch<T, S extends { id: number }>(
    type: Objekttype,
    sti: string,
    poster: Post<T>[],
    lagPayload: (post: Post<T>) => object,
    ferdig: (post: Post<T>, svar: S) => void,
    gjenopprett: (
      post: Post<T>,
      feil: { code: string; data?: { resource_id?: number } },
    ) => Promise<number | null>,
    storrelse = MAKS_PER_BATCH,
  ): Promise<void> {
    for (const del of delOpp(poster, storrelse)) {
      const opprett: BatchJobb<T>[] = []
      const oppdater: BatchJobb<T>[] = []
      for (const post of del) {
        try {
          const jobb = { post, payload: lagPayload(post) }
          if (post.handling === 'opprett') opprett.push(jobb)
          else oppdater.push(jobb)
        } catch (e) {
          if (!(e instanceof ManglerId)) throw e
          meldFeil(type, post.nokkel, e.message)
        }
      }
      if (opprett.length === 0 && oppdater.length === 0) continue
      let svar: { create?: unknown[]; update?: unknown[] }
      try {
        svar = await klient.batch<S>(sti, {
          create: opprett.map((j) => j.payload),
          update: oppdater.map((j) => j.payload),
        })
      } catch (e) {
        if (erTilgangsfeil(e)) throw e
        for (const j of [...opprett, ...oppdater]) meldFeil(type, j.post.nokkel, tekstAv(e))
        continue
      }
      const fordel = async (jobber: BatchJobb<T>[], svarListe: unknown[] | undefined, ny: boolean) => {
        for (const [i, jobb] of jobber.entries()) {
          const element = svarListe?.[i]
          if (element === undefined) {
            meldFeil(type, jobb.post.nokkel, 'mangler i svaret fra WooCommerce')
          } else if (erBatchFeil(element)) {
            const id = ny ? await gjenopprett(jobb.post, element.error).catch(() => null) : null
            if (id !== null) {
              telling[type].fantesAllerede += 1
              ferdig(jobb.post, { id } as S)
              advarsler.push({
                kode: 'fantes_allerede',
                tekst: `${jobb.post.nokkel} fantes allerede i staging (#${id}, ${element.error.code}) – kjør på nytt for å oppdatere`,
              })
            } else {
              meldFeil(type, jobb.post.nokkel, `${element.error.code}: ${element.error.message}`)
            }
          } else {
            telling[type][ny ? 'opprettet' : 'oppdatert'] += 1
            ferdig(jobb.post, element as S)
          }
        }
      }
      await fordel(opprett, svar.create, true)
      await fordel(oppdater, svar.update, false)
    }
  }

  const termFinnes = async (_post: unknown, f: { code: string; data?: { resource_id?: number } }) =>
    f.code === 'term_exists' && f.data?.resource_id ? f.data.resource_id : null

  async function finnSku(sku: string | null, forelderId?: number): Promise<number | null> {
    if (!sku) return null
    const { data } = await klient.hent<{ id: number; sku: string; parent_id?: number }[]>('/products', {
      sku,
      _fields: 'id,sku,parent_id',
    })
    const treff = data.find((d) => d.sku === sku && (forelderId === undefined || d.parent_id === forelderId))
    return treff?.id ?? null
  }

  try {
    // 1. Kategorier, nivå for nivå
    tell('kategorier', plan.kategorier)
    const nivaaer = new Map<number, Post<Kategori>[]>()
    for (const p of skalSkrives(plan.kategorier))
      nivaaer.set(p.onske.dybde, [...(nivaaer.get(p.onske.dybde) ?? []), p])
    for (const dybde of [...nivaaer.keys()].sort((a, b) => a - b)) {
      const poster = nivaaer.get(dybde) ?? []
      logg(`Kategorier, nivå ${dybde}: ${poster.length}`)
      await kjorBatch<Kategori, { id: number }>(
        'kategorier',
        '/products/categories/batch',
        poster,
        (post) => kategoriPayload(post, ider),
        (post, svar) => ider.kategorier.set(post.onske.slug, svar.id),
        termFinnes,
      )
    }

    // 2. Merker (WooCommerce Brands)
    tell('merker', plan.merker)
    logg(`Merker: ${skalSkrives(plan.merker).length}`)
    await kjorBatch(
      'merker',
      '/products/brands/batch',
      skalSkrives(plan.merker),
      (post) =>
        post.handling === 'opprett'
          ? { name: post.onske.navn, slug: post.onske.slug }
          : { id: post.id, name: post.onske.navn },
      (post, svar: { id: number }) => ider.merker.set(post.onske.slug, svar.id),
      termFinnes,
    )

    // 3. Globale attributter
    tell('attributter', plan.attributter)
    await kjorBatch(
      'attributter',
      '/products/attributes/batch',
      skalSkrives(plan.attributter),
      (post) =>
        post.handling === 'opprett'
          ? {
              name: post.onske.navn,
              slug: post.onske.slug,
              type: 'select',
              order_by: 'menu_order',
              has_archives: false,
            }
          : { id: post.id, name: post.onske.navn },
      (post, svar: { id: number }) => ider.attributter.set(attributtNokkel(post.onske.slug), svar.id),
      async (post) => {
        const { data } = await klient.hent<WooAttributt[]>('/products/attributes')
        return data.find((a) => attributtNokkel(a.slug) === attributtNokkel(post.onske.slug))?.id ?? null
      },
    )

    // 4. Termer per attributt
    tell('termer', plan.termer)
    const termerPerAttributt = new Map<
      string,
      Post<{ slug: string; navn: string; attributtSlug: string }>[]
    >()
    for (const p of skalSkrives(plan.termer)) {
      termerPerAttributt.set(p.onske.attributtSlug, [
        ...(termerPerAttributt.get(p.onske.attributtSlug) ?? []),
        p,
      ])
    }
    for (const [slug, poster] of termerPerAttributt) {
      const attributtId = ider.attributt(slug)
      if (attributtId === undefined) {
        for (const p of poster) meldFeil('termer', p.nokkel, `attributtet ${slug} finnes ikke i staging`)
        continue
      }
      logg(`Termer i ${slug}: ${poster.length}`)
      await kjorBatch(
        'termer',
        `/products/attributes/${attributtId}/terms/batch`,
        poster,
        (post) =>
          post.handling === 'opprett'
            ? { name: post.onske.navn, slug: post.onske.slug }
            : { id: post.id, name: post.onske.navn },
        () => {},
        termFinnes,
      )
    }

    // 5. Produkter
    tell('produkter', plan.produkter)
    const produktPoster = skalSkrives(plan.produkter)
    logg(`Produkter: ${produktPoster.length} i kall på maks ${valg.produkterPerKall}`)
    let ferdige = 0
    await kjorBatch<Produkt, { id: number; images?: WooBilde[] }>(
      'produkter',
      '/products/batch',
      produktPoster,
      (post) => produktPayload(post, ider),
      (post, svar) => {
        ider.produkter.set(post.onske.kildeId, svar.id)
        if (post.sendBilder) ider.registrerBilder(post.onske.bilder, svar.images)
        ferdige += 1
        if (ferdige % 100 === 0) logg(`  ${ferdige} av ${produktPoster.length} produkter`)
      },
      async (post, f) => {
        if (f.code !== 'product_invalid_sku') return null
        return f.data?.resource_id ?? (await finnSku(post.onske.sku))
      },
      valg.produkterPerKall,
    )

    // 6. Varianter per produkt
    tell('variasjoner', plan.variasjoner)
    const perForelder = new Map<number, Post<Variasjon>[]>()
    for (const p of skalSkrives(plan.variasjoner)) {
      perForelder.set(p.onske.forelderKildeId, [...(perForelder.get(p.onske.forelderKildeId) ?? []), p])
    }
    logg(`Variasjoner: ${skalSkrives(plan.variasjoner).length} fordelt på ${perForelder.size} produkter`)
    for (const [forelderKildeId, poster] of perForelder) {
      const forelderId = ider.produkter.get(forelderKildeId)
      if (forelderId === undefined) {
        for (const p of poster)
          meldFeil('variasjoner', p.nokkel, `forelderen (kilde ${forelderKildeId}) finnes ikke i staging`)
        continue
      }
      // Samme nye bilde på flere varianter: last det opp én gang, sett det på resten etterpå.
      const iDenneRunden = new Set<string>()
      const utsatt = new Set<Post<Variasjon>>()
      await kjorBatch<Variasjon, { id: number; image?: WooBilde | null }>(
        'variasjoner',
        `/products/${forelderId}/variations/batch`,
        poster,
        (post) => {
          const bilde = post.onske.bilde
          const nyttBilde = Boolean(post.sendBilder && bilde && ider.bilde(bilde) === undefined)
          const vent = nyttBilde && bilde !== null && iDenneRunden.has(bilde)
          if (nyttBilde && bilde !== null && !vent) iDenneRunden.add(bilde)
          if (vent) utsatt.add(post)
          return variasjonPayload(post, ider, vent)
        },
        (post, svar) => {
          ider.variasjoner.set(post.onske.kildeId, svar.id)
          if (post.onske.bilde && svar.image?.id) ider.bilder.set(post.onske.bilde, svar.image.id)
        },
        async (post, f) => {
          if (f.code !== 'product_invalid_sku') return null
          return f.data?.resource_id ?? (await finnSku(post.onske.sku, forelderId))
        },
      )
      const bildeOppdateringer = [...utsatt]
        .map((post) => ({
          post,
          id: ider.variasjoner.get(post.onske.kildeId),
          bilde: post.onske.bilde ? ider.bilde(post.onske.bilde) : undefined,
        }))
        .filter(
          (x): x is { post: Post<Variasjon>; id: number; bilde: number } =>
            x.id !== undefined && x.bilde !== undefined,
        )
      if (bildeOppdateringer.length > 0) {
        try {
          await klient.batch(`/products/${forelderId}/variations/batch`, {
            update: bildeOppdateringer.map((x) => ({ id: x.id, image: { id: x.bilde } })),
          })
        } catch (e) {
          if (erTilgangsfeil(e)) throw e
          for (const x of bildeOppdateringer) meldFeil('variasjoner', x.post.nokkel, `bilde: ${tekstAv(e)}`)
        }
      }
    }
  } catch (e) {
    if (!erTilgangsfeil(e)) throw e
    return { telling, feil, advarsler, avbrutt: `Avbrutt: ${tekstAv(e)}` }
  }

  return { telling, feil, advarsler, avbrutt: null }
}
