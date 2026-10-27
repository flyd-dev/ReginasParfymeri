"""Lager docs/redirects.csv og docs/data-issues.md fra data/ (kjøres etter build_catalog.py).

Run from the project root:  python3 scripts/lag_rapporter.py

- redirects.csv: hver adresse i dagens butikk (produkter, kategorier, merker, sider) og hvor den havner i den nye
  nettbutikken. De fleste er like (samme sti); resten får 301 (next.config.ts / src/lib/seo/omdirigeringer.ts).
- data-issues.md: liste til kunden over datahull og avvik i dagens WooCommerce, med tall fra dataene.
"""
import csv
import json
import sys
from collections import Counter
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
DATA = ROOT / "data"
DOCS = ROOT / "docs"
STORE = "https://nettbutikk.reginaparfymeri.no"

products = json.loads((DATA / "products.json").read_text())
categories = json.loads((DATA / "categories.json").read_text())
legacy = json.loads((DATA / "legacy_brands.json").read_text())
pages = json.loads((DATA / "pages.json").read_text())
meta = json.loads((DATA / "meta.json").read_text())

# Merker uten produkter på nett som har egen «kun i butikken»-side (src/content/butikk.ts)
STORE_ONLY_PAGES = {"sisley", "hermes-paris", "boucheron", "dolce-gabbana", "paco-rabanne", "versace"}
# Sider i dagens butikk og hvor de havner
PAGE_MAP = {
    "/": "/",
    "/om-oss/": "/om-oss/",
    "/frakt-levering/": "/frakt-levering/",
    "/angrerett-og-retur/": "/angrerett-og-retur/",
    "/betingelser/": "/betingelser/",
    "/tilbud/": "/tilbud/",
    "/nyheter/": "/nyheter/",
    "/butikk/": "/butikk/",
    "/handlekurv/": "/handlekurv/",
    "/kassen/": "/handlekurv/",
    "/min-konto/": "(WooCommerce) /min-konto/",
    "/testside/": "/",
}

rows = []
for p in sorted(products, key=lambda x: x["slug"]):
    old = urlparse(p["source_url"]).path
    new = f"/produkt/{p['slug']}/"
    rows.append((STORE + old, new, "samme adresse" if old == new else "301", "produkt"))


def walk(nodes):
    for n in nodes:
        yield n
        yield from walk(n["children"])


for c in sorted(walk(categories), key=lambda x: x["path"]):
    path = f"/produktkategori/{c['path']}/"
    rows.append((STORE + path, path, "samme adresse", "kategori"))

for b in legacy:
    old = f"/brand/{b['slug']}/"
    if b["new_slug"] == b["slug"] or b["slug"] in STORE_ONLY_PAGES:
        new, kind = old, "samme adresse"
    else:
        new, kind = (f"/brand/{b['new_slug']}/" if b["new_slug"] else "/merker/"), "301"
    rows.append((STORE + old, new, kind, "merke"))

for old, new in PAGE_MAP.items():
    kind = "samme adresse" if old == new else ("302 til WooCommerce" if new.startswith("(") else "301")
    rows.append((STORE + old, new, kind, "side"))

rows.append((STORE + "/produktkategori/<sti>/page/<n>/", "/produktkategori/<sti>/?side=<n>", "301", "sidetall"))
rows.append((STORE + "/?s=<søk>&post_type=product", "/sok/?q=<søk>", "301", "søk"))

with open(DOCS / "redirects.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["gammel_url", "ny_sti", "status", "type"])
    w.writerows(rows)

# ---------- data-issues.md ----------

def name(p):
    return p["name"].strip()


no_desc = sorted((p for p in products if not p["description"]), key=lambda p: (p["brand"] or "", name(p)))
sold_out = sorted((p for p in products if not p["in_stock"]), key=lambda p: (p["brand"] or "", name(p)))
no_brand = [p for p in products if not p["brand"]]
on_sale = [p for p in products if p["on_sale"]]
dups = [(p, v) for p in products for v in p["variations"] if v.get("duplicate_of")]
mismatch = [
    p
    for p in products
    if p["type"] == "variable"
    and p["in_stock"] != any(v.get("in_stock") and not v.get("duplicate_of") for v in p["variations"])
]
brand_from_name = [p for p in products if p["brand"] and not p["legacy_brand"]]
pwb_vs_name = Counter(
    (p["legacy_brand"]["name"], p["brand"])
    for p in products
    if p["brand"] and p["legacy_brand"] and p["legacy_brand"]["name"].lower() != p["brand"].lower()
)
name_prefix = Counter()
for p in products:
    if p["brand"] and " – " in p["name"]:
        prefix = p["name"].split(" – ")[0].strip()
        # Bare skrivemåter som avviker fra merket (ikke «AHAVA Soap», der produktlinjen står etter merket)
        if not " ".join(prefix.lower().split()).startswith(p["brand"].lower()):
            name_prefix[(prefix, p["brand"])] += 1
dup_images = [p for p in products if len({i["src"] for i in p["images"]}) < len(p["images"])]
guerlain = [p for p in products if p["brand"] == "Guerlain"]


def kr(x):
    return f"kr {x:,.0f}".replace(",", " ") if x is not None else "–"


L = []
a = L.append
a("# Datahull og avvik – til Regina")
a("")
a(f"Laget {date.today().strftime('%d.%m.%Y')} av `scripts/lag_rapporter.py` fra katalogen hentet "
  f"{meta['fetched'][:10]} fra {STORE} (Store API, bare lesing). Tallene oppdateres når skriptet kjøres på nytt.")
a("")
a("Den nye nettbutikken viser dataene slik de står i WooCommerce og finner ikke på tekst. Punktene under bør "
  "rettes i WooCommerce (eller avklares) før lansering. **Merket «Avklares»** betyr at vi trenger et svar fra "
  "Regina eller Marius.")
a("")
a("## Oversikt")
a("")
a("| Funn | Antall | Hva nettbutikken gjør nå |")
a("| --- | ---: | --- |")
a(f"| Produkter uten beskrivelse | {len(no_desc)} | Viser merke, kategori og «Spør oss i butikken om dette produktet» |")
a(f"| Utsolgte produkter | {len(sold_out)} | Viser «Utsolgt» og «Gi meg beskjed når den er tilbake» – skjules ikke |")
a(f"| Produkter uten gjenkjent merke | {len(no_brand)} | Vises uten merke |")
a(f"| Produkter der merket bare finnes i navnet (ikke i merke-registeret) | {len(brand_from_name)} | Merket er lest ut av navnet |")
a(f"| Doble variasjoner (samme valg to ganger) | {len(dups)} | Den første brukes, som i WooCommerce |")
a(f"| Variabelt produkt der lagerstatus på produktet og variantene er uenige | {len(mismatch)} | Variantene avgjør |")
a(f"| Produkter på tilbud | {len(on_sale)} | Viser før- og etterpris |")
a(f"| Produkter med samme bilde flere ganger i galleriet | {len(dup_images)} | Bildet vises flere ganger |")
a(f"| Produkt fra merke som ikke skal selges på nett | {len(guerlain)} | **Avklares** – vises som i dag (kjøpbart) |")
a("")

a("## Avklares med Regina / Marius")
a("")
for p in guerlain:
    a(f"- **{name(p)}** ligger i nettbutikken i dag ({p['source_url']}), men Guerlain står på listen over merker "
      "som ikke kan selges på nett. Vi har ikke endret noe: produktet vises og kan kjøpes som i dag til dere "
      "bestemmer. Én linje i `src/content/butikk.ts` (`AVKLARES`) styrer dette.")
a("- **Åpningstider** er ikke bekreftet (Instagram oppgir «10-18 (10-16)»). De legges inn under Innstillinger → "
  "Regina butikkinfo i WordPress og vises først når «Bekreftet av butikken» er krysset av.")
a("- **Fraktpriser:** nettbutikken viser bare det som står på dagens side «Frakt & Levering». Prisene settes av "
  "WooCommerce i kassen.")
a("- **Kundeklubben (Diller):** fordelene er ikke oppgitt, og vises derfor ikke. Send oss teksten, eller "
  "innmeldingslenken fra Diller (`NEXT_PUBLIC_DILLER_INNMELDING_URL`).")
a("- **Diller i Vipps Checkout:** Diller-pluginen (2.5.9) viser innmeldingen i den vanlige kassen og i Vipps "
  "Express, men trolig ikke i Vipps Checkout (se `docs/architecture.md`, R1). Dette må avklares med Diller før "
  "spiken kan godkjennes.")
a("- **Vipps-plugin:** dagens butikk ser ut til å bruke Amendos Vipps-plugin (`amendo-vipps/v2`), ikke «Pay with "
  "Vipps and MobilePay for WooCommerce» som oppdraget beskriver.")
a("- **Merkeregister:** dagens butikk bruker Perfect WooCommerce Brands. Importen legger merkene i WooCommerce "
  "Brands (innebygd fra WooCommerce 9.6). Gamle `/brand/`-adresser beholdes eller sendes videre (se "
  "`docs/redirects.csv`).")
a("- **Personvernerklæringen** på reginaparfymeri.no er fra 07.12.2020 og nevner Google Analytics. Den må oppdateres "
  "for ny nettbutikk (Vipps, Diller, WooCommerce, ev. analyse). Nettbutikken viser den slik den står, med en ny "
  "oversikt over informasjonskapslene.")
a("- **Bilder og logo:** butikkbildene fra reginaparfymeri.no har ukjent fotograf – bruksretten må bekreftes "
  "(`docs/bildekilder.md`). PNG-logoen fra nettbutikken har hvit bakgrunn; vi bruker vektorlogoen fra "
  "reginaparfymeri.no. Vi trenger gjerne logoen med «PARFYMERI» i vektor med gjennomsiktig bakgrunn.")
a(f"- **Merker lest ut av navnet** ({len(brand_from_name)} produkter uten merke i merkeregisteret) bør sjekkes, "
  "f.eks. «FIORENTINO – Lavendel og Sitron» → Florentino og «AQUA» → Gian Marco Venturi.")
a("- **Sandfargene** (`--sand-50` m.fl.) er et forslag og må godkjennes.")
a("- **Film til forsiden:** heroen viser et plakatbilde til dere leverer egen film fra butikken.")
a("")

a("## Merkenavn som er rettet")
a("")
a("Merkene står ulikt i produktnavnene. Nettbutikken bruker et felles merkenavn (`scripts/build_catalog.py`). "
  "Det bør rettes i WooCommerce også:")
a("")
a("| Står i produktnavnet | Vises som | Produkter |")
a("| --- | --- | ---: |")
for (prefix, brand), n in sorted(name_prefix.items(), key=lambda x: (x[0][1], x[0][0])):
    a(f"| {prefix} | {brand} | {n} |")
a("")
if pwb_vs_name:
    a("Merkeregisteret (Perfect WooCommerce Brands) og navnet er uenige om skrivemåten:")
    a("")
    a("| Merkeregisteret | Vises som | Produkter |")
    a("| --- | --- | ---: |")
    for (pwb, brand), n in sorted(pwb_vs_name.items()):
        a(f"| {pwb} | {brand} | {n} |")
    a("")

a("## Produkter uten gjenkjent merke")
a("")
for p in no_brand:
    a(f"- {name(p)} – {p['source_url']}")
a("")
a("## Doble variasjoner")
a("")
for p, v in dups:
    a(f"- {name(p)}: variasjon {v['id']} har samme valg som {v['duplicate_of']} "
      f"({', '.join(v['attribute_labels'].values())}). Den doble bør slettes.")
a("")
a("## Lagerstatus som ikke stemmer")
a("")
for p in mismatch:
    a(f"- {name(p)}: produktet står som {'på lager' if p['in_stock'] else 'utsolgt'}, men "
      f"{sum(1 for v in p['variations'] if v.get('in_stock'))} av {len(p['variations'])} varianter er på lager.")
a("")
a("## På tilbud")
a("")
a("Tilbudene har ingen sluttdato i dataene. Sjekk at de fortsatt skal gjelde.")
a("")
a("| Produkt | Før | Nå |")
a("| --- | ---: | ---: |")
for p in on_sale:
    a(f"| {name(p)} | {kr(p['regular_price'])} | {kr(p['price'])} |")
a("")
a(f"## Produkter uten beskrivelse ({len(no_desc)})")
a("")
for p in no_desc:
    a(f"- {name(p)}")
a("")
a(f"## Utsolgte produkter ({len(sold_out)})")
a("")
a("De vises med «Utsolgt» og «Gi meg beskjed når den er tilbake». Vurder om noen skal avsluttes.")
a("")
for p in sold_out:
    a(f"- {name(p)}")
a("")
a(f"## Gallerier med samme bilde flere ganger ({len(dup_images)})")
a("")
for p in dup_images:
    a(f"- {name(p)}")
a("")
(DOCS / "data-issues.md").write_text("\n".join(L) + "\n")
print(f"redirects.csv: {len(rows)} rader · data-issues.md: {len(L)} linjer")
