import type { Metadata } from 'next'
import { Kasse } from '@/components/kurv/Kasse'
import { kassemodus } from '@/lib/kasse/lenke'

export const metadata: Metadata = { title: 'Kassen' }

export default function Kasseside() {
  return (
    <Kasse modus={kassemodus()} butikk={process.env.WOO_URL ?? 'https://nettbutikk.reginaparfymeri.no'} />
  )
}
