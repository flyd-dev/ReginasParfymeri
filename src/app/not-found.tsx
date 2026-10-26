import Link from 'next/link'
import { Ikon } from '@/components/Ikon'

export default function IkkeFunnet() {
  return (
    <div className="statusside ramme">
      <p className="kicker">Fant ikke siden</p>
      <h1 className="t-1">Denne finnes ikke lenger</h1>
      <p className="ingress">
        Varen kan være utgått, eller lenken er feil. Søk etter det du leter etter, eller gå videre fra
        forsiden.
      </p>
      <div className="statusside__handlinger">
        <Link href="/" className="knapp knapp--primar">
          Til forsiden <Ikon navn="pil" storrelse={18} data-pil />
        </Link>
        <Link href="/merker" className="tekstlenke">
          Alle merker
        </Link>
      </div>
    </div>
  )
}
