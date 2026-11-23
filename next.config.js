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

module.exports = withSerwist(nextConfig)
