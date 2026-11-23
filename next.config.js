const withSerwist = require('@serwist/next').default({
  // Reguły cache'owania (w tym nagrania lektora) siedzą w app/sw.ts —
  // Serwist kompiluje ten plik do public/sw.js przy buildzie.
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: false,
})

const nextConfig = {
  // Typy pilnowane na serio — `npm run typecheck` i build muszą być zielone
  typescript: { ignoreBuildErrors: false },
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
  // W Next 15 opcja wyszła z experimental pod nową nazwą.
  serverExternalPackages: ['@supabase/ssr'],
}

module.exports = withSerwist(nextConfig)
