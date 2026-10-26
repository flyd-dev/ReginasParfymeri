// Fjerner forrige byggs serverfiler og ISR-hurtiglager før et nytt bygg. Uten dette kan en
// gjenbrukt .next-mappe servere sider fra forrige bygg som peker på CSS-filer som ikke finnes lenger.
import { rmSync } from 'node:fs'

rmSync('.next/server', { recursive: true, force: true })
