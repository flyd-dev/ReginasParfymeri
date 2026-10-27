// Avslører [data-inn]-elementer når de kommer inn i bildet (se «Inngang» i globals.css). Skriptet står inne i
// HTML-en og kjører før React er hydrert, så innhold øverst på siden ikke venter på JavaScript-bunten. Det følger
// også med på nye elementer (klientnavigasjon) via MutationObserver. Ingenting skjer ved redusert bevegelse eller
// uten IntersectionObserver – da står alt der fra start.

const skript = `(() => {
  const rot = document.documentElement
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  rot.setAttribute('data-bevegelse', '')
  const io = new IntersectionObserver((rader) => {
    for (const r of rader) {
      if (!r.isIntersecting) continue
      r.target.setAttribute('data-synlig', '')
      io.unobserve(r.target)
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 })
  const finn = (node) => {
    if (node.nodeType !== 1) return
    if (node.matches('[data-inn]:not([data-synlig])')) io.observe(node)
    node.querySelectorAll('[data-inn]:not([data-synlig])').forEach((el) => io.observe(el))
  }
  finn(document.body)
  new MutationObserver((endringer) => {
    for (const e of endringer) e.addedNodes.forEach(finn)
  }).observe(document.body, { childList: true, subtree: true })
})()`

export function BevegelseSkript() {
  return <script dangerouslySetInnerHTML={{ __html: skript }} />
}
