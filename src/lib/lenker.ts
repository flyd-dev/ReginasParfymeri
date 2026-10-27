// Adressene følger dagens butikk, så lenker og søkemotorer treffer fortsatt (oppdraget §8).
// Alle sider har skråstrek til slutt, som i WordPress (trailingSlash i next.config.ts).

export const produktUrl = (slug: string) => `/produkt/${slug}/`
export const kategoriUrl = (sti: string[]) => `/produktkategori/${sti.join('/')}/`
export const merkeUrl = (slug: string) => `/brand/${slug}/`
export const sokUrl = (q: string) => `/sok/?q=${encodeURIComponent(q)}`
