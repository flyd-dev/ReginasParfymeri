import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Brodsmuler } from '@/components/Brodsmuler'
import { Ikon } from '@/components/Ikon'
import { BILDER } from '@/innhold/bilder'
import { BUTIKK, KUN_I_BUTIKKEN } from '@/innhold/butikk'
import { hentKatalog } from '@/lib/katalog/kilde'
import styles from './merker.module.css'

export const metadata: Metadata = {
  title: 'Merker A–Å',
  description: 'Alle merkene i Reginas nettbutikk – og merkene du finner i butikken i Haraldsgata.',
}

function forbokstav(navn: string): string {
  const b = navn.trim().charAt(0).toLocaleUpperCase('nb-NO')
  return /\p{L}/u.test(b) ? b.normalize('NFD').replace(/\p{M}/gu, '') : '#'
}

export default async function Merkeoversikt() {
  const katalog = await hentKatalog()
  const merker = katalog.merker.filter((m) => m.antall > 0)
  const grupper = new Map<string, typeof merker>()
  for (const m of merker) {
    const b = forbokstav(m.navn)
    grupper.set(b, [...(grupper.get(b) ?? []), m])
  }
  const bokstaver = [...grupper.keys()].sort((a, b) => a.localeCompare(b, 'nb'))

  return (
    <div className={`${styles.side} ramme`}>
      <Brodsmuler smuler={[{ navn: 'Merker' }]} />
      <header className={styles.hode}>
        <p className="kicker">Merker A–Å</p>
        <h1 className="t-1">{merker.length} merker i nettbutikken</h1>
        <nav aria-label="Hopp til bokstav" className={styles.alfabet}>
          <ul role="list">
            {bokstaver.map((b) => (
              <li key={b}>
                <a href={`#bokstav-${b}`}>{b}</a>
              </li>
            ))}
            <li>
              <a href="#butikken" className={styles.butikklenke}>
                Bare i butikken
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <div className={styles.grupper}>
        {bokstaver.map((b) => (
          <section key={b} id={`bokstav-${b}`} className={styles.gruppe} aria-labelledby={`tittel-${b}`}>
            <h2 id={`tittel-${b}`} className={styles.bokstav}>
              {b}
            </h2>
            <ul role="list">
              {grupper.get(b)?.map((m) => (
                <li key={m.slug}>
                  <Link href={`/merker/${m.slug}`} className={styles.merke}>
                    {m.navn} <span className="tall">{m.antall}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section id="butikken" className={styles.butikken} aria-labelledby="butikken-tittel">
        <figure className={styles.bilde}>
          <Image
            src={BILDER.tomFord.bilde}
            alt={BILDER.tomFord.alt}
            placeholder="blur"
            sizes="(min-width: 64rem) 40vw, 100vw"
          />
        </figure>
        <div className={styles.butikktekst}>
          <p className="kicker">Bare i butikken</p>
          <h2 id="butikken-tittel" className="t-2">
            Merker du finner i Haraldsgata
          </h2>
          <p>
            Enkelte av Reginas eksklusive merker er ikke tilgjengelige i nettbutikken, etter avtale med
            leverandørene. Kom innom, eller kontakt oss – vi hjelper deg gjerne.
          </p>
          <ul role="list" className={styles.butikkmerker}>
            {KUN_I_BUTIKKEN.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <div className={styles.kontakt}>
            <a href={BUTIKK.telefon.lenke} className="knapp knapp--sekundar">
              <Ikon navn="telefon" storrelse={18} /> Ring {BUTIKK.telefon.visning}
            </a>
            <a href={`mailto:${BUTIKK.epost}`} className="tekstlenke">
              Send en e-post
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
