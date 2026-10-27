import { hentKatalog } from '@/lib/woocommerce'
import { lagMeny, menyutvalg } from '@/lib/meny'
import { HeaderKlient } from './header-klient'
import { kasseUrl } from './lenker'
import { Logo } from './logo'

export async function Header() {
  const katalog = await hentKatalog()
  return (
    <HeaderKlient
      meny={lagMeny(katalog)}
      utvalg={menyutvalg(katalog)}
      logo={<Logo className="block h-full" prioritet />}
      kontoUrl={`${kasseUrl()}/min-konto/`}
    />
  )
}
