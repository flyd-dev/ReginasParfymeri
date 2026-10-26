import Link from 'next/link'
import { BUTIKK } from '@/innhold/butikk'
import type { Katalogmeta } from '@/lib/katalog/typer'
import type { Menydata } from '@/lib/visning'
import { Ikon } from '../Ikon'
import styles from './Bunntekst.module.css'

function dato(iso: string): string {
  return new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  )
}

export function Bunntekst({ meny, meta }: { meny: Menydata; meta: Katalogmeta }) {
  return (
    <footer className={styles.bunn} data-flate="mork">
      <div className={`${styles.topp} ramme`}>
        <div className={styles.velkommen}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Reginas originale logofil, uendret */}
          <img
            src="/logo/regina-velkommen.svg"
            alt="Regina ønsker deg velkommen"
            width={599}
            height={354}
            className={styles.logo}
          />
          <p className={styles.adresse}>
            {BUTIKK.adresse.gate}
            <br />
            {BUTIKK.adresse.postnr} {BUTIKK.adresse.sted}
          </p>
          <p className={styles.beliggenhet}>{BUTIKK.beliggenhet}.</p>
        </div>

        <nav className={styles.kolonne} aria-label="Handle">
          <p className={styles.overskrift}>Handle</p>
          <ul role="list">
            {meny.poster.map((p) => (
              <li key={p.id}>
                <Link href={p.href}>{p.etikett}</Link>
              </li>
            ))}
            <li>
              <Link href="/merker">Merker A–Å</Link>
            </li>
          </ul>
        </nav>

        <nav className={styles.kolonne} aria-label="Kundeservice">
          <p className={styles.overskrift}>Kundeservice</p>
          <ul role="list">
            <li>
              <Link href="/kundeservice#levering">Levering</Link>
            </li>
            <li>
              <Link href="/kundeservice#retur">Retur og angrerett</Link>
            </li>
            <li>
              <a href={BUTIKK.betingelser}>
                Salgsbetingelser <Ikon navn="utenfor" storrelse={14} />
              </a>
            </li>
            <li>
              <Link href="/om-regina">Om Regina</Link>
            </li>
          </ul>
        </nav>

        <div className={styles.kolonne}>
          <p className={styles.overskrift}>Kontakt</p>
          <ul role="list">
            <li>
              <a href={BUTIKK.telefon.lenke}>
                <Ikon navn="telefon" storrelse={16} /> {BUTIKK.telefon.visning}
              </a>
            </li>
            <li>
              <a href={`mailto:${BUTIKK.epost}`}>
                <Ikon navn="post" storrelse={16} /> {BUTIKK.epost}
              </a>
            </li>
            <li>
              <a href={BUTIKK.instagram.lenke}>
                <Ikon navn="instagram" storrelse={16} /> {BUTIKK.instagram.navn}
              </a>
            </li>
            <li>
              <a href={BUTIKK.facebook.lenke}>
                <Ikon navn="facebook" storrelse={16} /> Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className={`${styles.bunnlinje} ramme`}>
        <p>
          © {BUTIKK.selskap} · Org.nr. {BUTIKK.orgnr}
        </p>
        <p className={styles.konsept}>
          Konsept for ny nettbutikk, utarbeidet av Flyd. Produkter, priser og lagerstatus er hentet fra
          Reginas nettbutikk {dato(meta.hentet)}.
        </p>
      </div>
    </footer>
  )
}
