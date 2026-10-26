'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BUTIKK } from '@/innhold/butikk'
import type { Menydata } from '@/lib/visning'
import { Ikon } from '../Ikon'
import { Logo } from '../Logo'
import { Skuff } from '../Skuff'
import styles from './Mobilmeny.module.css'

export function Mobilmeny({ apen, onLukk, meny }: { apen: boolean; onLukk: () => void; meny: Menydata }) {
  const [niva, setNiva] = useState<string | null>(null)
  const post = meny.poster.find((p) => p.id === niva)

  const lukk = () => {
    onLukk()
    window.setTimeout(() => setNiva(null), 400)
  }

  return (
    <Skuff apen={apen} onLukk={lukk} side="venstre" etikett="Meny">
      <div className={styles.hode}>
        <Link href="/" onClick={lukk} aria-label="Regina Parfymeri – til forsiden">
          <Logo />
        </Link>
        <button type="button" className="ikonknapp" onClick={lukk} aria-label="Lukk menyen">
          <Ikon navn="lukk" />
        </button>
      </div>

      <nav className={styles.kropp} aria-label="Meny">
        {niva === null ? (
          <div className={styles.niva} key="topp">
            <ul role="list" className={styles.hovedliste}>
              {meny.poster.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={styles.hovedpunkt}
                    onClick={() => setNiva(p.id)}
                    aria-expanded={false}
                  >
                    {p.etikett}
                    <Ikon navn="hoyre" storrelse={18} />
                  </button>
                </li>
              ))}
              <li>
                <button type="button" className={styles.hovedpunkt} onClick={() => setNiva('merker')}>
                  Merker
                  <Ikon navn="hoyre" storrelse={18} />
                </button>
              </li>
              {meny.tilbud > 0 ? (
                <li>
                  <Link href="/tilbud" className={styles.hovedpunkt} onClick={lukk}>
                    Tilbud
                  </Link>
                </li>
              ) : null}
            </ul>
            <ul role="list" className={styles.sekundar}>
              <li>
                <Link href="/om-regina" onClick={lukk}>
                  Om Regina
                </Link>
              </li>
              <li>
                <Link href="/kundeservice" onClick={lukk}>
                  Levering, retur og kontakt
                </Link>
              </li>
            </ul>
          </div>
        ) : (
          <div className={styles.niva} key={niva}>
            <button type="button" className={styles.tilbake} onClick={() => setNiva(null)}>
              <Ikon navn="venstre" storrelse={18} /> Tilbake
            </button>
            <p className={`${styles.nivatittel} t-3`}>{post?.etikett ?? 'Merker'}</p>
            {post ? (
              <>
                <Link href={post.href} className={styles.alle} onClick={lukk}>
                  Alt i {post.etikett.toLocaleLowerCase('nb-NO')}{' '}
                  <span className="tall dempet">({post.antall})</span>
                </Link>
                <ul role="list" className={styles.grupper}>
                  {post.grupper.map((g) => (
                    <li key={g.href}>
                      <Link href={g.href} className={styles.gruppe} onClick={lukk}>
                        {g.navn} <span className="tall dempet mini">{g.antall}</span>
                      </Link>
                      {g.barn.length > 0 ? (
                        <ul role="list" className={styles.barn}>
                          {g.barn.map((b) => (
                            <li key={b.href}>
                              <Link href={b.href} onClick={lukk}>
                                {b.navn}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <Link href="/merker" className={styles.alle} onClick={lukk}>
                  Alle merker A–Å
                </Link>
                <ul role="list" className={styles.merker}>
                  {meny.merker.map((m) => (
                    <li key={m.href}>
                      <Link href={m.href} onClick={lukk}>
                        {m.navn}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </nav>

      <div className={styles.fot}>
        <p className="kicker">Butikken</p>
        <p>
          {BUTIKK.adresse.gate}, {BUTIKK.adresse.sted}
        </p>
        <a href={BUTIKK.telefon.lenke} className="tekstlenke">
          <Ikon navn="telefon" storrelse={16} /> {BUTIKK.telefon.visning}
        </a>
      </div>
    </Skuff>
  )
}
