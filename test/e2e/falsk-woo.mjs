// Falsk WooCommerce for e2e: Store API-kurven med Cart-Token slik docs/architecture.md §5.1 beskriver,
// og overføringen (§5.2) som en enkel «kasse»-side. Bruker prisene i data/products.json.
// Start: node test/e2e/falsk-woo.mjs [port]

import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'

const port = Number(process.argv[2] ?? 4010)
const produkter = JSON.parse(readFileSync(new URL('../../data/products.json', import.meta.url), 'utf8'))
const etterId = new Map()
for (const p of produkter) {
  etterId.set(p.id, { navn: p.name, pris: p.price })
  for (const v of p.variations)
    etterId.set(v.id, {
      navn: `${p.name} – ${Object.values(v.attribute_labels).join(', ')}`,
      pris: v.price,
      variant: true,
    })
}

const kurver = new Map()
const nyttToken = () => `t_${randomBytes(15).toString('hex')}`

function svar(res, status, data, token) {
  const hoder = { 'content-type': 'application/json' }
  if (token) hoder['cart-token'] = token
  res.writeHead(status, hoder)
  res.end(JSON.stringify(data))
}

function kurvdata(linjer) {
  const sum = linjer.reduce((s, l) => s + Math.round(l.pris * 100) * l.antall, 0)
  return {
    items: linjer.map((l) => ({
      key: l.key,
      id: l.id,
      quantity: l.antall,
      name: l.navn,
      variation: l.variation,
      prices: {
        price: String(Math.round(l.pris * 100)),
        regular_price: String(Math.round(l.pris * 100)),
        sale_price: String(Math.round(l.pris * 100)),
        currency_minor_unit: 2,
      },
      quantity_limits: { maximum: 10 },
    })),
    items_count: linjer.reduce((s, l) => s + l.antall, 0),
    totals: {
      total_items: String(Math.round(sum * 0.8)),
      total_items_tax: String(sum - Math.round(sum * 0.8)),
      currency_minor_unit: 2,
    },
  }
}

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`)
  // Kontrakten: Next.js sender aldri Nonce.
  if (Object.keys(req.headers).some((h) => /nonce/i.test(h))) return svar(res, 400, { code: 'nonce_sendt' })
  let kropp = ''
  req.on('data', (d) => (kropp += d))
  req.on('end', () => {
    const token = req.headers['cart-token']
    const gyldig = typeof token === 'string' && kurver.has(token)

    if (url.pathname === '/' && url.searchParams.has('regina_kurv')) {
      const linjer = kurver.get(url.searchParams.get('regina_kurv')) ?? []
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      return res.end(
        `<!doctype html><meta charset="utf-8"><title>Kassen</title><h1>WooCommerce-kassen (test)</h1><p id="antall">Varer: ${linjer.reduce((s, l) => s + l.antall, 0)}</p><ul>${linjer.map((l) => `<li>${l.navn} × ${l.antall}</li>`).join('')}</ul>`,
      )
    }

    if (url.pathname === '/wp-json/wc/store/v1/cart' && req.method === 'GET') {
      if (gyldig) return svar(res, 200, kurvdata(kurver.get(token)), token)
      const nytt = nyttToken()
      kurver.set(nytt, [])
      return svar(res, 200, kurvdata([]), nytt)
    }

    if (req.method === 'POST' && url.pathname.startsWith('/wp-json/wc/store/v1/cart/')) {
      if (!gyldig) return svar(res, 401, { code: 'woocommerce_rest_missing_nonce', message: 'Mangler nonce' })
      const linjer = kurver.get(token)
      const data = JSON.parse(kropp || '{}')
      const handling = url.pathname.split('/').pop()
      if (handling === 'add-item') {
        const vare = etterId.get(data.id)
        if (!vare) return svar(res, 400, { code: 'ukjent', message: 'Ukjent vare' })
        const finnes = linjer.find((l) => l.id === data.id)
        if (finnes) finnes.antall += data.quantity
        else
          linjer.push({
            key: randomBytes(8).toString('hex'),
            id: data.id,
            antall: data.quantity,
            navn: vare.navn,
            pris: vare.pris,
            variation: data.variation ?? [],
          })
      } else if (handling === 'update-item') {
        const l = linjer.find((x) => x.key === data.key)
        if (l) l.antall = data.quantity
      } else if (handling === 'remove-item') {
        kurver.set(
          token,
          linjer.filter((x) => x.key !== data.key),
        )
      }
      return svar(res, 200, kurvdata(kurver.get(token)), token)
    }
    svar(res, 404, { code: 'ikke_funnet' })
  })
}).listen(port, () => console.log(`falsk WooCommerce på http://localhost:${port}`))
