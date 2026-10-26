// Reginas egne bilder. Alle er hentet fra reginaparfymeri.no (wp-content/uploads), lagret på nytt
// uten metadata, med samme utsnitt og farger. Fotograf er ikke oppgitt på siden – bruksretten må
// bekreftes av Regina før publisering. Se docs/bildekilder.md.

import type { StaticImageData } from 'next/image'
import behandlingsrom from './bilder/butikken-behandlingsrom.jpg'
import disken from './bilder/butikken-disken.jpg'
import fasade from './bilder/butikken-fasade.jpg'
import medarbeidere from './bilder/butikken-medarbeidere.jpg'
import salong from './bilder/butikken-salong.jpg'
import tomFord from './bilder/butikken-tom-ford.jpg'

export interface Fotografi {
  bilde: StaticImageData
  alt: string
  kilde: string
}

const KILDE = 'reginaparfymeri.no/wp-content/uploads/2020/11'

export const BILDER = {
  fasade: {
    bilde: fasade,
    alt: 'Butikkfasaden i Haraldsgata med rosa løper ved inngangen og rosa krukker med Regina-logoen.',
    kilde: `${KILDE}/bilde_regina_8.jpg`,
  },
  medarbeidere: {
    bilde: medarbeidere,
    alt: 'To av Reginas medarbeidere ler sammen bak disken under de røde taklampene.',
    kilde: `${KILDE}/bilde_regina_3.jpg`,
  },
  salong: {
    bilde: salong,
    alt: 'Hvilerom med to røde lenestoler, palmer og en rosa vegg.',
    kilde: `${KILDE}/bilde_regina_13.jpg`,
  },
  behandlingsrom: {
    bilde: behandlingsrom,
    alt: 'Lyst rom med rosa lenestol og hyller med hudpleie.',
    kilde: `${KILDE}/bilde_regina_2.jpg`,
  },
  tomFord: {
    bilde: tomFord,
    alt: 'Tom Ford-dufter på en hylle i mørkt tre i butikken.',
    kilde: `${KILDE}/bilde_regina_9.jpg`,
  },
  disken: {
    bilde: disken,
    alt: 'Medarbeider ved disken med røde taklamper og hyller med neglelakk.',
    kilde: `${KILDE}/bilde_regina_5.jpg`,
  },
} satisfies Record<string, Fotografi>
