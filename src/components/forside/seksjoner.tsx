import { ArrowRight, MapPin, Phone, Quote } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AvdekkTekst } from '@/components/bevegelse/avdekk-tekst'
import { Inn } from '@/components/bevegelse/inn'
import { Prikk } from '@/components/layout/prikk'
import { Button } from '@/components/ui/button'
import { BILDER } from '@/content/bilder'
import { BEHANDLINGER, BUTIKK, HISTORIE, NISJE } from '@/content/butikk'
import type { Nisjemerke, Visningsprodukt } from '@/lib/forside'
import { kategoriUrl } from '@/lib/lenker'
import { cn } from '@/lib/utils'
import type { Butikkinfo } from '@/lib/woocommerce/innhold'
import type { Produkt } from '@/lib/woocommerce/typer'
import { Flate } from './flate'
import { TEPPEBILDE } from './inngang'
import { Merkeliste } from './merkeliste'
import { Tallteller } from './tallteller'
import { Tekstavsloring } from './tekstavsloring'
import { Utstillingsvindu } from './utstillingsvindu'

/**
 * Overlinje med rosa prikk, overskrift og eventuelt en lenke til høyre. Rosa lenketekst (regina-pink-strong) holder
 * kontrasten på alle de lyse flatene: sand-50, sand-100, paper og regina-pink-50 (tokens.test.ts).
 */
export function Seksjonstittel({
  kicker,
  tittel,
  lenke,
  id,
}: {
  kicker?: string
  tittel: React.ReactNode
  lenke?: { href: string; tekst: string }
  id: string
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
      <div>
        {kicker && (
          <Inn
            som="p"
            className="flex items-center gap-3 text-sm tracking-[0.2em] text-sand-ink-deep uppercase"
          >
            <Prikk />
            {kicker}
          </Inn>
        )}
        {typeof tittel === 'string' ? (
          <AvdekkTekst id={id} deler={[tittel]} i={1} className="mt-3 text-4xl md:text-6xl" />
        ) : (
          <h2 id={id} className="mt-3 text-4xl md:text-6xl">
            {tittel}
          </h2>
        )}
      </div>
      {lenke && (
        <Inn i={3}>
          <Link
            href={lenke.href}
            className="inline-flex min-h-11 items-center gap-2 text-regina-pink-strong hover:underline md:mr-28"
          >
            {lenke.tekst} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Inn>
      )}
    </div>
  )
}

export interface Inngang {
  navn: string
  sti: string[]
  antall: number
  produkt: Produkt | null
}

/** Flisene i rutenettet: den første (nisjeduft) stor, den andre bred, resten små. */
const FLIS_LITEN = {
  li: 'aspect-[4/5] lg:aspect-auto',
  luft: 'p-[9%]',
  tittel: 'text-2xl md:text-3xl',
  sizes: '(min-width: 1024px) 22vw, 50vw',
}
const FLIS = [
  {
    li: 'col-span-2 aspect-square sm:aspect-[4/3] lg:row-span-2 lg:aspect-auto',
    luft: 'p-[10%]',
    tittel: 'text-3xl md:text-5xl',
    sizes: '(min-width: 1024px) 45vw, 100vw',
  },
  {
    li: 'col-span-2 aspect-[2/1] lg:aspect-auto',
    luft: 'p-[7%]',
    tittel: 'text-2xl md:text-3xl',
    sizes: '(min-width: 1024px) 45vw, 100vw',
  },
]

/**
 * Kategoriinnganger som asymmetrisk rutenett. Mønsteret er «Shop by Category Grid» (ziegfiroyt, MIT) fra
 * 21st.dev, med frilagte produkter på papir i stedet for fotografi under mørk toning. Bildet er en vare Flyd
 * har valgt (src/content/forside.ts), eller kategoriens mest solgte vare.
 *
 * Seksjonen er en innfelt lys rosa boks med runde hjørner (R-32); flisene er kort med runde hjørner, og «Også» er
 * rosa piller. Flisene glir inn forskjøvet når rutenettet kommer til syne. I den store plumflisen stiger papirflaten med
 * flasken opp bak en maske (teppe); i de små tones flasken inn og skaleres ned (skala). Papiret ligger på
 * flaten som animeres, så multiply alltid har papir under seg.
 */
export function Kategoriinnganger({
  innganger,
  ovrige,
}: {
  innganger: Inngang[]
  ovrige: { navn: string; sti: string[]; antall: number }[]
}) {
  return (
    <section className="mx-2 rounded-3xl bg-regina-pink-50 md:mx-4" aria-labelledby="kategorier-tittel">
      <div className="mx-auto max-w-screen-2xl px-4 py-16 md:px-8 md:py-24">
        <Seksjonstittel id="kategorier-tittel" kicker="Utforsk" tittel="Hva leter du etter?" />
        <ul className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 lg:grid-rows-[repeat(2,20rem)] xl:grid-rows-[repeat(2,23rem)]">
          {innganger.map((k, i) => {
            const flis = FLIS[i] ?? FLIS_LITEN
            // Den store flisen er plum med produktet på en papirflate: den mørke flaten gir rutenettet tyngde.
            const mork = i === 0
            const bilde = k.produkt?.bilder[0] && (
              <Image
                src={k.produkt.bilder[0].src}
                alt=""
                fill
                sizes={flis.sizes}
                className={cn(
                  'object-contain mix-blend-multiply transition-transform duration-(--dur-slow) ease-out group-hover:scale-[1.04]',
                  flis.luft,
                )}
              />
            )
            return (
              <Inn som="li" key={k.sti.join('/')} i={i + 2} y="2.5rem" className={cn('relative', flis.li)}>
                <Link
                  href={kategoriUrl(k.sti)}
                  className={cn(
                    'group absolute inset-0 flex flex-col overflow-hidden rounded-2xl border',
                    mork
                      ? 'border-regina-plum bg-regina-plum text-sand-50'
                      : 'border-regina-pink-100 bg-paper',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-4 left-4 z-10 text-sm tabular-nums md:left-6',
                      mork ? 'text-sand-100' : 'text-sand-ink',
                    )}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {mork ? (
                    <span className="grid min-h-0 flex-1 place-items-center px-5 pt-12 pb-5 md:px-8 md:pt-14 md:pb-8">
                      <Inn
                        som="span"
                        variant="teppe"
                        i={i + 4}
                        className="relative isolate aspect-square h-full max-w-full rounded-xl"
                      >
                        <span className="teppe absolute inset-0 bg-paper">{bilde}</span>
                      </Inn>
                    </span>
                  ) : (
                    <Inn
                      som="span"
                      variant="skala"
                      i={i + 4}
                      className="relative isolate min-h-0 flex-1 bg-paper"
                    >
                      {bilde}
                    </Inn>
                  )}
                  <span
                    className={cn(
                      'flex items-end justify-between gap-2 border-t px-4 py-4 md:gap-4 md:px-6 md:py-5',
                      mork ? 'border-white/15' : 'border-regina-pink-100',
                    )}
                  >
                    <span>
                      <span className={cn('block font-heading leading-none', flis.tittel)}>{k.navn}</span>
                      <span className={cn('mt-2 block text-sm', mork ? 'text-sand-100' : 'text-sand-ink')}>
                        {k.antall} produkter
                      </span>
                    </span>
                    <ArrowRight
                      className="mb-1 size-5 shrink-0 transition-transform duration-(--dur-base) group-hover:translate-x-1"
                      aria-hidden
                    />
                  </span>
                </Link>
              </Inn>
            )
          })}
        </ul>
        {ovrige.length > 0 && (
          <nav aria-label="Flere kategorier" className="mt-10 flex flex-wrap items-center gap-2">
            <Inn som="span" className="mr-3 text-sm tracking-[0.2em] text-sand-ink-deep uppercase">
              Også
            </Inn>
            {ovrige.map((k, n) => (
              <Inn som="span" key={k.sti.join('/')} i={n + 1}>
                {/* Rosa pille; plum fyller ved peker og trykk (hvit på plum holder 4,5:1). */}
                <Link
                  href={kategoriUrl(k.sti)}
                  className="inline-flex min-h-11 items-center rounded-full bg-regina-pink-100 px-5 font-heading text-xl transition-colors duration-(--dur-fast) hover:bg-regina-plum hover:text-white active:bg-regina-plum active:text-white"
                >
                  {k.navn}
                </Link>
              </Inn>
            ))}
          </nav>
        )}
      </div>
    </section>
  )
}

/**
 * Nisjeduft på plum, som en innfelt boks med runde hjørner (R-32): Reginas egen tekst og utstillingsvinduet med
 * fem utvalgte dufter.
 */
export function Nisjeduft({ produkter }: { produkter: Visningsprodukt[] }) {
  return (
    <section
      className="mx-2 rounded-3xl bg-regina-plum text-sand-50 md:mx-4 [&_:focus-visible]:outline-sand-50"
      aria-labelledby="nisje-tittel"
    >
      <div className="mx-auto max-w-screen-2xl px-4 py-16 md:px-8 md:py-24">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Inn som="p" className="flex items-center gap-3 text-sm tracking-[0.2em] text-sand-100 uppercase">
              <Prikk />
              Nisjeduft
            </Inn>
            <AvdekkTekst
              id="nisje-tittel"
              i={1}
              deler={['Dufter med ', { tekst: 'karakter', som: 'em', className: 'text-regina-pink' }]}
              className="mt-3 text-[clamp(2.75rem,1.4rem+4.4vw,6rem)] leading-[0.95]"
            />
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Inn som="p" i={3} className="text-lg text-sand-100">
              {NISJE.tekst}
            </Inn>
            <Inn i={4} className="mt-8">
              <Button asChild size="lg" variant="rosa">
                <Link href="/produktkategori/duft/nisjeduft/">Se alle nisjedufter</Link>
              </Button>
            </Inn>
          </div>
        </div>
        <div className="mt-16 md:mt-20">
          <Utstillingsvindu produkter={produkter} />
        </div>
      </div>
    </section>
  )
}

/** Nisjehusene som nummerert liste med flaske ved peker (se merkeliste.tsx). */
export function Nisjemerker({ merker }: { merker: Nisjemerke[] }) {
  if (merker.length === 0) return null
  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-20 md:px-6 md:py-28" aria-labelledby="merker-tittel">
      <Seksjonstittel
        id="merker-tittel"
        kicker="Nisjehusene"
        tittel="Merkene i Haraldsgata"
        lenke={{ href: '/merker/', tekst: 'Alle merker' }}
      />
      <Merkeliste merker={merker} />
    </section>
  )
}

/**
 * Reginas eget løfte om veiledning (reginaparfymeri.no) – ikke et kundesitat. Sidens sterkeste flate i Reginas
 * rosa (regina-pink-strong, hvit tekst holder 5,8:1), som en innfelt boks med runde hjørner (R-32). Ordene går
 * fra svake til hvite mens kunden ruller gjennom (Tekstavsloring); uten JavaScript og ved redusert bevegelse er
 * alt hvitt.
 */
export function Veiledning() {
  return (
    <section
      className="mx-2 rounded-3xl bg-regina-pink-strong text-white md:mx-4 [&_:focus-visible]:outline-white"
      aria-labelledby="veiledning-tittel"
    >
      <div className="mx-auto grid max-w-screen-2xl gap-10 px-4 py-16 md:px-8 md:py-28 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-3">
          <Inn variant="skala">
            <Quote className="size-12 md:size-16" aria-hidden />
          </Inn>
          <Inn
            som="h2"
            i={1}
            id="veiledning-tittel"
            className="mt-6 font-sans text-sm tracking-[0.2em] uppercase"
          >
            Personlig veiledning
          </Inn>
        </div>
        <div className="lg:col-span-9">
          <Tekstavsloring
            tekst={NISJE.veiledning}
            className="font-heading text-[clamp(2rem,1.2rem+2.8vw,4.25rem)] leading-[1.12]"
          />
          <Inn className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-white/30 pt-6">
            <p className="text-sm tracking-[0.2em] uppercase">Regina Parfymeri · {BUTIKK.adresse.gate}</p>
            <Link
              href="/kontakt/"
              className="inline-flex items-center gap-2 border-b border-white pb-1 transition-colors duration-(--dur-fast) hover:border-transparent"
            >
              Finn veien til butikken <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Inn>
        </div>
      </div>
    </section>
  )
}

/**
 * Historien fra 1863 – bare hendelser med kilde (src/content/butikk.ts). Plumflaten feies inn, bildene trer fram
 * bak teppe, og årstallene teller opp når de kommer til syne: første fra 0, de neste fra året før (1863 → 1970).
 * «I dag» står som tekst.
 */
export function Historien() {
  const aarstall = HISTORIE.tidslinje.map((t) => (/^\d{4}$/.test(t.aar) ? Number(t.aar) : null))
  return (
    <section
      className="mx-auto max-w-screen-2xl px-4 py-20 md:px-6 md:py-28"
      aria-labelledby="historie-tittel"
    >
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="relative isolate pb-[22%] lg:col-span-6 lg:pb-[16%]">
          {/* Tre plan: plumflate, butikkbildet og fasaden foran – dybde uten skygger. Alle med runde hjørner (R-32);
              fasaden har en kant i bakgrunnsfargen der den ligger over butikkbildet. */}
          <Flate
            className="absolute top-[24%] bottom-[6%] -left-2 -z-10 w-[52%] overflow-hidden rounded-3xl md:-left-4"
            fra="venstre"
          />
          <Inn variant="teppe" i={1} className="relative aspect-[4/5] w-[80%] rounded-2xl lg:rounded-3xl">
            <div className="teppe absolute inset-0 bg-sand-100">
              <Image
                src={BILDER.vedDisken.bilde}
                alt={BILDER.vedDisken.alt}
                fill
                sizes="(min-width: 1024px) 38vw, 80vw"
                className={cn('object-cover', TEPPEBILDE)}
              />
            </div>
          </Inn>
          <Inn i={5} y="3rem" className="absolute right-0 bottom-0 aspect-square w-[50%]">
            <div className="parallakse size-full rounded-[calc(var(--radius-2xl)+10px)] border-[10px] border-sand-50 bg-sand-50 [--parallakse:2rem]">
              <Inn variant="teppe" i={6} className="relative size-full rounded-2xl">
                <div className="teppe absolute inset-0 bg-sand-100">
                  <Image
                    src={BILDER.fasade.bilde}
                    alt={BILDER.fasade.alt}
                    fill
                    sizes="(min-width: 1024px) 24vw, 50vw"
                    className={cn('object-cover', TEPPEBILDE)}
                  />
                </div>
              </Inn>
            </div>
          </Inn>
        </div>
        <div className="self-center lg:col-span-5 lg:col-start-8">
          <Inn som="p" className="flex items-center gap-3 text-sm tracking-[0.2em] text-sand-ink uppercase">
            <Prikk />
            Familiebedrift
          </Inn>
          <AvdekkTekst
            id="historie-tittel"
            i={1}
            deler={['Fem generasjoner i Haugesund']}
            className="mt-3 text-4xl md:text-6xl"
          />
          <ol className="mt-10 border-t border-sand-200">
            {HISTORIE.tidslinje.map((t, n) => {
              const aar = aarstall[n]
              const forrige = aarstall.slice(0, n).findLast((a) => a !== null) ?? 0
              return (
                <Inn
                  som="li"
                  key={t.aar}
                  i={n + 3}
                  className="grid grid-cols-[6.5rem_1fr] gap-6 border-b border-sand-200 py-5 md:grid-cols-[8.5rem_1fr]"
                >
                  <p className="font-heading text-4xl leading-none text-regina-pink md:text-5xl">
                    {aar ? <Tallteller verdi={aar} fra={forrige} aar i={n + 3} /> : t.aar}
                  </p>
                  <p className="self-center text-sand-ink-deep">{t.tekst}</p>
                </Inn>
              )
            })}
          </ol>
          <Inn i={HISTORIE.tidslinje.length + 3} className="mt-10">
            <Link
              href="/om-oss/"
              className="inline-flex min-h-11 items-center gap-2 text-regina-pink-strong hover:underline"
            >
              Les historien <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Inn>
        </div>
      </div>
    </section>
  )
}

/**
 * Behandlinger i en innfelt lys rosa boks (R-32): bildet fyller den ene halvdelen med runde hjørner innenfor boksens
 * kant og trer fram bak et teppe.
 */
export function Behandlinger() {
  return (
    <section
      className="mx-2 grid gap-2 rounded-3xl bg-regina-pink-50 p-2 md:mx-4 lg:grid-cols-2"
      aria-labelledby="behandling-tittel"
    >
      <Inn variant="teppe" className="relative min-h-[22rem] rounded-2xl lg:min-h-[42rem]">
        <div className="teppe absolute inset-0">
          <Image
            src={BILDER.behandlingsrom.bilde}
            alt={BILDER.behandlingsrom.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className={cn('object-cover', TEPPEBILDE)}
          />
        </div>
      </Inn>
      <div className="self-center px-4 pt-8 pb-12 md:px-10 lg:px-14 lg:py-16 xl:px-20">
        <Inn
          som="p"
          className="flex items-center gap-3 text-sm tracking-[0.2em] text-sand-ink-deep uppercase"
        >
          <Prikk />
          Hudpleieavdelingen · {BEHANDLINGER.etasje}
        </Inn>
        <AvdekkTekst
          id="behandling-tittel"
          i={1}
          deler={['Behandlinger i andre etasje']}
          className="mt-3 text-4xl md:text-6xl"
        />
        <Inn som="p" i={3} className="mt-6 max-w-lg text-lg">
          {BEHANDLINGER.tekst}
        </Inn>
        <Inn i={4} className="mt-9 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href={BEHANDLINGER.timebestilling} rel="noopener">
              Bestill time
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-paper">
            <Link href="/behandlinger/">Om behandlingene</Link>
          </Button>
        </Inn>
      </div>
    </section>
  )
}

/**
 * Besøk butikken: kortet ligger over kanten av bildet. Bildet trer fram bak et teppe, og plumkortet glir opp over
 * kanten etterpå. Åpningstider bare når de er bekreftet i WordPress.
 */
export function BesokButikken({ info }: { info: Butikkinfo | null }) {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-20 md:px-6 md:py-28" aria-labelledby="besok-tittel">
      <div className="grid lg:grid-cols-12">
        <div className="parallakse relative aspect-[4/3] [--parallakse:1.5rem] lg:col-span-8 lg:col-start-1 lg:row-start-1">
          <Inn variant="teppe" className="absolute inset-0 rounded-2xl lg:rounded-3xl">
            <div className="teppe absolute inset-0 bg-sand-100">
              <Image
                src={BILDER.interior.bilde}
                alt={BILDER.interior.alt}
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className={cn('object-cover', TEPPEBILDE)}
              />
            </div>
          </Inn>
        </div>
        {/* Plumkortet ligger over bildekanten: mørk flate mot lyst foto gir dybde uten skygge. */}
        <Inn
          i={4}
          y="3rem"
          className="relative mx-4 -mt-16 rounded-2xl bg-regina-plum p-8 text-sand-50 md:mx-12 md:p-12 lg:rounded-3xl lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:mx-0 lg:mt-0 lg:self-center [&_:focus-visible]:outline-sand-50"
        >
          <p className="flex items-center gap-3 text-sm tracking-[0.2em] text-sand-100 uppercase">
            <Prikk />
            Besøk oss
          </p>
          <AvdekkTekst
            id="besok-tittel"
            i={6}
            deler={[BUTIKK.adresse.gate]}
            className="mt-3 text-4xl md:text-5xl"
          />
          <p className="mt-5 text-lg text-sand-100">{BUTIKK.beliggenhet}.</p>
          {info?.bekreftet && info.apningstider.length > 0 && (
            <dl className="mt-6 grid max-w-xs grid-cols-[auto_1fr] gap-x-6 gap-y-1">
              {info.apningstider.map((a) => (
                <div key={a.dager} className="contents">
                  <dt>{a.dager}</dt>
                  <dd>{a.tid}</dd>
                </div>
              ))}
            </dl>
          )}
          <ul className="mt-8 space-y-3">
            <li>
              <a
                href={BUTIKK.kart}
                className="inline-flex min-h-11 items-center gap-3 underline-offset-4 hover:underline"
                rel="noopener"
              >
                <MapPin className="size-4" aria-hidden /> Veibeskrivelse
              </a>
            </li>
            <li>
              <a
                href={BUTIKK.telefon.lenke}
                className="inline-flex min-h-11 items-center gap-3 underline-offset-4 hover:underline"
              >
                <Phone className="size-4" aria-hidden /> {BUTIKK.telefon.visning}
              </a>
            </li>
          </ul>
          <Button asChild variant="rosa" size="lg" className="mt-8">
            <Link href="/kontakt/">Kontakt og kart</Link>
          </Button>
        </Inn>
      </div>
    </section>
  )
}
