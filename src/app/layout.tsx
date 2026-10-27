import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Poppins } from 'next/font/google'
import { KurvProvider } from '@/components/kurv/kurv-provider'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { Kampanjebanner } from '@/components/layout/kampanjebanner'
import { Samtykke } from '@/components/layout/samtykke'
import { Toppstripe } from '@/components/layout/toppstripe'
import { NETTSTEDNAVN, nettstedUrl, skalIndekseres } from '@/lib/seo/nettsted'
import { hentKampanjer } from '@/lib/woocommerce/innhold'
import './globals.css'

// Dagens fonter (oppdraget §4): Playfair Display til overskrifter, Poppins til brødtekst og UI.
const playfair = Playfair_Display({
  subsets: ['latin'],
  // Overskriftene står i 500 (globals.css); én vekt gir mindre skriftfiler enn den variable fonten.
  weight: ['500'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(nettstedUrl()),
  title: {
    default: `${NETTSTEDNAVN} – nisjeparfymer, hudpleie og makeup i Haugesund siden 1863`,
    template: `%s | ${NETTSTEDNAVN}`,
  },
  description:
    'Et av Norges eldste frittstående parfymerier. Eksklusive nisjedufter, hudpleie og makeup – i butikken i Haraldsgata 138 i Haugesund og på nett.',
  robots: skalIndekseres() ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { siteName: NETTSTEDNAVN, locale: 'nb_NO', type: 'website' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#f4ede4',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { kampanjer, tidspunkt } = await hentKampanjer()
  return (
    <html lang="nb" className={`${playfair.variable} ${poppins.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#innhold"
          className="sr-only z-50 bg-regina-plum px-4 py-3 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Hopp til innholdet
        </a>
        <KurvProvider>
          <Kampanjebanner kampanjer={kampanjer} bygget={tidspunkt} />
          <Toppstripe />
          <Header />
          <main id="innhold" className="flex-1">
            {children}
          </main>
          <Footer />
          <Samtykke />
        </KurvProvider>
      </body>
    </html>
  )
}
