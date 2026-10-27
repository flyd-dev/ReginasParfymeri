<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Arbeidsinstruks – Regina Parfymeri (Flyd)

Oppdraget er beskrevet i `docs/oppdrag.md`. Les `README.md`, `docs/architecture.md` og `docs/components.md` før
større endringer.

## Faste regler

- **Aldri skriv til Reginas produksjons-WooCommerce.** Katalogen leses bare med GET mot stiene i
  `TILLATTE_LESESTIER` (`src/lib/woocommerce/store-api.ts`, test i `store-api.test.ts`). Handlekurv mot Store API
  og importskriptet (`scripts/import_to_woocommerce.ts`) nekter produksjonsverten. Ingen ordre eller betaling mot
  produksjon under utvikling eller testing. Spør Marius før DNS-endringer, plugins i produksjon, skriving til
  produksjon og e-post/SMS til kunder.
- **Ingen hemmeligheter i nettleseren eller i git.** Nøkler (WooCommerce REST, revalidate, Vipps) ligger i
  `.env.local` og Vercel env, leses bare på serveren og er aldri `NEXT_PUBLIC_`.
- **Ingen påfunne fakta i flaten:** ingen anmeldelser, stjerner, kundetall, kampanjer, rabatter,
  leveringsløfter eller sitater uten grunnlag. Butikkfakta står med kilde i `src/content/butikk.ts`. «Nyhet» kommer
  bare fra WooCommerce-publiseringsdato, «Bestselgere» bare fra WooCommerces popularitet (total_sales). Tekst som
  mangler vises som at den mangler. Kampanjer har start- og sluttdato og forsvinner av seg selv.
- **Pris og variant:** beløp er heltall øre internt og vises som «kr 949» / «fra kr 2 645» (`src/lib/format.ts`).
  Raskt kjøp bare når valget er entydig (`hurtigkjop`). Et variabelt produkt får aldri en variant valgt for seg
  (unntak: bare én variant). Doble variasjoner løses som WooCommerce gjør (første) og meldes i
  `docs/data-issues.md`.
- **Produktbilder** står i kvadratiske flater på `--paper` med `mix-blend-mode: multiply` (oppdraget §4) – ingen
  andre filtre. `next/image` med riktige `sizes`.
- **Farger og skrift** kommer bare fra `src/styles/tokens.css` (koblet til Tailwind i `src/app/globals.css`). Ingen
  hardkodede farger i komponenter – heller ikke i komponenter fra 21st.dev etter installasjon. Nye par av
  tekst/bakgrunn skal inn i `tokens.test.ts`. Ren rosa `#E9168C` bare til stor tekst, ikoner og dekor;
  `#C2106F` til rosa tekst, lenker og knapper. Playfair Display til overskrifter, Poppins til brødtekst og UI
  (minst 16px). Logoen er Reginas originalfil, uendret.
- **Komponenter:** shadcn/ui (Radix) i `src/components/ui`, 21st.dev-komponenter installeres med kommandoen fra
  komponentsiden (`npx shadcn@latest add "https://21st.dev/r/…"`) og logges i `docs/components.md`. lucide-react er
  eneste ikonsett. Tynne linjer i stedet for skygger, hjørner 0–2px.
- **Bevegelse:** diskret fade/slide (150–250 ms, tokens `--dur-*`), bare transform/opacity, ingenting ved
  `prefers-reduced-motion`. Innhold skal være synlig uten JavaScript.
- **Språk:** nb-NO overalt, også i komponenttekster («Lukk», ikke «Close»).
- Kodestil: norske navn og kommentarer, Prettier (ingen semikolon, enkle anførselstegn), `import type`, ingen
  `any`. Komponenter i `src/components/`, datalag i `src/lib/woocommerce/`.

## Kommandoer

```bash
pnpm verify          # typecheck + lint + test + build – skal være grønn før du rapporterer
pnpm test:e2e        # Playwright mot http://localhost:3000
pnpm katalog:hent    # nytt utdrag fra Store API (bare GET) + bygg data/
pnpm import:staging  # tørrkjøring av import til staging-WooCommerce (--apply for å skrive)
```
