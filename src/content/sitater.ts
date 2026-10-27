// Reginas egne ord – ordrett fra Reginas egne sider, aldri omskrevet og aldri fra kunder. Står det ikke
// ordrett i kilden, skal det ikke stå i anførsel. sitater.test.ts sjekker teksten mot data/pages.json.

import { KILDER, NISJE } from './butikk'

export interface Sitat {
  /** Kort etikett i sitatpanelet. Er en del av flaten, ikke av sitatet. */
  tema: string
  /** Ordrett, hele setninger. */
  tekst: string
  /** Kildelinjen under sitatet. */
  kilde: string
  /** Hvor teksten kan kontrolleres. */
  kontroll: string
}

export const SITATER: Sitat[] = [
  {
    tema: 'Veiledning',
    tekst: NISJE.veiledning,
    kilde: 'reginaparfymeri.no',
    kontroll: KILDER.hjemmeside,
  },
  {
    tema: 'Firkløveren',
    tekst:
      'Sammen med våre to andre dyktige medarbeidere utgjør vi en engasjert firkløver som brenner for fagkunnskap, personlig service og ekte skjønnhetsglede.',
    kilde: '«Om oss» i nettbutikken',
    kontroll: KILDER.omOss,
  },
  {
    tema: 'Autorisert',
    tekst:
      'Vi er autorisert forhandler av alle merkevarene vi fører – det betyr at du alltid kan stole på at produktene du kjøper hos oss er ekte og av høyeste kvalitet.',
    kilde: '«Om oss» i nettbutikken',
    kontroll: KILDER.omOss,
  },
]
