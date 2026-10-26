import Link from 'next/link'
import styles from './Brodsmuler.module.css'

export interface Smule {
  navn: string
  href?: string
}

export function Brodsmuler({ smuler }: { smuler: Smule[] }) {
  return (
    <nav aria-label="Brødsmuler" className={styles.smuler}>
      <ol role="list">
        <li>
          <Link href="/">Forside</Link>
        </li>
        {smuler.map((s, i) => (
          <li key={`${s.navn}-${i}`}>
            {s.href && i < smuler.length - 1 ? (
              <Link href={s.href}>{s.navn}</Link>
            ) : (
              <span aria-current={i === smuler.length - 1 ? 'page' : undefined}>{s.navn}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
