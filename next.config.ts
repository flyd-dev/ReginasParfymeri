import type { NextConfig } from 'next'
import { gamleAdresser } from './src/lib/seo/omdirigeringer'

const butikk = new URL(process.env.WOO_URL ?? 'https://nettbutikk.reginaparfymeri.no')

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Som i WordPress: /produkt/<slug>/ med skråstrek til slutt, så dagens adresser fortsatt treffer.
  trailingSlash: true,
  images: {
    // Produktbildene ligger i WooCommerces mediebibliotek til de er migrert (oppdraget §6).
    remotePatterns: [
      { protocol: 'https', hostname: 'nettbutikk.reginaparfymeri.no', pathname: '/wp-content/uploads/**' },
      ...(butikk.hostname !== 'nettbutikk.reginaparfymeri.no'
        ? [{ protocol: 'https' as const, hostname: butikk.hostname, pathname: '/wp-content/uploads/**' }]
        : []),
    ],
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 90],
    deviceSizes: [375, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [64, 96, 128, 200, 256, 320, 400],
  },
  // Katalogfilene leses fra disk på serveren (DATA_SOURCE=json).
  outputFileTracingIncludes: { '/**': ['./data/*.json'] },
  async redirects() {
    return gamleAdresser()
  },
}

export default config
