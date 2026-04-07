'use client'
// components/therapist/TherapistNav.tsx

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const NAV = [
  { href: '/logopeda/pacjenci',  emoji: '👥', label: 'Pacjenci'   },
  { href: '/logopeda/cwiczenia', emoji: '📚', label: 'Ćwiczenia'  },
  { href: '/logopeda/plany',     emoji: '📋', label: 'Plany'      },
] as const

export default function TherapistNav({ name }: { name: string }) {
  const pathname = usePathname()
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      {/* Górna belka */}
      <header className="bg-green-800 text-white px-5 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-xl">🦜</span>
          <span className="font-bold text-lg">LogoPed</span>
          <span className="text-green-400 text-xs hidden sm:block">Panel logopedy</span>
        </div>
        <div className="flex items-center gap-3">
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-green-300 hover:text-white text-xs border border-green-600 hover:border-green-400 px-3 py-1 rounded transition">
              Wyloguj
            </button>
          </form>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
            {initials}
          </div>
        </div>
      </header>

      {/* Dolna nawigacja */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-gray-100 safe-bottom z-50">
        <div className="flex">
          {NAV.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all',
                  active ? 'text-green-700' : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <span className={clsx('text-[22px] leading-none', active && 'scale-110 inline-block')}>
                  {item.emoji}
                </span>
                <span className={clsx('text-[10px] font-medium', active ? 'text-green-700' : 'text-gray-400')}>
                  {item.label}
                </span>
              </Link>
            )
          })}
          <Link
            href="/logopeda/plany/nowy"
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-green-700"
          >
            <span className="text-[22px] leading-none">➕</span>
            <span className="text-[10px] font-medium text-green-700">Nowy plan</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
