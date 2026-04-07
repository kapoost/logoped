// app/(pacjent)/cwiczenie/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { getSessionUser, createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import ExerciseView from '@/components/patient/ExerciseView'

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase  = createClient()
  const { data }  = await supabase
    .from('plan_exercises')
    .select('exercises(title)')
    .eq('id', params.id)
    .single()
  const title = (data?.exercises as any)?.title ?? 'Ćwiczenie'
  return { title }
}

export const revalidate = 0

export default async function CwiczeniePage({ params }: Props) {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = createClient()

  // Pobierz pełne dane ćwiczenia z planu
  const { data } = await supabase
    .from('today_exercises')
    .select('*')
    .eq('patient_id', session.profile.id)
    .eq('plan_exercise_id', params.id)
    .single()

  if (!data) notFound()

  // Znajdź następne ćwiczenie (do przycisku "Następne")
  const { data: allExercises } = await supabase
    .from('today_exercises')
    .select('plan_exercise_id, order_index, completed_today')
    .eq('patient_id', session.profile.id)
    .order('order_index')

  const currentIdx = allExercises?.findIndex(e => e.plan_exercise_id === params.id) ?? -1
  const nextExercise = allExercises?.find(
    (e, i) => i > currentIdx && !e.completed_today
  ) ?? null

  const isLastExercise = !nextExercise &&
    (allExercises?.filter(e => !e.completed_today).length ?? 0) <= 1

  return (
    <ExerciseView
      exercise={data}
      nextId={nextExercise?.plan_exercise_id ?? null}
      patientId={session.profile.id}
      isLastExercise={isLastExercise}
    />
  )
}
