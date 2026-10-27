"""Re-pull Regina Parfymeri's live catalogue from the public WooCommerce Store API.

Run from the project root:  python3 scripts/refresh_from_store.py
Then rebuild the clean files: python3 scripts/build_catalog.py .

- Uses only public, read-only GET endpoints (no keys needed). Never writes to the store.
- Also fetches every variation (size/colour) so each variant gets its own price,
  SKU and stock status — the product list endpoint only gives a price range.
  Variations are read in batches (type=variation); any the batch misses are read one by one.
- Also reads, from the same store:
    * popularity order (WooCommerce total_sales) for «Bestselgere»
    * publish date and Perfect WooCommerce Brands slug per product (WP REST, public fields)
    * the PWB brand list (old /brand/<slug>/ URLs, kept for SEO)
    * the store's own content pages (terms, shipping, returns, about) and the privacy
      statement on reginaparfymeri.no
Writes raw/all_products_raw.json, raw/variations_raw.json, raw/popularity_raw.json,
raw/product_meta_raw.json, raw/pwb_brands_raw.json, raw/pages_raw.json and raw/main_pages_raw.json.
"""
import json
import sys
import time
import urllib.request
from pathlib import Path

STORE = "https://nettbutikk.reginaparfymeri.no"
BASE = f"{STORE}/wp-json/wc/store/v1"
WP = f"{STORE}/wp-json/wp/v2"
ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
RAW = ROOT / "raw"
RAW.mkdir(exist_ok=True)
PAGES = ["om-oss", "frakt-levering", "angrerett-og-retur", "betingelser"]
# Reginas hovedside (eget WordPress) har personvernerklæringen
MAIN_WP = "https://reginaparfymeri.no/wp-json/wp/v2"
MAIN_PAGES = ["personvernerklaering"]


def get(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "Flyd-Regina-migration/1.0"}, method="GET")
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:  # noqa: BLE001
            if attempt == 2:
                raise
            print(f"  retry {url}: {e}")
            time.sleep(2 * (attempt + 1))


def all_pages(url: str, per_page: int = 100):
    out, page = [], 1
    sep = "&" if "?" in url else "?"
    while True:
        batch = get(f"{url}{sep}per_page={per_page}&page={page}")
        if not batch:
            break
        out.extend(batch)
        if len(batch) < per_page:
            break
        page += 1
        time.sleep(0.5)
    return out


def write(name: str, data) -> None:
    (RAW / name).write_text(json.dumps(data, ensure_ascii=False))


products, page = [], 1
while True:
    batch = get(f"{BASE}/products?per_page=100&page={page}")
    if not batch:
        break
    products.extend(batch)
    print(f"page {page}: {len(batch)} products")
    page += 1
    time.sleep(0.5)

write("all_products_raw.json", products)
print("total products:", len(products))

wanted = {v["id"]: p["name"] for p in products for v in p.get("variations", [])}
variations = {v["id"]: v for v in all_pages(f"{BASE}/products?type=variation") if v["id"] in wanted}
for vid in sorted(set(wanted) - set(variations)):
    try:
        variations[vid] = get(f"{BASE}/products/{vid}")
    except Exception as e:  # noqa: BLE001
        print(f"  could not fetch variation {vid} of {wanted[vid]}: {e}")
    time.sleep(0.2)
write("variations_raw.json", variations)
print("variations fetched:", len(variations), "of", len(wanted))

popular = all_pages(f"{BASE}/products?orderby=popularity&order=desc&_fields=id")
write("popularity_raw.json", [p["id"] for p in popular])
print("popularity order:", len(popular))

meta = all_pages(f"{WP}/product?_fields=id,date,modified,pwb-brand")
write("product_meta_raw.json", meta)
print("product meta:", len(meta))

brands = all_pages(f"{WP}/pwb-brand?_fields=id,name,slug,count,description,link")
write("pwb_brands_raw.json", brands)
print("pwb brands:", len(brands))

pages = get(f"{WP}/pages?slug={','.join(PAGES)}&_fields=id,slug,link,modified,title,content")
write("pages_raw.json", pages)
print("pages:", [p["slug"] for p in pages])

main_pages = get(f"{MAIN_WP}/pages?slug={','.join(MAIN_PAGES)}&_fields=id,slug,link,modified,title,content")
write("main_pages_raw.json", main_pages)
print("main site pages:", [p["slug"] for p in main_pages])
