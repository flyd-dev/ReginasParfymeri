'use client'

import { ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { NavigationMenu as Nav } from 'radix-ui'
import { BILDER } from '@/content/bilder'
import { BUTIKK } from '@/content/butikk'
import { kategoriUrl } from '@/lib/lenker'
import type { Menypunkt } from '@/lib/meny'

const lenkeKlasse =
  'inline-flex h-11 items-center gap-1 px-3 text-[0.9375rem] font-medium tracking-wide text-regina-plum transition-colors duration-(--dur-fast) hover:text-regina-pink-strong data-[state=open]:text-regina-pink-strong'

function Panel({ punkt }: { punkt: Menypunkt }) {
  return (
    <div className="mx-auto grid max-w-screen-2xl grid-cols-[1fr_18rem] gap-12 px-10 py-10">
      <div>
        <Nav.Link asChild>
          <Link
            href={kategoriUrl(punkt.sti)}
            className="font-heading text-3xl text-regina-plum hover:text-regina-pink-strong"
          >
            {punkt.navn} <span className="font-sans text-base text-sand-ink">· alle {punkt.antall}</span>
          </Link>
        </Nav.Link>
        <ul className="mt-6 grid grid-cols-3 gap-x-10 gap-y-6 xl:grid-cols-4">
          {punkt.barn.map((u) => (
            <li key={u.sti.join('/')}>
              <Nav.Link asChild>
                <Link
                  href={kategoriUrl(u.sti)}
                  className="font-medium text-regina-plum hover:text-regina-pink-strong"
                >
                  {u.navn}
                </Link>
              </Nav.Link>
              {u.barn.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {u.barn.slice(0, 6).map((b) => (
                    <li key={b.sti.join('/')}>
                      <Nav.Link asChild>
                        <Link
                          href={kategoriUrl(b.sti)}
                          className="text-sm text-sand-ink hover:text-regina-pink-strong"
                        >
                          {b.navn}
                        </Link>
                      </Nav.Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
      <Link href="/kontakt/" className="group block" tabIndex={-1}>
        <div className="relative aspect-[4/5] overflow-hidden bg-sand-100">
          <Image
            src={BILDER.fasade.bilde}
            alt={BILDER.fasade.alt}
            fill
            sizes="288px"
            className="object-cover transition-transform duration-(--dur-slow) group-hover:scale-[1.02]"
          />
        </div>
        <p className="mt-3 font-heading text-lg italic">Besøk butikken</p>
        <p className="text-sm text-sand-ink">
          {BUTIKK.adresse.gate}, {BUTIKK.adresse.sted}
        </p>
      </Link>
    </div>
  )
}

/** Megameny på stor skjerm. Radix gir tastatur (piler, Esc, Tab) og åpning ved peker. */
export function Megameny({ meny }: { meny: Menypunkt[] }) {
  return (
    <Nav.Root className="relative z-40 hidden border-t border-sand-200 lg:block" aria-label="Hovedmeny">
      <Nav.List className="mx-auto flex max-w-screen-2xl items-center justify-center px-6">
        {meny.map((punkt) => (
          <Nav.Item key={punkt.sti.join('/')}>
            <Nav.Trigger className={`group ${lenkeKlasse}`}>
              {punkt.navn}
              <ChevronDown
                className="size-3.5 transition-transform duration-(--dur-base) group-data-[state=open]:rotate-180"
                aria-hidden
              />
            </Nav.Trigger>
            <Nav.Content className="data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out">
              <Panel punkt={punkt} />
            </Nav.Content>
          </Nav.Item>
        ))}
        <Nav.Item>
          <Nav.Link asChild>
            <Link href="/merker/" className={lenkeKlasse}>
              Merker
            </Link>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link asChild>
            <Link href="/behandlinger/" className={lenkeKlasse}>
              Behandlinger
            </Link>
          </Nav.Link>
        </Nav.Item>
      </Nav.List>
      <div className="absolute inset-x-0 top-full">
        <Nav.Viewport className="relative h-(--radix-navigation-menu-viewport-height) w-full origin-top overflow-hidden border-b border-sand-200 bg-paper transition-[height] duration-(--dur-base) data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in" />
      </div>
    </Nav.Root>
  )
}
