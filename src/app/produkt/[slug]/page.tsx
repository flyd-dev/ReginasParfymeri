import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Brodsmuler } from '@/components/Brodsmuler'
import { Ikon } from '@/components/Ikon'
import { Galleri } from '@/components/produkt/Galleri'
import { Kjopsboks, type Kjopsdata } from '@/components/produkt/Kjopsboks'
import { Beskrivelse, Duftpyramide } from '@/components/produkt/Produktinfo'
import { Produktkort } from '@/components/produkt/Produktkort'
import { Produktrad } from '@/components/produkt/Produktrad'
import { BILDER } from '@/innhold/bilder'
import { BUTIKK, LEVERING, NISJE, RETUR } from '@/innhold/butikk'
import type { NyLinje } from '@/lib/handlekurv/kurv'
import { lagLinje } from '@/lib/handlekurv/kurv'
import { ingress } from '@/lib/katalog/innhold'
import { hentKatalog } from '@/lib/katalog/kilde'
import { hovedkategori, kategoristi, produkterI, sorter } from '@/lib/katalog/sporring'
import { tilKort } from '@/lib/visning'
import styles from './produkt.module.css'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = (await hentKatalog()).produkter.find((x) => x.slug === slug)
  if (!p) return { title: 'Fant ikke produktet' }
  const tittel = p.merke ? `${p.visningsnavn} – ${p.merke.navn}` : p.visningsnavn
  return {
    title: tittel,
    description: ingress(p.beskrivelse, 155) || `${tittel} hos Regina Parfymeri i Haugesund.`,
    openGraph: { title: tittel, images: p.bilder[0] ? [{ url: p.bilder[0].src }] : undefined },
  }
}

export default async function Produktside({ params }: Props) {
  const [{ slug }, katalog] = await Promise.all([params, hentKatalog()])
  const p = katalog.produkter.find((x) => x.slug === slug)
  if (!p) notFound()

  const kategori = hovedkategori(katalog, p)
  const sti = kategori ? kategoristi(katalog, kategori) : []

  const linjer: Record<number, NyLinje> = {}
  if (p.type === 'enkel') linjer[0] = lagLinje(p, null)
  for (const v of p.varianter) linjer[v.id] = lagLinje(p, v.id)

  const data: Kjopsdata = {
    navn: p.visningsnavn,
    merke: p.merke?.navn ?? null,
    type: p.type,
    pris: p.pris,
    prisspenn: p.prisspenn,
    lager: p.lager,
    kjopbar: p.kjopbar,
    maks: p.maks,
    egenskaper: p.egenskaper,
    varianter: p.varianter.map((v) => ({
      id: v.id,
      valg: v.valg,
      pris: v.pris,
      lager: v.lager,
      kjopbar: v.kjopbar,
      maks: v.maks,
      sku: v.sku,
    })),
    linjer,
  }

  const fraMerket = p.merke
    ? sorter(
        katalog.produkter.filter((x) => x.merke?.id === p.merke?.id && x.id !== p.id),
        'nyeste',
      )
        .filter((x) => x.lager.status !== 'utsolgt')
        .slice(0, 8)
        .map(tilKort)
    : []
  const fraKategorien =
    fraMerket.length < 4 && kategori
      ? sorter(
          produkterI(katalog, kategori.id).filter((x) => x.id !== p.id),
          'nyeste',
        )
          .filter((x) => x.lager.status !== 'utsolgt')
          .slice(0, 8)
          .map(tilKort)
      : []
  const relaterte = fraMerket.length >= 4 ? fraMerket : fraKategorien
  const relatertTittel =
    fraMerket.length >= 4 && p.merke
      ? `Mer fra ${p.merke.navn}`
      : `Mer i ${kategori?.navn.toLocaleLowerCase('nb-NO') ?? 'nettbutikken'}`

  return (
    <>
      <div className={`${styles.side} ramme`}>
        <Brodsmuler
          smuler={[
            ...sti.map((k) => ({ navn: k.navn, href: `/kategori/${k.slug}` })),
            { navn: p.visningsnavn },
          ]}
        />
        <div className={styles.oppsett}>
          <div className={styles.galleri}>
            <Galleri bilder={p.bilder} navn={p.visningsnavn} />
          </div>

          <div className={styles.info}>
            <div className={styles.tittelblokk}>
              {p.merke ? (
                <Link href={`/merker/${p.merke.slug}`} className={styles.merke}>
                  {p.merke.navn}
                </Link>
              ) : null}
              <h1 className={styles.navn}>{p.visningsnavn}</h1>
            </div>

            <Kjopsboks data={data} />

            <ul role="list" className={styles.tjenester}>
              <li>
                <Ikon navn="pakke" storrelse={20} />
                <span>
                  <strong>Sendes med Posten</strong> fra butikken i Haugesund, normalt 1–5 virkedager.
                </span>
              </li>
              <li>
                <Ikon navn="butikk" storrelse={20} />
                <span>
                  <strong>Hent gratis i butikken</strong> i Haraldsgata når alle varene er på lager.
                </span>
              </li>
              <li>
                <Ikon navn="retur" storrelse={20} />
                <span>
                  <strong>{RETUR.kort}</strong> på uåpnede varer.
                </span>
              </li>
            </ul>

            <div className={styles.veiledning}>
              <p className={styles.veiledningtittel}>Lurer du på noe?</p>
              <p className="liten">
                Vi hjelper deg gjerne med å velge – ring{' '}
                <a href={BUTIKK.telefon.lenke}>{BUTIKK.telefon.visning}</a> eller{' '}
                <a
                  href={`mailto:${BUTIKK.epost}?subject=${encodeURIComponent(`Spørsmål om ${p.visningsnavn}`)}`}
                >
                  send oss en e-post
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        <div className={styles.detaljer}>
          {p.duftnoter ? (
            <section className={styles.detalj} aria-labelledby="noter-tittel">
              <div className={styles.detaljhode}>
                <p className="kicker">Duftnoter</p>
                <h2 id="noter-tittel" className="t-3">
                  Slik er duften bygget opp
                </h2>
                <p className="mini dempet">Slik produsenten oppgir notene.</p>
              </div>
              <Duftpyramide noter={p.duftnoter} />
            </section>
          ) : null}

          {p.beskrivelse.length > 0 ? (
            <section className={styles.detalj} aria-labelledby="om-tittel">
              <div className={styles.detaljhode}>
                <p className="kicker">Om produktet</p>
                <h2 id="om-tittel" className="t-3">
                  Beskrivelse
                </h2>
              </div>
              <Beskrivelse blokker={p.beskrivelse} />
            </section>
          ) : null}

          <section className={styles.detalj} aria-labelledby="fakta-tittel">
            <div className={styles.detaljhode}>
              <p className="kicker">Detaljer</p>
              <h2 id="fakta-tittel" className="t-3">
                Levering og produktinfo
              </h2>
            </div>
            <dl className={styles.fakta}>
              {p.merke ? (
                <div>
                  <dt>Merke</dt>
                  <dd>
                    <Link href={`/merker/${p.merke.slug}`}>{p.merke.navn}</Link>
                  </dd>
                </div>
              ) : null}
              {kategori ? (
                <div>
                  <dt>Kategori</dt>
                  <dd>
                    <Link href={`/kategori/${kategori.slug}`}>{kategori.navn}</Link>
                  </dd>
                </div>
              ) : null}
              {p.sku ? (
                <div>
                  <dt>Varenummer</dt>
                  <dd className="tall">{p.sku}</dd>
                </div>
              ) : null}
              <div>
                <dt>Levering</dt>
                <dd>
                  {LEVERING.alternativer
                    .map((a) => `${a.navn} (${a.pris.toLocaleLowerCase('nb-NO')})`)
                    .join(' · ')}
                  . <Link href="/kundeservice#levering">Les mer</Link>
                </dd>
              </div>
              <div>
                <dt>Retur</dt>
                <dd>
                  {RETUR.kort} fra du mottar varen. <Link href="/kundeservice#retur">Les mer</Link>
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      {sti[0]?.slug === 'duft' ? (
        <section className={styles.butikk} data-flate="mork" aria-labelledby="butikk-tittel">
          <div className={`${styles.butikkRutenett} ramme`}>
            <figure className={styles.butikkBilde} data-avdekk>
              <Image
                src={BILDER.medarbeidere.bilde}
                alt={BILDER.medarbeidere.alt}
                placeholder="blur"
                sizes="(min-width: 64rem) 28vw, 70vw"
                className={styles.fyll}
              />
            </figure>
            <div className={styles.butikkTekst} data-avdekk>
              <p className="kicker">Personlig veiledning</p>
              <h2 id="butikk-tittel" className="t-2">
                Kjenn på duften i Haraldsgata
              </h2>
              <p>{NISJE.veiledning}</p>
              <div className={styles.butikkLenker}>
                <a href={BUTIKK.telefon.lenke} className="knapp knapp--sekundar">
                  <Ikon navn="telefon" storrelse={18} /> Ring {BUTIKK.telefon.visning}
                </a>
                <Link href="/om-regina#besok" className="tekstlenke">
                  {BUTIKK.adresse.gate}, {BUTIKK.adresse.sted}
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {relaterte.length > 0 ? (
        <section className={`${styles.relaterte} seksjon`} aria-labelledby="relaterte-tittel">
          <div className="ramme">
            <h2 id="relaterte-tittel" className={`t-2 ${styles.relatertTittel}`}>
              {relatertTittel}
            </h2>
            <div data-avdekk>
              <Produktrad etikett={relatertTittel}>
                {relaterte.map((r) => (
                  <li key={r.id}>
                    <Produktkort produkt={r} avdekk={false} sizes="(min-width: 64rem) 22vw, 72vw" />
                  </li>
                ))}
              </Produktrad>
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
