import type { Metadata } from 'next'
import { Innholdsside } from '@/components/innhold/innholdsside'
import { Kurvside } from '@/components/kurv/kurvside'
import { hentKurv } from '@/lib/kurv'

export const metadata: Metadata = { title: 'Handlekurv', robots: { index: false, follow: false } }

export default async function Handlekurv({ searchParams }: PageProps<'/handlekurv'>) {
  const { feil } = await searchParams
  const start = await hentKurv().catch(() => undefined)
  return (
    <Innholdsside tittel="Handlekurv">
      <Kurvside feil={typeof feil === 'string' ? feil.slice(0, 200) : undefined} start={start} />
    </Innholdsside>
  )
}
