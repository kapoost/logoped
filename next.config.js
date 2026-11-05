const domyslnyCache = require('next-pwa/cache')

// Nagrania lektora są niezmienne — nazwa pliku zawiera skrót treści, więc
// zmiana polecenia daje nowy adres. Domyślna reguła next-pwa na mp3 trzyma
// 32 pliki przez dobę, a jedna sesja dziecka to już ~30 kroków; po dwóch
// dniach bez zasięgu lektor by zamilkł. Stąd własny, pojemny cache przed
// regułami domyślnymi (wygrywa pierwsze dopasowanie).
const cacheLektora = {
  urlPattern: ({ url }) => url.pathname.includes('/exercise-media/lektor/'),
  handler: 'CacheFirst',
  options: {
    cacheName: 'lektor-audio',
    rangeRequests: true,
    cacheableResponse: { statuses: [0, 200] },
    expiration: { maxEntries: 500, maxAgeSeconds: 180 * 24 * 60 * 60 },
  },
}

/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [cacheLektora, ...domyslnyCache],
})

const nextConfig = {
  // Typy pilnowane na serio — `npm run typecheck` i build muszą być zielone
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Supabase edge functions cookies
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr'],
  },
}

module.exports = withPWA(nextConfig)
