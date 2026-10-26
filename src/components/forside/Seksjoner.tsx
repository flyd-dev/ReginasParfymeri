import Image from 'next/image'
import Link from 'next/link'
import { BILDER } from '@/innhold/bilder'
import { BUTIKK, HISTORIE, HUDPLEIE, KUN_I_BUTIKKEN, NISJE } from '@/innhold/butikk'
import type { Kortdata } from '@/lib/visning'
import { Ikon } from '../Ikon'
import { Produktkort } from '../produkt/Produktkort'
import { Produktrad } from '../produkt/Produktrad'
import styles from './Seksjoner.module.css'

export function Nisjeduft({ produkter, antall }: { produkter: Kortdata[]; antall: number }) {
  return (
    <section className={`${styles.nisje} seksjon`} aria-labelledby="nisje-tittel">
      <div className="ramme">
        <div className={styles.nisjeHode}>
          <div className={styles.nisjeTekst}>
            <p className="kicker">Nisjeduft</p>
            <h2 id="nisje-tittel" className="t-1">
              Håndplukket, med karakter
            </h2>
            <p className="ingress">{NISJE.tekst}</p>
          </div>
          <div className={styles.nisjeLenker}>
            <Link href="/kategori/nisjeduft" className="knapp knapp--sekundar">
              Alle {antall} nisjedufter <Ikon navn="pil" storrelse={18} data-pil />
            </Link>
          </div>
        </div>
        <div data-avdekk>
          <Produktrad etikett="Utvalgte nisjedufter">
            {produkter.map((p) => (
              <li key={p.id}>
                <Produktkort
                  produkt={p}
                  avdekk={false}
                  sizes="(min-width: 64rem) 22vw, (min-width: 40rem) 40vw, 72vw"
                />
              </li>
            ))}
          </Produktrad>
        </div>
      </div>
    </section>
  )
}

export function Veiledning() {
  return (
    <section className={`${styles.veiledning} seksjon`} aria-labelledby="veiledning-tittel">
      <div className={`${styles.veiledningRutenett} ramme`}>
        <figure className={styles.veiledningBilde} data-avdekk>
          <Image
            src={BILDER.medarbeidere.bilde}
            alt={BILDER.medarbeidere.alt}
            placeholder="blur"
            sizes="(min-width: 64rem) 50vw, 100vw"
            className={styles.fyll}
          />
        </figure>
        <div className={styles.veiledningTekst} data-avdekk>
          <p className="kicker">Personlig veiledning</p>
          <h2 id="veiledning-tittel" className="t-1">
            Femte generasjon, samme engasjement
          </h2>
          {HISTORIE.tekst.map((t) => (
            <p key={t} className={styles.avsnitt}>
              {t}
            </p>
          ))}
          <dl className={styles.tidslinje}>
            <div>
              <dt className="tall">{HISTORIE.grunnlagt}</dt>
              <dd>Nilsen & Sønner grunnlegges</dd>
            </div>
            <div>
              <dt className="tall">{HISTORIE.etablert}</dt>
              <dd>AS Regina etableres</dd>
            </div>
            <div>
              <dt>I dag</dt>
              <dd>Grethe Kongshavn og datteren Maria</dd>
            </div>
          </dl>
          <div className={styles.knapperad}>
            <a href={BUTIKK.telefon.lenke} className="knapp knapp--sekundar">
              <Ikon navn="telefon" storrelse={18} /> Ring {BUTIKK.telefon.visning}
            </a>
            <Link href="/om-regina" className="tekstlenke">
              Mer om Regina
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Hudpleieavdeling() {
  return (
    <section className={`${styles.hudpleie}`} aria-labelledby="hudpleie-tittel">
      <div className={`${styles.hudpleieRutenett} ramme`}>
        <div className={styles.hudpleieTekst} data-avdekk>
          <p className="kicker">Hudpleieavdelingen</p>
          <h2 id="hudpleie-tittel" className="t-2">
            Behandlinger i andre etasje
          </h2>
          <p>{HUDPLEIE.tekst}</p>
          <a href={BUTIKK.timebestilling} className="knapp knapp--mork">
            <Ikon navn="kalender" storrelse={18} /> Bestill time
            <span className="skjult"> (åpner timebestillingen hos Ledig Time)</span>
          </a>
          <p className="mini dempet">Timebestillingen åpnes hos Ledig Time.</p>
        </div>
        <figure className={styles.hudpleieBilde} data-avdekk>
          <Image
            src={BILDER.salong.bilde}
            alt={BILDER.salong.alt}
            placeholder="blur"
            sizes="(min-width: 64rem) 55vw, 100vw"
            className={styles.fyll}
          />
        </figure>
      </div>
    </section>
  )
}

export function Merkevegg({ merker }: { merker: { navn: string; href: string; antall: number }[] }) {
  return (
    <section className="seksjon" aria-labelledby="merker-tittel">
      <div className={`${styles.merkeRutenett} ramme`}>
        <div className={styles.merkeHode}>
          <p className="kicker">Merker</p>
          <h2 id="merker-tittel" className="t-1">
            {merker.length} merker i nettbutikken
          </h2>
        </div>
        <ul role="list" className={styles.merkevegg}>
          {merker.map((m) => (
            <li key={m.href}>
              <Link href={m.href}>
                {m.navn}
                <sup className="tall">{m.antall}</sup>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/merker" className={`tekstlenke ${styles.alleMerker}`}>
          Alle merker A–Å <Ikon navn="pil" storrelse={16} data-pil />
        </Link>
        <div className={styles.butikkmerker}>
          <figure className={styles.butikkmerkerBilde} data-avdekk>
            <Image
              src={BILDER.tomFord.bilde}
              alt={BILDER.tomFord.alt}
              placeholder="blur"
              sizes="(min-width: 64rem) 30vw, 100vw"
              className={styles.fyll}
            />
          </figure>
          <div className={styles.butikkmerkerTekst} data-avdekk>
            <p className="kicker">Bare i butikken</p>
            <p className="t-3">{KUN_I_BUTIKKEN.slice(0, 6).join(', ')} og flere.</p>
            <p className="dempet">
              Enkelte eksklusive merker er ikke tilgjengelige i nettbutikken, etter avtale med leverandørene.
              Kom innom Haraldsgata eller ring oss – vi hjelper deg gjerne.
            </p>
            <Link href="/merker#butikken" className="tekstlenke">
              Se merkene i butikken <Ikon navn="pil" storrelse={16} data-pil />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Besok() {
  return (
    <section className={`${styles.besok} seksjon`} id="besok" aria-labelledby="besok-tittel">
      <div className={`${styles.besokRutenett} ramme`}>
        <figure className={styles.besokBilde} data-avdekk>
          <Image
            src={BILDER.disken.bilde}
            alt={BILDER.disken.alt}
            placeholder="blur"
            sizes="(min-width: 64rem) 30vw, 80vw"
            className={styles.fyll}
          />
        </figure>
        <div className={styles.besokTekst} data-avdekk>
          <p className="kicker">Besøk oss</p>
          <h2 id="besok-tittel" className="t-1">
            Haraldsgata 138
          </h2>
          <p className="ingress">
            {BUTIKK.beliggenhet}. Her har du hele sortimentet – også merkene som ikke selges på nett.
          </p>
          <ul role="list" className={styles.kontakt}>
            <li>
              <Ikon navn="sted" />
              <a href={BUTIKK.kart}>
                {BUTIKK.adresse.gate}, {BUTIKK.adresse.postnr} {BUTIKK.adresse.sted}
                <span className="skjult"> (åpner kart)</span>
              </a>
            </li>
            <li>
              <Ikon navn="telefon" />
              <a href={BUTIKK.telefon.lenke}>{BUTIKK.telefon.visning}</a>
            </li>
            <li>
              <Ikon navn="post" />
              <a href={`mailto:${BUTIKK.epost}`}>{BUTIKK.epost}</a>
            </li>
          </ul>
          <div className={styles.knapperad}>
            <a href={BUTIKK.kart} className="knapp knapp--sekundar">
              Veibeskrivelse <Ikon navn="utenfor" storrelse={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
