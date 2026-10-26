'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { kroner } from '@/lib/format'
import type { Sokeforslag } from '@/lib/sokeforslag'
import { Ikon } from '../Ikon'
import { Produktbilde } from '../produkt/Produktbilde'
import { Skuff } from '../Skuff'
import styles from './Sokedialog.module.css'

const FORSLAG = [
  { navn: 'Nisjeduft', href: '/kategori/nisjeduft' },
  { navn: 'Creed', href: '/merker/creed' },
  { navn: 'Parfums de Marly', href: '/merker/parfums-de-marly' },
  { navn: 'Susanne Kaufmann', href: '/merker/susanne-kaufmann' },
  { navn: 'Hudpleie', href: '/kategori/hudpleie' },
  { navn: 'Gavesett', href: '/kategori/gavesett' },
]

type Svar = { for: string; type: 'svar'; data: Sokeforslag } | { for: string; type: 'feil' }
type Tilstand = { type: 'tom' } | { type: 'laster' } | Svar

export function Sokedialog({ apen, onLukk }: { apen: boolean; onLukk: () => void }) {
  const [tekst, setTekst] = useState('')
  const [svar, setSvar] = useState<Svar | null>(null)
  const felt = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const id = useId()
  const q = tekst.trim()

  useEffect(() => {
    if (apen) requestAnimationFrame(() => felt.current?.focus())
  }, [apen])

  useEffect(() => {
    if (q.length < 2) return
    const kontroll = new AbortController()
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/sok?q=${encodeURIComponent(q)}`, { signal: kontroll.signal })
        if (!res.ok) throw new Error(String(res.status))
        setSvar({ for: q, type: 'svar', data: (await res.json()) as Sokeforslag })
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setSvar({ for: q, type: 'feil' })
      }
    }, 160)
    return () => {
      kontroll.abort()
      window.clearTimeout(t)
    }
  }, [q])

  // Tilstanden avledes: et svar for et eldre søk vises ikke som gjeldende.
  const tilstand: Tilstand =
    q.length < 2 ? { type: 'tom' } : svar && svar.for === q ? svar : { type: 'laster' }
  const data = tilstand.type === 'svar' ? tilstand.data : null

  return (
    <Skuff apen={apen} onLukk={onLukk} side="topp" etikett="Søk">
      <div className={`${styles.ramme} ramme`}>
        <form
          role="search"
          className={styles.skjema}
          action="/sok"
          onSubmit={(e) => {
            e.preventDefault()
            if (!q) return
            router.push(`/sok?q=${encodeURIComponent(q)}`)
            onLukk()
          }}
        >
          <label htmlFor={`${id}-felt`} className="skjult">
            Søk etter merke, produkt eller duftnote
          </label>
          <Ikon navn="sok" storrelse={24} className={styles.lupe} />
          <input
            ref={felt}
            id={`${id}-felt`}
            name="q"
            type="search"
            className={styles.felt}
            placeholder="Søk etter merke, produkt eller duftnote"
            autoComplete="off"
            enterKeyHint="search"
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            aria-describedby={`${id}-status`}
          />
          <button type="button" className="ikonknapp" onClick={onLukk} aria-label="Lukk søket">
            <Ikon navn="lukk" />
          </button>
        </form>

        <p id={`${id}-status`} className="skjult" aria-live="polite">
          {tilstand.type === 'svar'
            ? `${tilstand.data.totalt} treff på ${q}`
            : tilstand.type === 'feil'
              ? 'Søket er ikke tilgjengelig akkurat nå'
              : ''}
        </p>

        <div className={styles.resultat} aria-busy={tilstand.type === 'laster'}>
          {q.length < 2 ? (
            <div className={styles.forslag}>
              <p className="kicker">Populære innganger</p>
              <ul role="list" className={styles.brikker}>
                {FORSLAG.map((f) => (
                  <li key={f.href}>
                    <Link href={f.href} className={styles.brikke} onClick={onLukk}>
                      {f.navn}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : tilstand.type === 'feil' ? (
            <p className={styles.melding}>Søket er ikke tilgjengelig akkurat nå. Prøv igjen om litt.</p>
          ) : data && data.totalt === 0 ? (
            <div className={styles.melding}>
              <p className="t-3">Ingen treff på «{q}»</p>
              <p className="dempet">
                Sjekk stavemåten, eller prøv et merke eller en kategori. Finner du det ikke, kan du ringe
                butikken – mye av sortimentet finnes bare i Haraldsgata.
              </p>
            </div>
          ) : data ? (
            <div className={styles.svar}>
              <section aria-label="Produkter">
                <ul role="list" className={styles.produkter}>
                  {data.produkter.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/produkt/${p.slug}`} className={styles.produkt} onClick={onLukk}>
                        <Produktbilde bilde={p.bilde} sizes="64px" storrelse="mini" className={styles.mini} />
                        <span className={styles.produkttekst}>
                          {p.merke ? <span className={styles.merke}>{p.merke}</span> : null}
                          <span className={styles.navn}>{p.navn}</span>
                          <span className="tall mini">
                            {p.fra ? 'Fra ' : ''}
                            {kroner(p.pris)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={`/sok?q=${encodeURIComponent(q)}`} className="tekstlenke" onClick={onLukk}>
                  Se alle {data.totalt} treff <Ikon navn="pil" storrelse={16} data-pil />
                </Link>
              </section>
              {data.kategorier.length + data.merker.length + data.noter.length > 0 ? (
                <aside className={styles.side} aria-label="Kategorier, merker og duftnoter">
                  {data.noter.length > 0 ? (
                    <>
                      <p className="kicker">Duftnoter</p>
                      <ul role="list">
                        {data.noter.map((n) => (
                          <li key={n.href}>
                            <Link href={n.href} onClick={onLukk}>
                              Dufter med {n.navn.toLocaleLowerCase('nb-NO')}{' '}
                              <span className="dempet tall mini">{n.antall}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {data.merker.length > 0 ? (
                    <>
                      <p className="kicker">Merker</p>
                      <ul role="list">
                        {data.merker.map((m) => (
                          <li key={m.href}>
                            <Link href={m.href} onClick={onLukk}>
                              {m.navn} <span className="dempet tall mini">{m.antall}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {data.kategorier.length > 0 ? (
                    <>
                      <p className="kicker">Kategorier</p>
                      <ul role="list">
                        {data.kategorier.map((k) => (
                          <li key={k.href}>
                            <Link href={k.href} onClick={onLukk}>
                              {k.navn} <span className="dempet tall mini">{k.antall}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </aside>
              ) : null}
            </div>
          ) : (
            <div className={styles.laster}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="skjelett" style={{ blockSize: 64 }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Skuff>
  )
}
