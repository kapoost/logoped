// app/sw.ts
// Service worker aplikacji. Zastąpił next-pwa, który ostatni raz wyszedł
// w sierpniu 2022 i jest nie do pogodzenia z Next 15+.
//
// Jedyna reguła pisana ręcznie dotyczy nagrań lektora. Reszta to domyślny
// zestaw Serwista — ten sam zakres co wcześniej: strony, obrazki, fonty,
// pliki statyczne.

import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  RangeRequestsPlugin,
  Serwist,
} from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

/**
 * Nagrania lektora są niezmienne — nazwa pliku zawiera skrót treści kroku,
 * więc zmiana polecenia daje nowy adres. Stąd CacheFirst i pół roku ważności:
 * jedna sesja dziecka to ~30 kroków, a domyślna reguła na audio trzyma 32
 * pliki przez dobę i po dwóch dniach bez zasięgu lektor by zamilkł.
 *
 * Wyłącznie status 200. Status 0 to odpowiedź nieprzejrzysta — gdyby tu
 * trafiał, 404 dla jeszcze niewygenerowanego nagrania zostałby zapisany jako
 * poprawny i nagranie wgrane później nigdy by nie zagrało. Element <audio>
 * w lib/lektor.ts ustawia crossOrigin='anonymous', więc status jest prawdziwy.
 */
const cacheLektora = {
  matcher: ({ url }: { url: URL }) => url.pathname.includes('/exercise-media/lektor/'),
  handler: new CacheFirst({
    cacheName: 'lektor-audio',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 180 * 24 * 60 * 60 }),
      new RangeRequestsPlugin(),
    ],
  }),
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Własna reguła przed domyślnymi — wygrywa pierwsze dopasowanie.
  runtimeCaching: [cacheLektora, ...defaultCache],
})

serwist.addEventListeners()
