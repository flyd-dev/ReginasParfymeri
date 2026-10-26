import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Fasetter } from '@/lib/katalog/sporring'
import { antallAktive, PRISINTERVALLER, TOMME_FILTRE } from '@/lib/katalog/sporring'
import { listeUrl, veksle, type Listetilstand } from '@/lib/katalog/listeurl'
import type { Kortdata } from '@/lib/visning'
import { Brodsmuler, type Smule } from '../Brodsmuler'
import { Ikon } from '../Ikon'
import { Produktkort } from '../produkt/Produktkort'
import { Filterpanel, Verktoylinje } from './Filtre'
import { ListeNavigasjon, Listeflate } from './ListeNavigasjon'
import styles from './Liste.module.css'

export interface Listeoppsett {
  basis: string
  tittel: ReactNode
  kicker?: string
  ingress?: ReactNode
  /** Bilde ved siden av tittelen (dekorativt), f.eks. det samme som kategorikortet på forsiden. */
  visuell?: ReactNode
  smuler: Smule[]
  snarveier?: { navn: string; href: string; antall: number; aktiv?: boolean }[]
  tilstand: Listetilstand
  fasetter: Fasetter
  kategoritittel?: string
  produkter: Kortdata[]
  totalt: number
  flere: boolean
  tom?: ReactNode
}

function aktiveBrikker(o: Listeoppsett): { navn: string; href: string }[] {
  const f = o.tilstand.filtre
  const navnFor = (liste: { id: string; navn: string }[], id: string) =>
    liste.find((x) => x.id === id)?.navn ?? id
  const ut: { navn: string; href: string }[] = []
  for (const k of f.kategori)
    ut.push({
      navn: navnFor(o.fasetter.kategori, k),
      href: listeUrl(o.basis, o.tilstand, { filtre: { ...f, kategori: veksle(f.kategori, k) } }),
    })
  for (const m of f.merke)
    ut.push({
      navn: navnFor(o.fasetter.merke, m),
      href: listeUrl(o.basis, o.tilstand, { filtre: { ...f, merke: veksle(f.merke, m) } }),
    })
  for (const p of f.pris)
    ut.push({
      navn: PRISINTERVALLER.find((i) => i.id === p)?.navn ?? p,
      href: listeUrl(o.basis, o.tilstand, { filtre: { ...f, pris: veksle(f.pris, p) } }),
    })
  if (f.lager)
    ut.push({ navn: 'På lager', href: listeUrl(o.basis, o.tilstand, { filtre: { ...f, lager: false } }) })
  if (f.tilbud)
    ut.push({ navn: 'På tilbud', href: listeUrl(o.basis, o.tilstand, { filtre: { ...f, tilbud: false } }) })
  if (f.note)
    ut.push({
      navn: `Duftnote: ${f.note}`,
      href: listeUrl(o.basis, o.tilstand, { filtre: { ...f, note: null } }),
    })
  return ut
}

export function Produktliste(o: Listeoppsett) {
  const brikker = aktiveBrikker(o)
  const aktive = antallAktive(o.tilstand.filtre)
  const nullstill = listeUrl(o.basis, { ...o.tilstand, filtre: TOMME_FILTRE })
  const felles = {
    basis: o.basis,
    tilstand: o.tilstand,
    fasetter: o.fasetter,
    kategoritittel: o.kategoritittel ?? 'Kategori',
  }

  return (
    <ListeNavigasjon>
      <div className={`${styles.side} ramme`}>
        <header className={styles.hode}>
          <Brodsmuler smuler={o.smuler} />
          <div className={styles.hodeRad} data-visuell={o.visuell ? '' : undefined}>
            <div className={styles.hodeTekst}>
              <div className={styles.tittelrad}>
                <div className={styles.tittelblokk}>
                  {o.kicker ? <p className="kicker">{o.kicker}</p> : null}
                  <h1 className="t-1">{o.tittel}</h1>
                </div>
                <p className={`${styles.totalt} tall`} aria-live="polite">
                  {o.totalt} {o.totalt === 1 ? 'produkt' : 'produkter'}
                </p>
              </div>
              {o.ingress ? <div className={`ingress ${styles.ingress}`}>{o.ingress}</div> : null}
            </div>
            {o.visuell ? (
              <div className={styles.visuell} aria-hidden="true">
                {o.visuell}
              </div>
            ) : null}
          </div>
          {o.snarveier && o.snarveier.length > 1 ? (
            <nav aria-label="Underkategorier" className={styles.snarveier}>
              <ul role="list">
                {o.snarveier.map((s) => (
                  <li key={s.href}>
                    <Link
                      href={s.href}
                      className={styles.snarvei}
                      aria-current={s.aktiv ? 'page' : undefined}
                    >
                      {s.navn} <span className="tall">{s.antall}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </header>

        <div className={styles.oppsett}>
          <Filterpanel {...felles} />
          <div className={styles.hovedkolonne}>
            <Verktoylinje
              {...felles}
              antall={o.totalt}
              antallAktive={aktive}
              harSok={o.tilstand.sok !== undefined}
            />
            {brikker.length > 0 ? (
              <div className={styles.aktive}>
                <ul role="list" aria-label="Aktive filtre">
                  {brikker.map((b) => (
                    <li key={b.href}>
                      <Link href={b.href} scroll={false} className={styles.brikke}>
                        {b.navn}
                        <Ikon navn="lukk" storrelse={14} />
                        <span className="skjult"> – fjern filteret</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={nullstill} scroll={false} className={styles.nullstill}>
                  Nullstill alle
                </Link>
              </div>
            ) : null}

            <Listeflate className={styles.flate}>
              {o.produkter.length === 0 ? (
                <div className={styles.tom}>
                  {o.tom ?? (
                    <>
                      <p className="t-3">Ingen produkter passer filtrene</p>
                      <p className="dempet">Prøv å fjerne et filter, eller se hele utvalget.</p>
                    </>
                  )}
                  {aktive > 0 ? (
                    <Link href={nullstill} scroll={false} className="knapp knapp--sekundar">
                      Nullstill filtrene
                    </Link>
                  ) : null}
                </div>
              ) : (
                <ul role="list" className={styles.rutenett}>
                  {o.produkter.map((p, i) => (
                    <li key={p.id}>
                      <Produktkort produkt={p} prioritet={i < 4} forsinkelse={i % 4} />
                    </li>
                  ))}
                </ul>
              )}
            </Listeflate>

            {o.produkter.length > 0 ? (
              <div className={styles.mer}>
                <p className="dempet liten tall">
                  Viser {o.produkter.length} av {o.totalt}
                </p>
                <div className={styles.fremdrift} aria-hidden="true">
                  <span
                    style={{
                      inlineSize: `${Math.round((o.produkter.length / Math.max(o.totalt, 1)) * 100)}%`,
                    }}
                  />
                </div>
                {o.flere ? (
                  <Link
                    href={listeUrl(o.basis, o.tilstand, { side: o.tilstand.side + 1 })}
                    scroll={false}
                    className="knapp knapp--sekundar"
                  >
                    Vis flere produkter
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </ListeNavigasjon>
  )
}
