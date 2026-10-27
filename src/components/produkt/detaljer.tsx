// Bygget etter «FAQ Section» (Tommy Jepsen, MIT) på 21st.dev – https://21st.dev/@tommyjepsen/components/faq-section. Egen kode; ingen kode er kopiert.
// Innholdet som toner og glir inn når en rad åpnes, er bygget etter «Accordion» (Julien Thibeaut / ibelick, Motion Primitives, MIT) på 21st.dev – https://21st.dev/@ibelick/components/accordion. Egen kode; ingen kode er kopiert.

import { ChevronDown, Phone } from 'lucide-react'
import Link from 'next/link'
import { AvdekkTekst } from '@/components/bevegelse/avdekk-tekst'
import { Inn } from '@/components/bevegelse/inn'
import { Button } from '@/components/ui/button'
import { BUTIKK, LEVERING, RETUR } from '@/content/butikk'
import { kategoriUrl, merkeUrl } from '@/lib/lenker'
import type { Produkt } from '@/lib/woocommerce/typer'

const lenke = 'text-regina-pink-strong underline underline-offset-4 hover:text-regina-plum'

/**
 * Detaljene på produktsiden som en spørsmålsliste: til venstre overskrift, en kort invitasjon og kontakt; til
 * høyre rader med tynne linjer. Radene er <details>, så teksten kan leses og åpnes uten JavaScript. Innholdet
 * kommer bare fra produktdataene og src/content/butikk.ts.
 *
 * Bevegelse: overskriften avsløres ord for ord, radene glir inn etter hverandre, og når en rad åpnes, toner
 * innholdet inn og glir et lite stykke ned (CSS-animasjon på [open], ingen høydeanimasjon).
 */
export function Produktdetaljer({ produkt: p, kunIButikk }: { produkt: Produkt; kunIButikk: boolean }) {
  return (
    <section
      aria-labelledby="detaljer-tittel"
      className="grid gap-10 border-t border-sand-200 pt-12 md:grid-cols-[1fr_1.2fr] md:gap-12 md:pt-16 lg:gap-20"
    >
      <div className="md:sticky md:top-32 md:self-start">
        <Inn>
          <p className="inline-flex border border-sand-200 px-2.5 py-1 text-xs tracking-[0.16em] text-sand-ink uppercase">
            Om produktet
          </p>
        </Inn>
        <AvdekkTekst
          id="detaljer-tittel"
          i={1}
          deler={['Godt å ', { tekst: 'vite', className: 'text-regina-pink', som: 'em' }]}
          className="mt-5 text-4xl md:text-5xl"
        />
        <Inn som="p" i={3} className="mt-5 max-w-md text-lg leading-relaxed text-sand-ink">
          Lurer du på noe om {p.visningsnavn}? Spør oss gjerne – på telefon, e-post eller i butikken i
          Haraldsgata.
        </Inn>
        <Inn i={4} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          <Button asChild variant="outline">
            <a href={BUTIKK.telefon.lenke}>
              Ring {BUTIKK.telefon.visning} <Phone aria-hidden />
            </a>
          </Button>
          <a href={`mailto:${BUTIKK.epost}`} className={lenke}>
            {BUTIKK.epost}
          </a>
        </Inn>
      </div>

      <div>
        <Rad tittel="Beskrivelse" apen i={0}>
          {p.beskrivelse ? (
            <Avsnitt tekst={p.beskrivelse} />
          ) : (
            <div className="space-y-2">
              <p>Spør oss i butikken om dette produktet.</p>
              <p className="text-sand-ink">
                {[p.merke?.navn, p.hovedkategori?.navn].filter(Boolean).join(' · ')}
              </p>
            </div>
          )}
        </Rad>
        {!kunIButikk && (
          <>
            <Rad tittel="Levering" i={1}>
              <p>{LEVERING.fra}</p>
              <ul className="mt-4 space-y-3">
                {LEVERING.alternativer.map((a) => (
                  <li key={a.navn}>
                    <span className="font-medium">{a.navn}.</span> {a.tekst}
                  </li>
                ))}
              </ul>
              <p className="mt-4">
                <Link href="/frakt-levering/" className={lenke}>
                  Frakt og levering
                </Link>
              </p>
            </Rad>
            <Rad tittel="Åpent kjøp og retur" i={2}>
              <div className="space-y-3">
                {RETUR.tekst.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </div>
              <p className="mt-4">
                <Link href="/angrerett-og-retur/" className={lenke}>
                  Angrerett og retur
                </Link>
              </p>
            </Rad>
          </>
        )}
        <Rad tittel="Produktinformasjon" i={kunIButikk ? 1 : 3}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
            {p.merke && (
              <>
                <dt className="text-sand-ink">Merke</dt>
                <dd>
                  <Link href={merkeUrl(p.merke.slug)} className={lenke}>
                    {p.merke.navn}
                  </Link>
                </dd>
              </>
            )}
            {p.hovedkategori && (
              <>
                <dt className="text-sand-ink">Kategori</dt>
                <dd>
                  <Link href={kategoriUrl(p.hovedkategori.sti)} className={lenke}>
                    {p.hovedkategori.navn}
                  </Link>
                </dd>
              </>
            )}
            {p.sku && (
              <>
                <dt className="text-sand-ink">Varenummer</dt>
                <dd className="tabular-nums">{p.sku}</dd>
              </>
            )}
          </dl>
        </Rad>
      </div>
    </section>
  )
}

function Rad({
  tittel,
  apen = false,
  i,
  children,
}: {
  tittel: string
  apen?: boolean
  /** Plass i rekken når radene glir inn. */
  i: number
  children: React.ReactNode
}) {
  return (
    <Inn i={i}>
      <details open={apen} className="group/rad border-b border-sand-200">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg font-medium transition-colors duration-(--dur-fast) hover:text-regina-pink-strong [&::-webkit-details-marker]:hidden">
          {tittel}
          <ChevronDown
            className="size-5 shrink-0 text-sand-ink transition-transform duration-(--dur-base) ease-out group-open/rad:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="max-w-prose pb-8 leading-relaxed group-open/rad:animate-in group-open/rad:fade-in group-open/rad:slide-in-from-top-2 group-open/rad:duration-(--dur-slow) group-open/rad:ease-(--ease-ut)">
          {children}
        </div>
      </details>
    </Inn>
  )
}

function Avsnitt({ tekst }: { tekst: string }) {
  return (
    <div className="space-y-4">
      {tekst.split(/\n{2,}/).map((avsnitt, i) => (
        <p key={i} className="whitespace-pre-line">
          {avsnitt}
        </p>
      ))}
    </div>
  )
}
