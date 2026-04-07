// app/logopeda/pacjenci/dodaj/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser, createClient } from '@/lib/supabase/server'
import AddPatientForm from './AddPatientForm'

export const metadata: Metadata = { title: 'Dodaj pacjenta' }

export default async function DodajPacjentaPage() {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = createClient()

  // Pobierz imiona istniejących pacjentów tego logopedy — do live walidacji duplikatów
  const { data: tp } = await supabase
    .from('therapist_patients')
    .select('profiles!therapist_patients_patient_id_fkey(full_name)')
    .eq('therapist_id', session.profile.id)

  const existingNames: string[] = (tp ?? [])
    .map((row: any) => row.profiles?.full_name ?? '')
    .filter(Boolean)

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
          <AddPatientForm
            therapistId={session.profile.id}
            existingNames={existingNames}
          />
        </div>
      </div>
    </div>
  )
}
