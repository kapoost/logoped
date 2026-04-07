// app/(pacjent)/cwiczenia/page.tsx
import { redirect } from 'next/navigation'
import { getSessionUser, createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import TodayHeader from '@/components/patient/TodayHeader'
import ExerciseList from '@/components/patient/ExerciseList'
import EmptyState from '@/components/patient/EmptyState'

export const metadata: Metadata = { title: 'Ćwiczenia na dziś' }
export const revalidate = 0  // zawsze świeże dane

export default async function CwiczeniaPage() {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = createClient()
  const userId   = session.profile.id

  // Ćwiczenia na dziś z widoku today_exercises (005_views.sql)
  const { data: exercises } = await supabase
    .from('today_exercises')
    .select('*')
    .eq('patient_id', userId)
    .order('order_index')

  // Statystyki pacjenta do nagłówka
  const { data: stats } = await supabase
    .from('patient_stats')
    .select('*')
    .eq('patient_id', userId)
    .single()

  const done  = exercises?.filter(e => e.completed_today).length ?? 0
  const total = exercises?.length ?? 0

  return (
    <div className="animate-fade-in">
      {/* Nagłówek z serią i postępem */}
      <TodayHeader
        name={session.profile.full_name.split(' ')[0]}
        streak={stats?.current_streak ?? 0}
        done={done}
        total={total}
        patientId={userId}
        dbPoints={stats?.points ?? 0}
        dbLevel={stats?.level ?? 1}
        dbStreak={stats?.current_streak ?? 0}
        dbTotalExercises={stats?.total_exercises ?? 0}
      />

      {/* Lista ćwiczeń */}
      <div className="px-4 py-4 space-y-3">
        {total === 0 ? (
          <EmptyState />
        ) : (
          <ExerciseList exercises={exercises ?? []} />
        )}
      </div>
    </div>
  )
}
