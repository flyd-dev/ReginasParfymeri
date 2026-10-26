import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import '@/styles/skrift.css'
import '@/styles/tokens.css'
import '@/styles/base.css'
import { Handlekurv } from '@/components/kurv/Handlekurv'
import { KurvProvider } from '@/components/kurv/KurvProvider'
import { Bunntekst } from '@/components/layout/Bunntekst'
import { Header } from '@/components/layout/Header'
import { Toppstripe } from '@/components/layout/Toppstripe'
import { hentKatalog } from '@/lib/katalog/kilde'
import { byggMeny } from '@/lib/visning'

export const metadata: Metadata = {
  metadataBase: new URL('https://reginaparfymeri.no'),
  title: {
    default: 'Regina Parfymeri – nisjeduft, hudpleie og makeup i Haugesund',
    template: '%s – Regina Parfymeri',
  },
  description:
    'Familieparfymeri i Haraldsgata i Haugesund siden 1863. Nisjeduft fra Creed, Initio, Parfums de Marly, Fugazzi og BDK, hudpleie og makeup – med personlig veiledning.',
  // Dette er et konsept: det skal ikke indekseres ved siden av Reginas ekte nettsted.
  robots: { index: false, follow: false },
  openGraph: { locale: 'nb_NO', siteName: 'Regina Parfymeri', type: 'website' },
}

// Med KATALOG_KILDE=live fornyes de forhåndsrendrede sidene hvert femte minutt.
export const revalidate = 300

export const viewport: Viewport = {
  themeColor: '#f2e9dd',
  width: 'device-width',
  initialScale: 1,
}

export default async function RotOppsett({ children }: { children: ReactNode }) {
  const katalog = await hentKatalog()
  const meny = byggMeny(katalog)
  return (
    <html lang="nb">
      <body>
        <a href="#innhold" className="hopp">
          Hopp til innholdet
        </a>
        <KurvProvider>
          <Toppstripe />
          <Header meny={meny} />
          <main id="innhold" tabIndex={-1}>
            {children}
          </main>
          <Bunntekst meny={meny} meta={katalog.meta} />
          <Handlekurv />
        </KurvProvider>
      </body>
    </html>
  )
}
