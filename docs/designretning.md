# Designretning

Fra oppdraget §4: eksklusiv nisjeparfymeri – varm, redaksjonell og personlig, familiebedrift siden 1863. Rolig
luksus, ikke høylytt. Kundens rosa og en dus sandfarget bakgrunn bærer identiteten.

## Farger

Alle verdier står i `src/styles/tokens.css` og er koblet til Tailwind i `src/app/globals.css`
(`bg-sand-50`, `text-regina-plum`, `border-sand-200` osv.). Kontrastene testes i `src/styles/tokens.test.ts`.

| Token                  | Verdi     | Bruk                                                               |
| ---------------------- | --------- | ------------------------------------------------------------------ |
| `--regina-pink`        | `#E9168C` | Kundens rosa: kursiv aksent i store overskrifter, ikoner, dekor    |
| `--regina-pink-strong` | `#C2106F` | Rosa tekst og lenker (på sand-50 og paper), rosa knapper, «Nyhet»  |
| `--regina-plum`        | `#3F132E` | Tekst, primærknapp, toppstripe, nisjeduft-seksjonen                |
| `--sand-50`            | `#F4EDE4` | Hovedbakgrunn                                                      |
| `--sand-100`           | `#EADFD2` | Seksjoner, footer                                                  |
| `--sand-200`           | `#D9CBB8` | Tynne linjer i stedet for skygger                                  |
| `--sand-ink`           | `#7A6555` | Sekundærtekst på sand-50 og paper, kanter på skjemafelt            |
| `--sand-ink-deep`      | `#6E5A4B` | Sekundærtekst på sand-100 (lagt til – sand-ink gir bare 4,2:1 der) |
| `--paper`              | `#FBF8F4` | Flaten bak produktbilder, skuffer, dialoger                        |
| `--status-*`           | –         | På lager / få igjen / utsolgt – bare fra WooCommerce, aldri pynt   |

Rosa er en aksent: kursive ord i overskrifter, «Nyhet», fokusring og hover. Resten er sand og plum.

### Dybde og rytme (27.10.2026)

Sand-50, paper og sand-100 ligger svært nær hverandre i lyshet. Brukt alene gir de en flat side. Derfor:

- **Verdikontrast:** plum er sidens mørke flate og brukes bevisst flere steder – flaten bak hero-bildet som går
  ut i kanten, merkebåndet, nisjeduft, den store kategoriflisen, besøkskortet og footeren. Lyse og mørke flater
  veksler nedover forsiden.
- **Én rosa flate:** Reginas løfte om veiledning står på `--regina-pink-strong` med hvit tekst (5,8:1). Det er
  sidens eneste store rosa flate; ellers er rosa fortsatt en aksent.
- **Dybde uten skygger:** forskjøvne fargeflater bak bilder, elementer som ligger over kanten av en annen flate
  (produktkortet i heroen, fasaden i historien, plumkortet over butikkbildet) og en kort rosa strek foran
  overlinjene.
- **Svak parallakse:** `.parallakse` og `.parallakse-ut` i `globals.css` lar enkelte bildelag gli 1,5–3 rem
  saktere eller raskere enn siden. Bare transform, bare med rullestyrte animasjoner og aldri ved redusert
  bevegelse. Brukes ikke på tekst.

## Typografi

- **Playfair Display 500** (normal og kursiv) til overskrifter – kursiv aksent i rosa («Nisjedufter med
  _historie_»).
- **Poppins 400–600** til brødtekst, navigasjon, priser og knapper. Brødtekst 16–17 px.
- Begge lastes med `next/font/google` og selvhostes, så nettleseren aldri kontakter Google.

## Form og flate

- Hjørner 0–2 px (`--radius`), tynne `sand-200`-linjer, ingen skygger (fjernet fra shadcn-komponentene).
- Mye luft: seksjoner 80–112 px, innhold maks 1536 px bredt.
- Produktbilder i kvadratiske flater på `--paper` med `mix-blend-mode: multiply`, `object-contain` og luft rundt
  pakken. Hvite pakkebilder smelter inn i papirflaten; ingen andre filtre.
- Reginas egne butikkbilder (fasaden, disken, behandlingsrommet) i redaksjonelle seksjoner – ingen stockbilder.

## Bevegelse (R-30)

Bevegelse er en del av uttrykket, men aldri på bekostning av lesbarhet, ytelse eller tilgjengelighet.

- **Samspill** (peker, trykk, åpne/lukke): 150–250 ms (`--dur-fast/base/slow`).
- **Inngang** når innhold kommer til syne: 700 ms (`--dur-inn`) med `--ease-ut`, søsken forskjøvet med
  `--stagger` (70 ms). Komponentene `Inn` og `AvdekkTekst` i `src/components/bevegelse/`; CSS-en står under
  «Inngang» i `globals.css`. Overskrifter avsløres ord for ord bak en maske.
- **Store flater** (bildeteppe, sideoverganger): 1100 ms (`--dur-lang`).
- Bare transform og opacity (unntak: tall som teller opp). Svak parallakse (`.parallakse`) og rullestyrt
  avdekking (`.avdekk`) brukes bare på bilder.
- Alt står stille ved `prefers-reduced-motion`; uten JavaScript står alt der fra start. Merkebåndet og annet som
  beveger seg av seg selv har pauseknapp (WCAG 2.2.2). Ingen automatisk karusell.
- **Mobil først (R-31):** bevegelsen skal virke ved trykk og rulling på telefon, ikke bare ved peker.

## Komponenter

shadcn/ui (Radix) i `src/components/ui`, restylet til tokens. 21st.dev-valgene og status står i
`docs/components.md`. lucide-react er eneste ikonsett.
