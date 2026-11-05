'use client'
// components/patient/PasekGorny.tsx
// Imię dziecka + wylogowanie. Na ekranie ćwiczenia znika — tak jak dolna
// nawigacja — bo te 40 px są tam potrzebne poleceniu, a "Wyloguj" to ostatni
// przycisk, jaki dziecko ma w trakcie ćwiczenia zobaczyć.

import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/shared/LogoutButton'

export default function PasekGorny({ imie }: { imie: string }) {
  const pathname = usePathname()
  if (pathname.startsWith('/pacjent/cwiczenie/')) return null

  return (
    <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
      <span className="text-xs text-gray-400">{imie}</span>
      <LogoutButton className="text-xs text-gray-400 hover:text-red-500 transition" label="Wyloguj" />
    </div>
  )
}
