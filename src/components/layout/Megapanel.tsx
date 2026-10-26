import Link from 'next/link'
import { KUN_I_BUTIKKEN } from '@/innhold/butikk'
import type { Menylenke, Menypost } from '@/lib/visning'
import { Ikon } from '../Ikon'
import styles from './Megapanel.module.css'

export function Megapanel({ post }: { post: Menypost }) {
  const flat = post.grupper.every((g) => g.barn.length === 0)
  return (
    <div className={`${styles.panel} ramme`}>
      <div className={styles.hoved}>
        {flat ? (
          <ul className={styles.flat} role="list">
            {post.grupper.map((g) => (
              <li key={g.href}>
                <Link href={g.href} className={styles.storlenke}>
                  <span>{g.navn}</span>
                  <span className={`${styles.antall} tall`}>{g.antall}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.grupper}>
            {post.grupper.map((g) => (
              <div key={g.href} className={styles.gruppe}>
                <Link href={g.href} className={styles.gruppetittel}>
                  {g.navn} <span className={`${styles.antall} tall`}>{g.antall}</span>
                </Link>
                {g.barn.length > 0 ? (
                  <ul role="list" className={styles.barn}>
                    {g.barn.slice(0, 7).map((b) => (
                      <li key={b.href}>
                        <Link href={b.href} className={styles.lenke}>
                          {b.navn}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        )}
        <Link href={post.href} className={`tekstlenke ${styles.alle}`}>
          Alt i {post.etikett.toLocaleLowerCase('nb-NO')} ({post.antall}){' '}
          <Ikon navn="pil" storrelse={16} data-pil />
        </Link>
      </div>
      {post.merker.length > 0 ? (
        <aside className={styles.side} aria-label={`Merker i ${post.etikett.toLocaleLowerCase('nb-NO')}`}>
          <p className="kicker">Merker</p>
          <ul role="list" className={styles.merkeliste}>
            {post.merker.map((m) => (
              <li key={m.href}>
                <Link href={m.href} className={styles.lenke}>
                  {m.navn}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </div>
  )
}

export function Merkepanel({ merker }: { merker: Menylenke[] }) {
  return (
    <div className={`${styles.panel} ramme`}>
      <div className={styles.hoved}>
        <ul role="list" className={styles.merkekolonner}>
          {merker.map((m) => (
            <li key={m.href}>
              <Link href={m.href} className={styles.lenke}>
                {m.navn}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/merker" className={`tekstlenke ${styles.alle}`}>
          Alle merker <Ikon navn="pil" storrelse={16} data-pil />
        </Link>
      </div>
      <aside className={styles.side} aria-label="Merker i butikken">
        <p className="kicker">Bare i butikken</p>
        <p className={styles.forklaring}>
          Noen merker selges bare i butikken i Haraldsgata, etter avtale med leverandørene.
        </p>
        <ul role="list" className={styles.butikkmerker}>
          {KUN_I_BUTIKKEN.slice(0, 8).map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <Link href="/merker#butikken" className={styles.lenke}>
          Se hele listen
        </Link>
      </aside>
    </div>
  )
}
