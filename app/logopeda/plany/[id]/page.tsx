// app/(logopeda)/plany/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { getSessionUser, createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import PlanEditForm from './PlanEditForm'

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase.from('exercise_plans').select('name').eq('id', params.id).single()
  return { title: data?.name ?? 'Edytuj plan' }
}

export const revalidate = 0

export default async function PlanDetailPage({ params }: Props) {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = createClient()

  const { data: plan } = await supabase
    .from('exercise_plans')
    .select(`
      *,
      plan_exercises (
        id, order_index, repetitions, notes,
        exercises ( id, title, emoji, category, difficulty, duration_seconds )
      ),
      schedules ( id, days_of_week, reminder_time, is_active ),
      profiles!patient_id ( full_name )
    `)
    .eq('id', params.id)
    .eq('therapist_id', session.profile.id)
    .single()

  if (!plan) notFound()

  const patientName  = (plan as any).profiles?.full_name ?? 'Pacjent'
  const planExercises = ((plan as any).plan_exercises ?? [])
    .sort((a: any, b: any) => a.order_index - b.order_index)
  const schedule     = (plan as any).schedules?.[0] ?? null

  // Pobierz dostępne ćwiczenia do ewentualnego dodania
  const { data: allExercises } = await supabase
    .from('exercises')
    .select('id, title, emoji, category, difficulty, duration_seconds, target_sounds')
    .or(`is_public.eq.true,created_by.eq.${session.profile.id}`)
    .order('category').order('title')

  const DAYS = ['Pn','Wt','Śr','Cz','Pt','So','Nd']

  return (
    <div className="animate-fade-in">
      <div className="bg-green-800 text-white px-5 pt-5 pb-8">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href={`/logopeda/pacjenci/${(plan as any).patient_id}`}
            className="text-green-300 text-sm hover:text-white"
          >
            ← {patientName}
          </Link>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{plan.name}</h1>
            {plan.description && (
              <p className="text-green-300 text-sm mt-1">{plan.description}</p>
            )}
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${
            plan.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
          }`}>
            {plan.is_active ? 'Aktywny' : 'Nieaktywny'}
          </span>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Harmonogram (read-only summary) */}
        {schedule && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800 text-sm">📅 Harmonogram</h2>
            </div>
            <div className="flex gap-1 mb-2">
              {DAYS.map((d, i) => (
                <div
                  key={d}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center ${
                    schedule.days_of_week.includes(i)
                      ? 'bg-green-700 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              🔔 Przypomnienie: <strong>{schedule.reminder_time.slice(0, 5)}</strong>
            </p>
          </div>
        )}

        {/* Edytowalny plan ćwiczeń */}
        <PlanEditForm
          planId={params.id}
          initialItems={planExercises}
          allExercises={allExercises ?? []}
          isActive={plan.is_active}
          patientId={(plan as any).patient_id}
        />
      </div>
    </div>
  )
}
