// app/logopeda/pacjenci/[id]/edytuj/page.tsx
import { notFound, redirect } from 'next/navigation'
import { getSessionUser, createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import EditPatientForm from './EditPatientForm'

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase.from('profiles').select('full_name').eq('id', params.id).single()
  return { title: data ? `Edytuj — ${data.full_name}` : 'Edytuj pacjenta' }
}

export const revalidate = 0

export default async function EditPatientPage({ params }: Props) {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = createClient()

  // Sprawdź relację logopeda-pacjent
  const { data: relation } = await supabase
    .from('therapist_patients')
    .select('patient_id')
    .eq('therapist_id', session.profile.id)
    .eq('patient_id', params.id)
    .single()

  if (!relation && session.profile.role !== 'admin') notFound()

  // Pobierz dane pacjenta + login (email z auth)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, date_of_birth')
    .eq('id', params.id)
    .single()

  if (!profile) notFound()

  // Pobierz istniejące imiona (do walidacji duplikatów, bez bieżącego pacjenta)
  const { data: otherPatients } = await supabase
    .from('therapist_patients')
    .select('profiles!therapist_patients_patient_id_fkey(full_name)')
    .eq('therapist_id', session.profile.id)
    .neq('patient_id', params.id)

  const existingNames = (otherPatients ?? []).map((r: any) => r.profiles?.full_name ?? '').filter(Boolean)

  return (
    <div className="animate-fade-in">
      <div className="bg-green-800 text-white px-5 pt-5 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/logopeda/pacjenci/${params.id}`} className="text-green-300 text-sm hover:text-white">
            ← {profile.full_name}
          </Link>
        </div>
        <h1 className="text-xl font-bold">Edytuj pacjenta</h1>
      </div>

      <div className="px-4 -mt-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <EditPatientForm
            patientId={profile.id}
            initialName={profile.full_name}
            initialBirthDate={profile.date_of_birth ?? ''}
            existingNames={existingNames}
          />
        </div>
      </div>
    </div>
  )
}
