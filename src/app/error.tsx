'use client'

import Link from 'next/link'
import { BUTIKK } from '@/innhold/butikk'

export default function Feil({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="statusside ramme" role="alert">
      <p className="kicker">Noe gikk galt</p>
      <h1 className="t-1">Vi får ikke hentet produktene akkurat nå</h1>
      <p className="ingress">
        Prøv igjen om et øyeblikk. Haster det, kan du ringe butikken på{' '}
        <a href={BUTIKK.telefon.lenke}>{BUTIKK.telefon.visning}</a>.
      </p>
      <div className="statusside__handlinger">
        <button type="button" className="knapp knapp--primar" onClick={reset}>
          Prøv igjen
        </button>
        <Link href="/" className="tekstlenke">
          Til forsiden
        </Link>
      </div>
    </div>
  )
}
