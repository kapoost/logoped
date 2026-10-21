'use client'
import { usePathname } from 'next/navigation'

/**
 * Oprawa ekranów wejściowych, różna dla dziecka i dla dorosłego.
 *
 * Dotąd logowanie dziecka i logopedy miało DOKŁADNIE tę samą oprawę: ta sama
 * papuga, ten sam fioletowy gradient, ta sama karta — różnił je tylko nagłówek.
 * Logopeda wchodzący na telefonie nie miał jak poznać, że jest na złym ekranie,
 * dopóki nie zobaczył pola „Login" zamiast „E-mail".
 *
 * Dziecko dostaje oprawę zabawową, dorosły spokojną. Ten sam produkt, dwa
 * wyraźnie różne progi wejścia.
 */
export default function AuthChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Reset hasła i rejestracja są dla logopedów, nie dla dzieci.
  const dlaDziecka = pathname === '/login'

  if (dlaDziecka) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 flex items-center justify-center p-4">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full" />

        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-7xl mb-3 inline-block animate-wiggle">🦜</div>
            <h1 className="text-3xl font-bold text-white">LogoPed</h1>
            <p className="text-brand-200 text-sm mt-1">Ćwiczenia logopedyczne dla dzieci</p>
          </div>
          <div className="bg-white rounded-3xl shadow-2xl p-8">{children}</div>
        </div>
      </div>
    )
  }

  // Wariant zawodowy: bez gradientu, bez animacji, bez ozdobników. Logotyp
  // mały i tekstowy — to ma wyglądać na narzędzie pracy, nie na zabawę.
  return (
    <div className="min-h-screen bg-sand flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl" aria-hidden>🦜</span>
          <div>
            <p className="font-bold text-gray-900 leading-tight">LogoPed</p>
            <p className="text-xs text-gray-500 leading-tight">panel specjalisty</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7">{children}</div>
      </div>
    </div>
  )
}
