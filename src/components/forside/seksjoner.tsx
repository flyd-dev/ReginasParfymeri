import { ArrowRight, MapPin, Phone, Quote } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BILDER } from '@/content/bilder'
import { BEHANDLINGER, BUTIKK, HISTORIE, NISJE } from '@/content/butikk'
import type { Nisjemerke, Visningsprodukt } from '@/lib/forside'
import { kategoriUrl } from '@/lib/lenker'
import { cn } from '@/lib/utils'
import type { Butikkinfo } from '@/lib/woocommerce/innhold'
import type { Produkt } from '@/lib/woocommerce/typer'
import { Merkeliste } from './merkeliste'
import { Utstillingsvindu } from './utstillingsvindu'

export function Seksjonstittel({
  kicker,
  tittel,
  lenke,
  id,
  paSand100 = false,
}: {
  kicker?: string
  tittel: React.ReactNode
  lenke?: { href: string; tekst: string }
  id: string
  /** Rosa lenketekst holder ikke kontrast på sand-100; der blir lenken plum. */
  paSand100?: boolean
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
      <div>
        {kicker && <p className="text-sm tracking-[0.2em] text-sand-ink-deep uppercase">{kicker}</p>}
        <h2 id={id} className="mt-3 text-4xl md:text-6xl">
          {tittel}
        </h2>
      </div>
      {lenke && (
        <Link
          href={lenke.href}
          className={cn(
            'inline-flex items-center gap-2 hover:underline md:mr-28',
            paSand100 ? 'text-regina-plum' : 'text-regina-pink-strong',
          )}
        >
          {lenke.tekst} <ArrowRight className="size-4" aria-hidden />
        </Link>
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
    li: 'col-span-2 aspect-[4/3] lg:row-span-2 lg:aspect-auto',
    luft: 'p-[12%] lg:p-[16%]',
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
 */
export function Kategoriinnganger({
  innganger,
  ovrige,
}: {
  innganger: Inngang[]
  ovrige: { navn: string; sti: string[]; antall: number }[]
}) {
  return (
    <section className="bg-sand-100" aria-labelledby="kategorier-tittel">
      <div className="mx-auto max-w-screen-2xl px-4 py-20 md:px-6 md:py-28">
        <Seksjonstittel id="kategorier-tittel" kicker="Utforsk" tittel="Hva leter du etter?" paSand100 />
        <ul className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 lg:grid-rows-[repeat(2,20rem)] xl:grid-rows-[repeat(2,23rem)]">
          {innganger.map((k, i) => {
            const flis = FLIS[i] ?? FLIS_LITEN
            return (
              <li key={k.sti.join('/')} className={cn('relative', flis.li)}>
                <Link
                  href={kategoriUrl(k.sti)}
                  className="group absolute inset-0 flex flex-col overflow-hidden border border-sand-200 bg-paper"
                >
                  <span className="absolute top-4 left-5 z-10 text-sm text-sand-ink tabular-nums md:left-6">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="avdekk relative isolate min-h-0 flex-1 bg-paper">
                    {k.produkt?.bilder[0] && (
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
                    )}
                  </span>
                  <span className="flex items-end justify-between gap-4 border-t border-sand-200 px-5 py-4 md:px-6 md:py-5">
                    <span>
                      <span className={cn('block font-heading leading-none', flis.tittel)}>{k.navn}</span>
                      <span className="mt-2 block text-sm text-sand-ink">{k.antall} produkter</span>
                    </span>
                    <ArrowRight
                      className="mb-1 size-5 shrink-0 transition-transform duration-(--dur-base) group-hover:translate-x-1"
                      aria-hidden
                    />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
        {ovrige.length > 0 && (
          <nav aria-label="Flere kategorier" className="mt-10 flex flex-wrap items-baseline gap-x-8 gap-y-3">
            <span className="text-sm tracking-[0.2em] text-sand-ink-deep uppercase">Også</span>
            {ovrige.map((k) => (
              <Link
                key={k.sti.join('/')}
                href={kategoriUrl(k.sti)}
                className="font-heading text-2xl underline-offset-4 hover:underline"
              >
                {k.navn}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </section>
  )
}

/** Nisjeduft på plum: Reginas egen tekst og utstillingsvinduet med fem utvalgte dufter. */
export function Nisjeduft({ produkter }: { produkter: Visningsprodukt[] }) {
  return (
    <section
      className="bg-regina-plum text-sand-50 [&_:focus-visible]:outline-sand-50"
      aria-labelledby="nisje-tittel"
    >
      <div className="mx-auto max-w-screen-2xl px-4 py-20 md:px-6 md:py-28">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-sm tracking-[0.2em] text-sand-100 uppercase">Nisjeduft</p>
            <h2 id="nisje-tittel" className="mt-3 text-[clamp(2.75rem,1.4rem+4.4vw,6rem)] leading-[0.95]">
              Dufter med <em className="text-regina-pink">karakter</em>
            </h2>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <p className="text-lg text-sand-100">{NISJE.tekst}</p>
            <Button asChild size="lg" variant="rosa" className="mt-8">
              <Link href="/produktkategori/duft/nisjeduft/">Se alle nisjedufter</Link>
            </Button>
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

/** Reginas eget løfte om veiledning (reginaparfymeri.no) – ikke et kundesitat. */
export function Veiledning() {
  return (
    <section className="bg-sand-100" aria-labelledby="veiledning-tittel">
      <div className="mx-auto max-w-5xl px-4 py-20 text-center md:px-6 md:py-32">
        <h2 id="veiledning-tittel" className="sr-only">
          Personlig veiledning
        </h2>
        <Quote className="mx-auto size-10 text-regina-pink" aria-hidden />
        <blockquote className="mt-8 font-heading text-[clamp(1.75rem,1.1rem+2.2vw,3.25rem)] leading-[1.18]">
          {NISJE.veiledning}
        </blockquote>
        <p className="mt-8 text-sm tracking-[0.2em] text-sand-ink-deep uppercase">
          Regina Parfymeri · {BUTIKK.adresse.gate}
        </p>
        <Link
          href="/kontakt/"
          className="mt-6 inline-flex items-center gap-2 border-b border-regina-plum pb-1 hover:border-regina-pink"
        >
          Finn veien til butikken <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  )
}

/** Historien fra 1863 – bare hendelser med kilde (src/content/butikk.ts). */
export function Historien() {
  return (
    <section
      className="mx-auto max-w-screen-2xl px-4 py-20 md:px-6 md:py-28"
      aria-labelledby="historie-tittel"
    >
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="relative pb-[22%] lg:col-span-6 lg:pb-[16%]">
          <div className="avdekk relative aspect-[4/5] w-[80%] overflow-hidden bg-sand-100">
            <Image
              src={BILDER.vedDisken.bilde}
              alt={BILDER.vedDisken.alt}
              fill
              sizes="(min-width: 1024px) 38vw, 80vw"
              className="object-cover"
            />
          </div>
          <div className="avdekk absolute right-0 bottom-0 aspect-square w-[50%] overflow-hidden border-[10px] border-sand-50 bg-sand-100">
            <Image
              src={BILDER.fasade.bilde}
              alt={BILDER.fasade.alt}
              fill
              sizes="(min-width: 1024px) 24vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="self-center lg:col-span-5 lg:col-start-8">
          <p className="text-sm tracking-[0.2em] text-sand-ink uppercase">Familiebedrift</p>
          <h2 id="historie-tittel" className="mt-3 text-4xl md:text-6xl">
            Fem generasjoner i Haugesund
          </h2>
          <ol className="mt-10 border-t border-sand-200">
            {HISTORIE.tidslinje.map((t) => (
              <li
                key={t.aar}
                className="grid grid-cols-[6.5rem_1fr] gap-6 border-b border-sand-200 py-5 md:grid-cols-[8.5rem_1fr]"
              >
                <p className="font-heading text-4xl leading-none text-regina-pink md:text-5xl">{t.aar}</p>
                <p className="self-center text-sand-ink-deep">{t.tekst}</p>
              </li>
            ))}
          </ol>
          <Link
            href="/om-oss/"
            className="mt-10 inline-flex items-center gap-2 text-regina-pink-strong hover:underline"
          >
            Les historien <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}

/** Behandlinger: bildet går ut i kanten på den ene siden. */
export function Behandlinger() {
  return (
    <section className="grid bg-sand-100 lg:grid-cols-2" aria-labelledby="behandling-tittel">
      <div className="avdekk relative min-h-[22rem] overflow-hidden lg:min-h-[42rem]">
        <Image
          src={BILDER.behandlingsrom.bilde}
          alt={BILDER.behandlingsrom.alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="self-center px-4 py-16 md:px-12 lg:px-16 xl:px-24">
        <p className="text-sm tracking-[0.2em] text-sand-ink-deep uppercase">
          Hudpleieavdelingen · {BEHANDLINGER.etasje}
        </p>
        <h2 id="behandling-tittel" className="mt-3 text-4xl md:text-6xl">
          Behandlinger i andre etasje
        </h2>
        <p className="mt-6 max-w-lg text-lg">{BEHANDLINGER.tekst}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href={BEHANDLINGER.timebestilling} rel="noopener">
              Bestill time
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-transparent">
            <Link href="/behandlinger/">Om behandlingene</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

/** Besøk butikken: kortet ligger over kanten av bildet. Åpningstider bare når de er bekreftet i WordPress. */
export function BesokButikken({ info }: { info: Butikkinfo | null }) {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-20 md:px-6 md:py-28" aria-labelledby="besok-tittel">
      <div className="grid lg:grid-cols-12">
        <div className="avdekk relative aspect-[4/3] overflow-hidden bg-sand-100 lg:col-span-8 lg:col-start-1 lg:row-start-1">
          <Image
            src={BILDER.interior.bilde}
            alt={BILDER.interior.alt}
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="relative mx-4 -mt-16 border border-sand-200 bg-paper p-8 md:mx-12 md:p-12 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:mx-0 lg:mt-0 lg:self-center">
          <p className="text-sm tracking-[0.2em] text-sand-ink uppercase">Besøk oss</p>
          <h2 id="besok-tittel" className="mt-3 text-4xl md:text-5xl">
            {BUTIKK.adresse.gate}
          </h2>
          <p className="mt-5 text-lg text-sand-ink">{BUTIKK.beliggenhet}.</p>
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
                className="inline-flex min-h-11 items-center gap-3 hover:text-regina-pink-strong"
                rel="noopener"
              >
                <MapPin className="size-4" aria-hidden /> Veibeskrivelse
              </a>
            </li>
            <li>
              <a
                href={BUTIKK.telefon.lenke}
                className="inline-flex min-h-11 items-center gap-3 hover:text-regina-pink-strong"
              >
                <Phone className="size-4" aria-hidden /> {BUTIKK.telefon.visning}
              </a>
            </li>
          </ul>
          <Button asChild variant="outline" size="lg" className="mt-8 bg-transparent">
            <Link href="/kontakt/">Kontakt og kart</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
