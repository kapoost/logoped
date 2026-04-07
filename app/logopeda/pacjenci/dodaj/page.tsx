// app/logopeda/pacjenci/dodaj/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/supabase/server'
import AddPatientForm from './AddPatientForm'

export const metadata: Metadata = { title: 'Dodaj pacjenta' }

export default async function DodajPacjentaPage() {
  // Pobierz sesję po stronie serwera — nie po stronie klienta!
  const session = await getSessionUser()
  if (!session) redirect('/login')

  return (
    <div className="animate-fade-in">
      <div className="bg-green-800 text-white px-5 pt-5 pb-8">
        <Link href="/logopeda/pacjenci" className="text-green-300 text-sm hover:text-white inline-block mb-3">
          ← Pacjenci
        </Link>
        <h1 className="text-xl font-bold">Dodaj pacjenta</h1>
        <p className="text-green-300 text-sm mt-1">
          Utwórz nowe konto pacjenta lub przypisz istniejące
        </p>
      </div>
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          {/* therapistId przekazany jako prop — nie pobierany w kliencie */}
          <AddPatientForm therapistId={session.profile.id} />
        </div>
      </div>
    </div>
  )
}
