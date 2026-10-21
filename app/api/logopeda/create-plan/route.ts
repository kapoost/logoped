import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { patient_id, name, description, exercises, schedule, publish } = await request.json()
  const { data: plan, error: planErr } = await supabase.from('exercise_plans')
    // Plan powstaje ZAWSZE jako roboczy. Wstawienie od razu opublikowanego
    // łamałoby ograniczenie z migracji 015, gdy pacjent ma już żywy plan —
    // publikacja to osobny krok, który najpierw zwalnia miejsce.
    .insert({ therapist_id: user.id, patient_id, name, description, published_at: null })
    .select('id').single()
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
  // Publikacja dopiero teraz, gdy plan ma już komplet ćwiczeń i harmonogram.
  // Ta sama funkcja co przy edycji — zwalnia miejsce po poprzednim żywym
  // planie i publikuje w jednej transakcji.
  if (publish) {
    const { error: pubErr } = await supabase.rpc('publikuj_plan', {
      p_plan_id: plan.id,
      p_publish: true,
    })
    // Plan jest już zapisany, więc nieudana publikacja nie jest utratą pracy —
    // zostaje roboczy i logopeda może opublikować go z ekranu edycji.
    if (pubErr) {
      return NextResponse.json(
        { plan_id: plan.id, warning: `Plan zapisano jako roboczy — publikacja nie powiodła się: ${pubErr.message}` },
        { status: 200 },
      )
    }
  }

  return NextResponse.json({ plan_id: plan.id })
}
