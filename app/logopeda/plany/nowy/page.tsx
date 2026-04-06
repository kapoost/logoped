// app/logopeda/plany/nowy/page.tsx
import { redirect } from 'next/navigation'
import { getSessionUser, createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import PlanBuilder from '@/components/therapist/PlanBuilder'

export const metadata: Metadata = { title: 'Nowy plan ćwiczeń' }

interface Props { searchParams: { pacjent?: string } }

export default async function NowyPlanPage({ searchParams }: Props) {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = createClient()

  const { data: patients } = await supabase
    .from('therapist_patient_overview')
    .select('patient_id, full_name')
    .eq('therapist_id', session.profile.id)

  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, title, category, difficulty, emoji, duration_seconds, target_sounds')
    .or(`is_public.eq.true,created_by.eq.${session.profile.id}`)
    .order('category')
    .order('title')

  const backHref = searchParams.pacjent
    ? `/logopeda/pacjenci/${searchParams.pacjent}`
    : '/logopeda/plany'

  const backLabel = searchParams.pacjent ? '← Pacjent' : '← Plany'

  return (
    <div className="animate-fade-in">
      <div className="bg-green-800 text-white px-5 pt-5 pb-8">
        <Link href={backHref} className="text-green-300 text-sm hover:text-white inline-block mb-3">
          {backLabel}
        </Link>
        <h1 className="text-xl font-bold">Nowy plan ćwiczeń</h1>
        <p className="text-green-300 text-sm mt-1">
          Wybierz pacjenta, dobierz ćwiczenia i zapisz plan
        </p>
      </div>
      <div className="px-4 -mt-4">
        <PlanBuilder
          patients={patients ?? []}
          exercises={exercises ?? []}
          therapistId={session.profile.id}
          preselectedPatientId={searchParams.pacjent}
        />
      </div>
    </div>
  )
}
