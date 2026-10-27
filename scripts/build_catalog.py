"""Build a clean product catalogue for the new Regina Parfymeri webshop.

Input:  raw/all_products_raw.json (WooCommerce Store API dump, 1082 products)
        raw/variations_raw.json, raw/popularity_raw.json, raw/product_meta_raw.json,
        raw/pwb_brands_raw.json, raw/pages_raw.json (optional, from refresh_from_store.py)
Output: data/products.json, data/products.csv, data/brands.json,
        data/categories.json, data/catalog_summary.md,
        data/legacy_brands.json (old /brand/<slug>/ URLs), data/pages.json (store content pages)
"""
import csv
import html
import json
import re
import sys
import unicodedata
from html.parser import HTMLParser
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
RAW = ROOT / "raw" / "all_products_raw.json"
OUT = ROOT / "data"
OUT.mkdir(exist_ok=True)


def load_optional(name: str, default):
    f = ROOT / "raw" / name
    return json.loads(f.read_text()) if f.exists() else default


VARIATIONS = load_optional("variations_raw.json", {})
POPULARITY = {pid: i + 1 for i, pid in enumerate(load_optional("popularity_raw.json", []))}
META = {m["id"]: m for m in load_optional("product_meta_raw.json", [])}
PWB = {b["id"]: b for b in load_optional("pwb_brands_raw.json", [])}
PAGES = load_optional("pages_raw.json", []) + load_optional("main_pages_raw.json", [])


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.replace("Ø", "O").replace("ø", "o").replace("Æ", "AE").replace("æ", "ae")
    return re.sub(r"\s+", " ", s).strip().upper()


def slugify(s: str) -> str:
    s = norm(s).lower().replace("&", " ")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


# canonical display name -> list of normalised prefixes seen in product names
BRANDS = {
    "AHAVA": ["AHAVA"],
    "MAVALA": ["MAVALA"],
    "Rudolph Care": ["RUDOLPH CARE"],
    "Beter Elite": ["BETER ELITE", "BETE ELITE", "BETER"],
    "Titania": ["TITANIA"],
    "Susanne Kaufmann": ["SUSANNE KAUFMANN"],
    "JJDK": ["JJDK"],
    "Parfums de Marly": ["PARFUMS DE MARLY", "PARFUMES DE MARLEY", "PARFUMS DE MARLEY"],
    "HAAN": ["HAAN"],
    "Anastasia Beverly Hills": ["ANASTASIA BEVERLY HILLS", "ANASTASIA"],
    "Montblanc": ["MONTBLANC", "MONT BLANC"],
    "Creed": ["CREED"],
    "Löwengrip": ["LOWENGRIP", "LOVENGRIP"],
    "Hermines Story": ["HERMINES STORY"],
    "Guinot": ["GUINOT"],
    "Ida Warg": ["IDA WARG"],
    "Optima Natura": ["OPTIMA NATURA", "OPTIMA NATURE"],
    "Initio": ["INITIO"],
    "BDK Parfums": ["BDK PARFUMS", "BDK"],
    "Essential Parfums": ["ESSENTIAL PARFUMS"],
    "Fugazzi": ["FUGAZZI", "FUGUAZZI"],
    "Memo Paris": ["MEMO"],
    "Dresdner Essenz": ["DRESDNER"],
    "Haugescent": ["HAUGESCENT"],
    "Escentric Molecules": ["ESCENTRIC MOLECULES"],
    "Ormonde Jayne": ["ORMONDE JAYNE"],
    "Jobski": ["JOBSKI"],
    "Van Cleef & Arpels": ["VAN CLEEF & ARPELS", "VAN CLEEF"],
    "Hanne Bang": ["HANNE BANG"],
    "Esponjabon": ["ESPONJABON"],
    "Mitchum": ["MITCHUM"],
    "Free Vola": ["FREE VOLA"],
    "Kent": ["KENT"],
    "Men Rock": ["MEN ROCK"],
    "Engelsrufer": ["ENGELSRUFER", "ENGELRUFER"],
    "Nesti Dante": ["NESTI DANTE"],
    "Medicube": ["MEDICUBE"],
    "Martinelia": ["MARTINELIA"],
    "Björn Axén": ["BJORN AXEN"],
    "IDC Institute": ["IDC INSTITUTE", "AQU IDC", "IDC"],
    "Perlier": ["PERLIER"],
    "Yardley London": ["YARDLEY", "YARDELY"],
    "Summer Beach": ["SUMMER BEACH"],
    "Davidoff": ["DAVIDOFF"],
    "Old Spice": ["OLD SPICE"],
    "Rebellious": ["REBELLIOUS"],
    "Elizabeth Arden": ["ELIZABETH ARDEN", "ELISABETH ARDEN"],
    "Bell": ["BELL"],
    "Brylcreem": ["BRYLCREEM"],
    "Florentino": ["FLORENTINO", "FIORENTINO"],
    "GC Homme": ["GC HOMME"],
    "Guerlain": ["GUERLAIN"],
    "Suavina": ["SUAVINA"],
    "Gillette": ["GILLETTES VENUS", "GILLETTE"],
    "Grande Cosmetics": ["GRANDELASH", "GRANDEBROW", "GRANDEPOUT", "GRANDE COSMETICS", "GRANDE"],
    "Batiste": ["BATISTE"],
    "Bondi Sands": ["BONDI SANDS"],
    "Pears": ["PEARS"],
    "Erasmic": ["ERASMIC"],
    "Danielle": ["DANIELLE"],
    "Gian Marco Venturi": ["GIAN MARCO VENTURI", "AQUA"],
    "Helene Fischer": ["HELENE FISCHER", "HELENE FISHER"],
    "Nail HQ": ["NAIL HQ"],
    "Athena": ["ATHENA"],
    "Highland": ["HIGHLAND"],
    "Vadeco": ["VADECO"],
    "Equate": ["EQUATE"],
    "Micro Cell 2000": ["MICRO CELL 2000", "MICRO CELL"],
    "Zew for men": ["ZEW"],
    "Sonic": ["SONIC"],
    "Mii": ["MII"],
    "Skippy": ["SKIPPY"],
    "Pure Bristles": ["PURE BRISTLES"],
    "Love": ["LOVE"],
    "Yerka": ["YERKA"],
    "Stern": ["STERN"],
    "Magnista": ["MAGINISTA", "MAGNISTA"],
    "Eye Candy": ["EYE CANDY"],
}
PREFIXES = sorted(
    ((p, canon) for canon, ps in BRANDS.items() for p in ps),
    key=lambda t: -len(t[0]),
)


def find_brand(name: str):
    n = norm(name)
    for p, canon in PREFIXES:
        if n == p or n.startswith(p + " ") or n.startswith(p + "-") or n.startswith(p + "–") or n.startswith(p + " |"):
            return canon
    return None


def clean_html(s: str) -> str:
    s = html.unescape(s or "")
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
    s = re.sub(r"</p>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n\s*\n+", "\n\n", s)
    return s.strip()


def nok(minor: str, unit: int) -> float | None:
    if minor in (None, ""):
        return None
    return int(minor) / (10 ** unit)


def cat_path(link: str):
    m = re.search(r"/produktkategori/(.+?)/?$", link or "")
    return m.group(1).split("/") if m else []


raw = json.loads(RAW.read_text())
raw.sort(key=lambda x: x["id"])

slug_name = {"har": "HÅR", "tilbehor": "TILBEHØR", "hudpleie": "HUDPLEIE", "duft": "DUFT",
             "makeup": "MAKEUP", "herre": "HERRE", "accessories": "ACCESSORIES", "oyne": "ØYNE",
             "harpleie": "HÅRPLEIE", "harstyling": "HÅRSTYLING", "handpleie": "HÅNDPLEIE",
             "oye-og-leppeprodukter": "ØYE OG LEPPEPRODUKTER", "negler": "NEGLER", "bryn": "BRYN",
             "makeup-ansikt": "MAKEUP ANSIKT", "makeup-lepper": "MAKEUP LEPPER", "kroppspleie": "KROPPSPLEIE",
             "ansiktspleie": "ANSIKTSPLEIE", "renseprodukter": "RENSEPRODUKTER", "solbeskyttelse": "SOLBESKYTTELSE",
             "selvbruning": "SELVBRUNING", "gavesett": "GAVESETT", "fotpleie": "FOTPLEIE",
             "kroppspleie-herre": "KROPPSPLEIE HERRE", "ansiktspleie-for-menn": "ANSIKTSPLEIE FOR MENN"}
for p in raw:
    for c in p["categories"]:
        slug_name[c["slug"]] = html.unescape(c["name"])

products = []
for p in raw:
    pr = p["prices"]
    unit = pr.get("currency_minor_unit", 2)
    rng = pr.get("price_range") or {}
    cats = []
    for c in p["categories"]:
        path = cat_path(c.get("link", ""))
        cats.append(
            {
                "slug": c["slug"],
                "name": html.unescape(c["name"]),
                "path": [slug_name.get(s, s.upper()) for s in path],
                "path_slugs": path,
            }
        )
    brand = find_brand(p["name"])
    attrs = [
        {"name": html.unescape(a["name"]), "options": [html.unescape(t["name"]) for t in a.get("terms", [])],
         "option_slugs": [t["slug"] for t in a.get("terms", [])], "variation": a.get("has_variations", False)}
        for a in p["attributes"]
    ]
    labels = {a["name"]: dict(zip(a["option_slugs"], a["options"])) for a in attrs}
    variations, seen_combo = [], {}
    for v in p.get("variations", []):
        combo = {html.unescape(a["name"]): html.unescape(a["value"]) for a in v["attributes"]}
        key = tuple(sorted(combo.items()))
        row = {"id": v["id"], "attributes": combo,
               "attribute_labels": {n: labels.get(n, {}).get(val, val) for n, val in combo.items()}}
        full = VARIATIONS.get(str(v["id"])) or VARIATIONS.get(v["id"])
        if full:
            vp = full["prices"]
            vu = vp.get("currency_minor_unit", 2)
            row.update({
                "sku": full.get("sku", ""),
                "price": nok(vp.get("price"), vu),
                "regular_price": nok(vp.get("regular_price"), vu),
                "sale_price": nok(vp.get("sale_price"), vu) if full.get("on_sale") else None,
                "on_sale": full.get("on_sale", False),
                "in_stock": full.get("is_in_stock", False),
                "purchasable": full.get("is_purchasable", True),
                "low_stock_remaining": full.get("low_stock_remaining"),
                "stock_text": html.unescape((full.get("stock_availability") or {}).get("text", "")),
                "max_quantity": (full.get("add_to_cart") or {}).get("maximum"),
                "description": clean_html(full.get("description", "")),
                "image": (full.get("images") or [{}])[0].get("src") if full.get("images") else None,
            })
        # WooCommerce velger den første variasjonen med samme valg; resten meldes som avvik.
        if key in seen_combo:
            row["duplicate_of"] = seen_combo[key]
        else:
            seen_combo[key] = v["id"]
        variations.append(row)
    meta = META.get(p["id"], {})
    pwb = [PWB[b] for b in meta.get("pwb-brand", []) if b in PWB]
    products.append(
        {
            "id": p["id"],
            "name": html.unescape(p["name"]).strip(),
            "slug": p["slug"],
            "brand": brand,
            "type": p["type"],
            "sku": p["sku"],
            "price": nok(pr.get("price"), unit),
            "regular_price": nok(pr.get("regular_price"), unit),
            "sale_price": nok(pr.get("sale_price"), unit) if p["on_sale"] else None,
            "price_min": nok(rng.get("min_amount"), unit) if rng else None,
            "price_max": nok(rng.get("max_amount"), unit) if rng else None,
            "currency": pr.get("currency_code", "NOK"),
            "on_sale": p["on_sale"],
            "in_stock": p["is_in_stock"],
            "low_stock_remaining": p.get("low_stock_remaining"),
            "short_description": clean_html(p["short_description"]),
            "description": clean_html(p["description"]),
            "categories": cats,
            "primary_category_path": max((c["path"] for c in cats), key=len, default=[]),
            "attributes": attrs,
            "variation_ids": [v["id"] for v in p.get("variations", [])],
            "variations": variations,
            "max_quantity": (p.get("add_to_cart") or {}).get("maximum"),
            "stock_text": html.unescape((p.get("stock_availability") or {}).get("text", "")),
            "purchasable": p.get("is_purchasable", True),
            "on_backorder": p.get("is_on_backorder", False),
            "date_created": meta.get("date"),
            "date_modified": meta.get("modified"),
            "popularity_rank": POPULARITY.get(p["id"]),
            "legacy_brand": {"name": html.unescape(pwb[0]["name"]), "slug": pwb[0]["slug"]} if pwb else None,
            "images": [
                {"src": i["src"], "thumbnail": i.get("thumbnail"), "alt": i.get("alt", ""), "name": i.get("name", "")}
                for i in p["images"]
            ],
            "source_url": p["permalink"],
        }
    )

# CSV for quick review / spreadsheet import
with open(OUT / "products.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(
        ["id", "name", "brand", "type", "sku", "price_nok", "price_min", "price_max", "on_sale",
         "in_stock", "category_path", "variant_options", "image_count", "first_image", "has_description", "source_url"]
    )
    for p in products:
        w.writerow(
            [
                p["id"], p["name"], p["brand"] or "", p["type"], p["sku"], p["price"], p["price_min"] or "",
                p["price_max"] or "", p["on_sale"], p["in_stock"], " > ".join(p["primary_category_path"]),
                "; ".join(f'{a["name"]}: {", ".join(a["options"])}' for a in p["attributes"] if a["variation"]),
                len(p["images"]), p["images"][0]["src"] if p["images"] else "", bool(p["description"]), p["source_url"],
            ]
        )

# brands – slug follows the old Perfect WooCommerce Brands slug when the products agree,
# so /brand/<slug>/ keeps working. Otherwise a new slug from the canonical name.
bc = Counter(p["brand"] for p in products if p["brand"])
votes = defaultdict(Counter)
for p in products:
    if p["brand"] and p["legacy_brand"]:
        votes[p["brand"]][p["legacy_brand"]["slug"]] += 1
brand_slug = {}
for b in bc:
    slug = votes[b].most_common(1)[0][0] if votes[b] else slugify(b)
    brand_slug[b] = slug
for p in products:
    p["brand_slug"] = brand_slug.get(p["brand"]) if p["brand"] else None
brands = [{"name": b, "slug": brand_slug[b], "product_count": n} for b, n in bc.most_common()]
(OUT / "brands.json").write_text(json.dumps(brands, ensure_ascii=False, indent=2))
(OUT / "products.json").write_text(json.dumps(products, ensure_ascii=False, indent=2))
# when the raw data was fetched from the store (shown as «oppdatert» and used by the frontend)
fetched = datetime.fromtimestamp(RAW.stat().st_mtime, tz=timezone.utc).isoformat(timespec="seconds")
(OUT / "meta.json").write_text(json.dumps({"fetched": fetched, "source": "https://nettbutikk.reginaparfymeri.no"}, indent=2))

# old brand URLs (PWB) -> new brand slug, or None when the brand has no products online
by_slug = {b["slug"]: b["name"] for b in brands}
legacy = []
for b in sorted(PWB.values(), key=lambda x: x["slug"]):
    agree = Counter(p["brand"] for p in products if p["legacy_brand"] and p["legacy_brand"]["slug"] == b["slug"] and p["brand"])
    target = brand_slug[agree.most_common(1)[0][0]] if agree else (b["slug"] if b["slug"] in by_slug else None)
    legacy.append({"slug": b["slug"], "name": html.unescape(b["name"]), "count": b["count"],
                   "url": b["link"], "new_slug": target})
(OUT / "legacy_brands.json").write_text(json.dumps(legacy, ensure_ascii=False, indent=2))

# category tree from paths
tree = {}
counts = Counter()
for p in products:
    seen = set()
    for c in p["categories"]:
        for i in range(1, len(c["path_slugs"]) + 1):
            key = "/".join(c["path_slugs"][:i])
            if key not in seen:
                counts[key] += 1
                seen.add(key)
            node = tree
            for s in c["path_slugs"][:i]:
                node = node.setdefault(s, {})


def to_list(node, prefix=""):
    out = []
    for slug, children in sorted(node.items(), key=lambda kv: -counts[(prefix + kv[0])]):
        key = prefix + slug
        out.append({"slug": slug, "name": slug_name.get(slug, slug.upper()), "path": key,
                    "product_count": counts[key], "children": to_list(children, key + "/")})
    return out


categories = to_list(tree)
(OUT / "categories.json").write_text(json.dumps(categories, ensure_ascii=False, indent=2))

# content pages from the store (Elementor HTML -> plain blocks with inline runs; no HTML kept)
class Blocks(HTMLParser):
    BLOCK = {"p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "div"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks, self.runs, self.kind, self.href, self.strong, self.form = [], [], "p", None, 0, 0

    def flush(self):
        runs = [r for r in self.runs if r["text"].strip()]
        if runs:
            runs[0]["text"] = runs[0]["text"].lstrip()
            runs[-1]["text"] = runs[-1]["text"].rstrip()
            text = "".join(r["text"] for r in runs)
            kind = self.kind
            # a paragraph that is only bold text is a heading in these pages
            if kind == "p" and all(r.get("strong") for r in runs) and len(text) < 80:
                kind = "h3"
            if kind == "li" and self.blocks and self.blocks[-1]["type"] == "list":
                self.blocks[-1]["items"].append(runs)
            elif kind == "li":
                self.blocks.append({"type": "list", "items": [runs]})
            elif kind.startswith("h"):
                self.blocks.append({"type": "heading", "text": text})
            else:
                self.blocks.append({"type": "paragraph", "runs": runs})
        self.runs = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "form":  # kontaktskjemaet i «Om oss» hører ikke med i teksten
            self.form += 1
        elif tag in self.BLOCK:
            self.flush()
            self.kind = tag if tag != "div" else "p"
        elif tag == "br":
            # <br> skiller avsnitt i disse sidene; et rent fett avsnitt blir en overskrift
            kind = self.kind
            self.flush()
            self.kind = kind
        elif tag == "a":
            self.href = a.get("href")
        elif tag in ("strong", "b"):
            self.strong += 1

    def handle_endtag(self, tag):
        if tag == "form":
            self.form = max(0, self.form - 1)
        elif tag in self.BLOCK:
            self.flush()
            self.kind = "p"
        elif tag == "a":
            self.href = None
        elif tag in ("strong", "b"):
            self.strong = max(0, self.strong - 1)

    def handle_data(self, data):
        text = re.sub(r"[ \t\r\n]+", " ", data)
        if not text or self.form:
            return
        run = {"text": text}
        if self.href:
            run["href"] = self.href
        if self.strong:
            run["strong"] = True
        self.runs.append(run)


pages = []
for pg in PAGES:
    parser = Blocks()
    # WPBakery-kortkoder ([vc_row] osv.) på hovedsiden er ikke tekst
    parser.feed(re.sub(r"\[/?vc_[^\]]*\]", "", pg["content"]["rendered"]))
    parser.flush()
    pages.append({"slug": pg["slug"], "title": html.unescape(pg["title"]["rendered"]), "modified": pg["modified"],
                  "source_url": pg["link"], "blocks": parser.blocks})
(OUT / "pages.json").write_text(json.dumps(pages, ensure_ascii=False, indent=2))

# summary
unbranded = [p["name"] for p in products if not p["brand"]]
prices = [p["price"] for p in products if p["price"]]
lines = [
    "# Regina Parfymeri – produktkatalog (scrapet fra nettbutikk.reginaparfymeri.no)",
    "",
    f"- Produkter: **{len(products)}** ({Counter(p['type'] for p in products)['simple']} enkle, "
    f"{Counter(p['type'] for p in products)['variable']} med varianter)",
    f"- På lager: {sum(p['in_stock'] for p in products)} · Utsolgt: {sum(not p['in_stock'] for p in products)}",
    f"- På tilbud: {sum(p['on_sale'] for p in products)}",
    f"- Uten beskrivelse: {sum(not p['description'] for p in products)}",
    f"- Alle produkter har minst ett bilde; totalt {sum(len(p['images']) for p in products)} bilder",
    f"- Pris: {min(prices):.0f}–{max(prices):.0f} NOK (median {sorted(prices)[len(prices)//2]:.0f} NOK)",
    f"- Merker gjenkjent: {len(brands)} · Produkter uten gjenkjent merke: {len(unbranded)}",
    "",
    "## Hovedkategorier",
    "",
]
for c in categories:
    subs = ", ".join(f"{s['name']} ({s['product_count']})" for s in c["children"])
    lines.append(f"- **{c['name']}** ({c['product_count']}): {subs}")
lines += ["", "## Merker (antall produkter)", "", ", ".join(f"{b['name']} ({b['product_count']})" for b in brands)]
lines += ["", "## Produkter uten gjenkjent merke (må merkes manuelt)", ""] + [f"- {n}" for n in unbranded]
dups = [(p["name"], v) for p in products for v in p["variations"] if v.get("duplicate_of")]
lines += ["", "## Doble variasjoner (WooCommerce bruker den første; resten bør slettes)", ""] + [
    f"- {n}: variasjon {v['id']} har samme valg som {v['duplicate_of']} ({', '.join(v['attribute_labels'].values())})"
    for n, v in dups]
missing_var = sum(1 for p in products for v in p["variations"] if "price" not in v)
lines += ["", f"Variasjoner uten pris/lager-data: {missing_var}"]
(OUT / "catalog_summary.md").write_text("\n".join(lines) + "\n")

print(len(products), "products |", len(brands), "brands |", len(unbranded), "unbranded")
print("top-level:", [(c["name"], c["product_count"]) for c in categories])
print("unbranded sample:", unbranded[:60])
