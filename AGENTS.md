<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Arbeidsinstruks – Regina Parfymeri (konsept fra Flyd)

Les `README.md` og `docs/` før større endringer.

## Faste regler

- **Aldri skriv til Reginas WooCommerce.** Lesing skjer bare med GET mot stiene i `TILLATTE_STIER`
  (`src/lib/katalog/woo/hent.ts`); testen i `hent.test.ts` holder grensen. Ingen handlekurv, ordre eller
  betaling mot produksjon under utvikling eller testing.
- **Ingen hemmeligheter i nettleseren eller i git.** Store API-lesing krever ingen nøkkel. Kommer det nøkler
  (f.eks. REST API v3), skal de bare leses på serveren og aldri være `NEXT_PUBLIC_`.
- **Ingen påfunne fakta i flaten:** ingen anmeldelser, stjerner, kundetall, kampanjer, rabatter,
  leveringsløfter, «bestselger»- eller «nyhet»-merker uten grunnlag i data. Butikkfakta står med kilde i
  `src/innhold/butikk.ts` – står det ikke der, vises det ikke.
- **Pris og variant:** beløp er heltall øre. Raskt kjøp bare når valget er entydig (`hurtigkjop`). Et
  variabelt produkt får aldri en variant valgt for seg (unntak: bare én variant). Doble variasjoner løses
  som WooCommerce gjør (første i rekkefølgen) og meldes som avvik.
- **Produktbilder** endres aldri med filter eller blandingsmodus. Hvite pakkebilder står på en flate i
  bildets egen målte farge (`scripts/bildeanalyse.ts`).
- **Farger og skrift** kommer bare fra `src/styles/tokens.css`. Nye par av tekst/bakgrunn skal inn i
  `tokens.test.ts`. Cormorant Garamond (500–600) bare i hero og store redaksjonelle overskrifter;
  Manrope (400–600) til alt funksjonelt. Logoen er Reginas originalfil, uendret.
- **Bevegelse:** bare transform/opacity, tokens for varighet og easing, ingenting ved
  `prefers-reduced-motion`. Innhold skal være synlig uten JavaScript.
- Kodestil: norske navn og kommentarer, Prettier (ingen semikolon, enkle anførselstegn), `import type`,
  ingen `any`.

## Kommandoer

```bash
pnpm verify      # typecheck + lint + test + build – skal være grønn før du rapporterer
pnpm test:e2e    # Playwright mot http://localhost:3000
```
