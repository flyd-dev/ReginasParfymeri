import { ArrowRight, MapPin, Phone } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Produktbilde } from '@/components/produkt/produktbilde'
import { Button } from '@/components/ui/button'
import { BILDER } from '@/content/bilder'
import { BEHANDLINGER, BUTIKK, HISTORIE, NISJE } from '@/content/butikk'
import { kategoriUrl, merkeUrl } from '@/lib/lenker'
import type { Butikkinfo } from '@/lib/woocommerce/innhold'
import type { Merke, Produkt } from '@/lib/woocommerce/typer'

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
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker && <p className="text-sm tracking-[0.2em] text-sand-ink uppercase">{kicker}</p>}
        <h2 id={id} className="mt-2 text-4xl md:text-5xl">
          {tittel}
        </h2>
      </div>
      {lenke && (
        <Link
          href={lenke.href}
          className="inline-flex items-center gap-2 text-regina-pink-strong hover:underline md:mr-28"
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

/** Kategori-inngang: hovedkategoriene med et ekte produktbilde (den mest solgte varen på lager). */
export function Kategoriinnganger({ innganger }: { innganger: Inngang[] }) {
  return (
    <section
      className="mx-auto max-w-screen-2xl px-4 py-20 md:px-6 md:py-28"
      aria-labelledby="kategorier-tittel"
    >
      <Seksjonstittel id="kategorier-tittel" kicker="Utforsk" tittel="Hva leter du etter?" />
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 xl:gap-x-5">
        {innganger.map((k) => (
          <li key={k.sti.join('/')}>
            <Link href={kategoriUrl(k.sti)} className="group block">
              <Produktbilde
                src={k.produkt?.bilder[0]?.src ?? null}
                alt=""
                sizes="(min-width: 1280px) 13vw, (min-width: 640px) 30vw, 50vw"
                className="transition-opacity duration-(--dur-base) group-hover:opacity-85"
              />
              <p className="mt-3 font-heading text-xl group-hover:text-regina-pink-strong">{k.navn}</p>
              <p className="text-sm text-sand-ink">{k.antall} produkter</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Nisjeduft: Reginas egen beskrivelse (reginaparfymeri.no) og merkene de nevner selv. */
export function Nisjeduft({ merker }: { merker: Merke[] }) {
  return (
    <section className="bg-regina-plum text-sand-50" aria-labelledby="nisje-tittel">
      <div className="mx-auto grid max-w-screen-2xl gap-12 px-4 py-20 md:grid-cols-2 md:px-6 md:py-28">
        <div>
          <p className="text-sm tracking-[0.2em] text-sand-100 uppercase">Nisjeduft</p>
          <h2 id="nisje-tittel" className="mt-3 text-4xl md:text-6xl">
            Dufter med <em className="text-regina-pink">karakter</em>
          </h2>
          <p className="mt-6 max-w-lg text-lg text-sand-100">{NISJE.tekst}</p>
          <p className="mt-4 max-w-lg text-sand-100">{NISJE.veiledning}</p>
          <Button asChild size="lg" variant="rosa" className="mt-9">
            <Link href="/produktkategori/duft/nisjeduft/">Se alle nisjedufter</Link>
          </Button>
        </div>
        <ul className="grid gap-px self-center border border-white/15 bg-white/15 sm:grid-cols-2">
          {merker.map((m) => (
            <li key={m.slug} className="bg-regina-plum">
              <Link
                href={merkeUrl(m.slug)}
                className="flex min-h-24 items-center justify-between gap-4 px-6 py-5 transition-colors duration-(--dur-fast) hover:bg-white/5"
              >
                <span className="font-heading text-2xl">{m.navn}</span>
                <span className="text-sm text-sand-100">{m.antall}</span>
              </Link>
            </li>
          ))}
        </ul>
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
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <div className="relative aspect-[4/5] overflow-hidden bg-sand-100">
          <Image
            src={BILDER.vedDisken.bilde}
            alt={BILDER.vedDisken.alt}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="self-center">
          <p className="text-sm tracking-[0.2em] text-sand-ink uppercase">Familiebedrift</p>
          <h2 id="historie-tittel" className="mt-2 text-4xl md:text-5xl">
            Fem generasjoner i <em className="text-regina-pink">Haugesund</em>
          </h2>
          <ol className="mt-10 border-l border-sand-200">
            {HISTORIE.tidslinje.map((t) => (
              <li key={t.aar} className="relative pb-10 pl-8 last:pb-0">
                <span className="absolute top-2 -left-[5px] size-2.5 bg-regina-pink" aria-hidden />
                <p className="font-heading text-3xl text-regina-plum">{t.aar}</p>
                <p className="mt-1 max-w-md text-sand-ink">{t.tekst}</p>
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

export function Behandlinger() {
  return (
    <section className="bg-sand-100" aria-labelledby="behandling-tittel">
      <div className="mx-auto grid max-w-screen-2xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:px-6 md:py-28">
        <div className="relative order-2 aspect-[4/3] overflow-hidden md:order-1">
          <Image
            src={BILDER.behandlingsrom.bilde}
            alt={BILDER.behandlingsrom.alt}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="order-1 md:order-2">
          <p className="text-sm tracking-[0.2em] text-sand-ink-deep uppercase">
            Hudpleieavdelingen · {BEHANDLINGER.etasje}
          </p>
          <h2 id="behandling-tittel" className="mt-2 text-4xl md:text-5xl">
            Behandlinger i <em className="text-regina-pink">andre etasje</em>
          </h2>
          <p className="mt-6 max-w-lg text-lg">{BEHANDLINGER.tekst}</p>
          <div className="mt-8 flex flex-wrap gap-3">
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
      </div>
    </section>
  )
}

export function Kundeklubb() {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-20 md:px-6 md:py-24" aria-labelledby="klubb-tittel">
      <div className="border border-sand-200 px-6 py-12 text-center md:px-16">
        <p className="text-sm tracking-[0.2em] text-sand-ink uppercase">Kundeklubb</p>
        <h2 id="klubb-tittel" className="mx-auto mt-2 max-w-2xl text-4xl md:text-5xl">
          Reginas <em className="text-regina-pink">kundeklubb</em>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-sand-ink">Les om kundeklubben og hvordan du blir medlem.</p>
        <Button asChild variant="outline" size="lg" className="mt-8 bg-transparent">
          <Link href="/kundeklubb/">Les om kundeklubben</Link>
        </Button>
      </div>
    </section>
  )
}

export function BesokButikken({ info }: { info: Butikkinfo | null }) {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 pb-8 md:px-6" aria-labelledby="besok-tittel">
      <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-16">
        <div className="relative aspect-[4/3] overflow-hidden bg-sand-100">
          <Image
            src={BILDER.interior.bilde}
            alt={BILDER.interior.alt}
            fill
            sizes="(min-width: 768px) 55vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="self-center">
          <p className="text-sm tracking-[0.2em] text-sand-ink uppercase">Besøk oss</p>
          <h2 id="besok-tittel" className="mt-2 text-4xl md:text-5xl">
            Haraldsgata {BUTIKK.adresse.gate.replace(/\D/g, '')}
          </h2>
          <p className="mt-5 max-w-md text-lg text-sand-ink">{BUTIKK.beliggenhet}.</p>
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
                className="inline-flex items-center gap-3 hover:text-regina-pink-strong"
                rel="noopener"
              >
                <MapPin className="size-4" aria-hidden /> Veibeskrivelse
              </a>
            </li>
            <li>
              <a
                href={BUTIKK.telefon.lenke}
                className="inline-flex items-center gap-3 hover:text-regina-pink-strong"
              >
                <Phone className="size-4" aria-hidden /> {BUTIKK.telefon.visning}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
