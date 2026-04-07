import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { patient_id, name, description, exercises, schedule } = await request.json()
  const { data: plan, error: planErr } = await supabase.from('exercise_plans')
    .insert({ therapist_id: user.id, patient_id, name, description }).select('id').single()
  if (planErr) return NextResponse.json({ error: planErr.message }, { status: 500 })
  if (exercises?.length) {
    const { error: exErr } = await supabase.from('plan_exercises').insert(
      exercises.map((ex: any, i: number) => ({
        plan_id: plan.id, exercise_id: ex.exercise_id,
        order_index: i, repetitions: ex.repetitions, notes: ex.notes ?? null,
      }))
    )
    if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 })
  }
  if (schedule) {
    await supabase.from('schedules').insert({
      plan_id: plan.id, days_of_week: schedule.days_of_week ?? [0,1,2,3,4,5,6],
      reminder_time: schedule.reminder_time ?? '18:00',
    })
  }
  return NextResponse.json({ plan_id: plan.id })
}
