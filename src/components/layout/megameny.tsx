// Bygget etter «Rich Navigation Menu» (shadcnui-blocks, MIT) på 21st.dev – https://21st.dev/@shadcnui-blocks/components/navigation-menu-06. Egen kode; ingen kode er kopiert.
// Bildekolonnen er bare idéen fra «Shop Navigation Menu» (Bundui, lisens ikke oppgitt) – https://21st.dev/@bundui/components/navigation-menu4.
// Menypunktene ruller ved peker (rulletekst.tsx, etter «Text Roll»), og radene i panelet kommer inn én etter én når
// det åpnes (liste-inn.ts, etter «Animated List»).
'use client'

import { ArrowRight, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { NavigationMenu as Nav } from 'radix-ui'
import { useId } from 'react'
import { Produktbilde } from '@/components/produkt/produktbilde'
import { BILDER } from '@/content/bilder'
import { BUTIKK } from '@/content/butikk'
import { kategoriUrl, produktUrl } from '@/lib/lenker'
import { menybeskrivelse, type Menyprodukt, type Menypunkt } from '@/lib/meny'
import { listeInn, plass } from './liste-inn'
import { Rulletekst } from './rulletekst'

// Tynn rosa strek under punktet ved peker og når panelet er åpent – bare transform.
const lenkeKlasse =
  'group/rull relative inline-flex h-12 items-center gap-1 rounded-md px-3 text-[0.9375rem] font-medium tracking-wide text-regina-plum transition-colors duration-(--dur-fast) after:absolute after:inset-x-3 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-regina-pink-strong after:transition-transform after:duration-(--dur-base) after:ease-out hover:text-regina-pink-strong hover:after:scale-x-100 data-[state=open]:text-regina-pink-strong data-[state=open]:after:scale-x-100'

const kolonneoverskrift =
  'flex h-6 items-center text-xs font-semibold tracking-[0.16em] text-sand-ink uppercase'

/**
 * Ett menypunkt: navn og en andrelinje fra kategoritreet. Lenken omslutter bare navnet (synlig tekst = navn,
 * WCAG 2.5.3) og dekker hele raden med ::after; andrelinjen er lenkens beskrivelse. Fokusringen tegnes på raden.
 * Raden har runde hjørner og lys rosa flate ved peker og fokus (R-32); andrelinjen er sand-ink-deep, som holder
 * kontrasten både på papir og på regina-pink-50.
 */
function Rad({ punkt, i }: { punkt: Menypunkt; i: number }) {
  const id = useId()
  return (
    <li
      data-slot="megameny-rad"
      style={plass(i)}
      className={`group/rad relative h-full rounded-lg px-4 py-3 transition-colors duration-(--dur-fast) hover:bg-regina-pink-50 has-[a:focus-visible]:bg-regina-pink-50 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-regina-pink-strong has-[a:focus-visible]:outline-solid ${listeInn}`}
    >
      <Nav.Link asChild>
        <Link
          href={kategoriUrl(punkt.sti)}
          aria-describedby={id}
          className="block font-medium text-regina-plum transition-colors duration-(--dur-fast) group-hover/rad:text-regina-pink-strong after:absolute after:inset-0 focus-visible:outline-none"
        >
          {punkt.navn}
        </Link>
      </Nav.Link>
      <p id={id} className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-sand-ink-deep">
        {menybeskrivelse(punkt)}
      </p>
    </li>
  )
}

/** Bildekolonnen: kategoriens mest solgte vare på papir, eller butikken når det ikke finnes noen. */
function Bildekolonne({ punkt, vare }: { punkt: Menypunkt; vare: Menyprodukt | undefined }) {
  if (!vare) {
    return (
      <>
        <p className={kolonneoverskrift}>Butikken</p>
        <Nav.Link asChild>
          <Link href="/kontakt/" className="group mt-4 block">
            <span className="relative block aspect-square overflow-hidden rounded-xl bg-sand-100">
              <Image
                src={BILDER.fasade.bilde}
                alt=""
                fill
                sizes="(min-width: 1280px) 15rem, 13rem"
                className="object-cover transition-transform duration-(--dur-slow) ease-out group-hover:scale-[1.03]"
              />
            </span>
            <span className="mt-3 block font-heading text-xl text-regina-plum italic group-hover:text-regina-pink-strong">
              Besøk butikken
            </span>
            <span className="mt-0.5 block text-sm text-sand-ink">
              {BUTIKK.adresse.gate}, {BUTIKK.adresse.sted}
            </span>
          </Link>
        </Nav.Link>
      </>
    )
  }
  return (
    <>
      <p className={kolonneoverskrift}>
        {vare.kilde === 'utvalgt' ? 'Utvalgt' : 'Mest solgt'} i {punkt.navn.toLocaleLowerCase('nb')}
      </p>
      <Nav.Link asChild>
        <Link href={produktUrl(vare.slug)} data-slot="megameny-vare" className="group mt-4 block">
          <Produktbilde
            src={vare.bilde}
            alt=""
            sizes="(min-width: 1280px) 15rem, 13rem"
            className="w-full border border-sand-200"
            zoom
          />
          {vare.merke && (
            <span className="mt-3 block text-xs tracking-[0.14em] text-sand-ink uppercase">{vare.merke}</span>
          )}
          <span className="mt-1 block font-heading text-xl leading-snug text-regina-plum transition-colors duration-(--dur-fast) group-hover:text-regina-pink-strong">
            {vare.navn}
          </span>
          <span className="mt-1 block text-base text-regina-plum">{vare.pris}</span>
        </Link>
      </Nav.Link>
    </>
  )
}

function Panel({ punkt, vare }: { punkt: Menypunkt; vare: Menyprodukt | undefined }) {
  const navn = punkt.navn.toLocaleLowerCase('nb')
  return (
    <div className="mx-auto grid max-w-screen-2xl grid-cols-[minmax(0,1fr)_16rem] px-6 py-9 xl:grid-cols-[minmax(0,1fr)_18rem] xl:px-10">
      <div className="pr-8 xl:pr-12">
        <div className={`flex h-6 items-center justify-between gap-6 px-4 ${listeInn}`} style={plass(0)}>
          <p className={kolonneoverskrift}>Kategorier</p>
          <Nav.Link asChild>
            <Link
              href={kategoriUrl(punkt.sti)}
              className="group/alle inline-flex items-center gap-1.5 text-[0.9375rem] font-medium text-regina-pink-strong underline-offset-4 hover:underline"
            >
              Alt i {navn} ({punkt.antall})
              <ArrowRight
                className="size-4 transition-transform duration-(--dur-fast) group-hover/alle:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </Nav.Link>
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 xl:grid-cols-3">
          {punkt.barn.map((u, i) => (
            <Rad key={u.sti.join('/')} punkt={u} i={i + 1} />
          ))}
        </ul>
      </div>
      <div className={`border-l border-sand-200 pl-8 xl:pl-12 ${listeInn}`} style={plass(3)}>
        <Bildekolonne punkt={punkt} vare={vare} />
      </div>
    </div>
  )
}

/** Megameny på stor skjerm. Radix gir tastatur (piler, Esc, Tab) og åpning ved peker. */
export function Megameny({ meny, utvalg }: { meny: Menypunkt[]; utvalg: Record<string, Menyprodukt> }) {
  return (
    <Nav.Root className="relative z-40 hidden border-t border-sand-200 lg:block" aria-label="Hovedmeny">
      <Nav.List className="mx-auto flex max-w-screen-2xl items-center justify-center px-6">
        {meny.map((punkt) => (
          <Nav.Item key={punkt.sti.join('/')}>
            <Nav.Trigger className={`group ${lenkeKlasse}`}>
              <Rulletekst tekst={punkt.navn} />
              <ChevronDown
                className="size-3.5 transition-transform duration-(--dur-base) group-data-[state=open]:rotate-180"
                aria-hidden
              />
            </Nav.Trigger>
            <Nav.Content className="absolute inset-x-0 top-0 duration-(--dur-base) ease-out data-[motion=from-end]:slide-in-from-right-6 data-[motion=from-start]:slide-in-from-left-6 data-[motion=to-end]:slide-out-to-right-6 data-[motion=to-start]:slide-out-to-left-6 data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out">
              <Panel punkt={punkt} vare={utvalg[punkt.sti[0] ?? '']} />
            </Nav.Content>
          </Nav.Item>
        ))}
        <Nav.Item>
          <Nav.Link asChild>
            <Link href="/merker/" className={lenkeKlasse}>
              <Rulletekst tekst="Merker" />
            </Link>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link asChild>
            <Link href="/behandlinger/" className={lenkeKlasse}>
              <Rulletekst tekst="Behandlinger" />
            </Link>
          </Nav.Link>
        </Nav.Item>
      </Nav.List>
      {/* Panelet er en avrundet flate med luft mot kantene og under toppen (R-32). Rammen rundt slipper pekeren
          gjennom, så de 8 px under toppen ikke stjeler klikk fra siden. */}
      <div className="pointer-events-none absolute inset-x-0 top-full mx-auto max-w-screen-2xl px-6 pt-2">
        <Nav.Viewport className="pointer-events-auto relative h-(--radix-navigation-menu-viewport-height) w-full origin-top overflow-hidden rounded-2xl border border-sand-200 bg-paper duration-(--dur-base) ease-out data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-1" />
      </div>
    </Nav.Root>
  )
}
