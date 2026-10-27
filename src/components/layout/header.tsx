import { hentKatalog } from '@/lib/woocommerce'
import { lagMeny, mestSolgtIMenyen } from '@/lib/meny'
import { HeaderKlient } from './header-klient'
import { kasseUrl } from './lenker'
import { Logo } from './logo'

export async function Header() {
  const katalog = await hentKatalog()
  return (
    <HeaderKlient
      meny={lagMeny(katalog)}
      utvalg={mestSolgtIMenyen(katalog)}
      logo={<Logo className="block h-full" prioritet />}
      kontoUrl={`${kasseUrl()}/min-konto/`}
    />
  )
}
