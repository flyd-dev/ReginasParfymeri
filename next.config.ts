import type { NextConfig } from 'next'

const butikk = new URL(process.env.WOO_URL ?? 'https://nettbutikk.reginaparfymeri.no')

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Produktbildene kommer fra WooCommerce sitt mediebibliotek – kilden til katalogen.
    remotePatterns: [{ protocol: 'https', hostname: butikk.hostname, pathname: '/wp-content/uploads/**' }],
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 90],
    deviceSizes: [390, 640, 768, 1024, 1280, 1600, 1920],
    imageSizes: [64, 96, 128, 200, 256, 320, 400],
  },
  // Katalogutdraget leses fra disk på serveren.
  outputFileTracingIncludes: { '/**': ['./data/katalog/**'] },
}

export default config
