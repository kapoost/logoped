// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'LogoPed',
    template: '%s — LogoPed',
  },
  description: 'Ćwiczenia logopedyczne dla dzieci i terapeutów',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LogoPed',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    title: 'LogoPed',
    description: 'Ćwiczenia logopedyczne dla dzieci',
    locale: 'pl_PL',
  },
}

export const viewport: Viewport = {
  themeColor: '#6C5CE7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-gray-50 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
