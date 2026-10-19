import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type UpdateItem = { id: string; order_index?: number; repetitions?: number; notes?: string | null }
type InsertItem = { exercise_id: string; order_index?: number; repetitions?: number; notes?: string | null }

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { plan_id, action, payload } = await request.json()
  const { data: plan } = await supabase.from('exercise_plans').select('therapist_id').eq('id', plan_id).single()
  if (!plan || plan.therapist_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (action === 'toggle_active') {
    const { error } = await supabase
      .from('exercise_plans')
      .update({ is_active: payload.is_active })
      .eq('id', plan_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (action === 'save_exercises') {
    const { toDelete, toUpdate, toInsert } = payload as {
      toDelete?: string[]
      toUpdate?: UpdateItem[]
      toInsert?: InsertItem[]
    }

    if (toDelete?.length) {
      const { error } = await supabase.from('plan_exercises').delete().in('id', toDelete)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (toUpdate?.length) {
      // order_index też — kolejność ustawiona strzałkami w UI musi trafić do bazy
      const results = await Promise.all(toUpdate.map(u =>
        supabase.from('plan_exercises').update({
          order_index: u.order_index,
          repetitions: u.repetitions,
          notes:       u.notes ?? null,
        }).eq('id', u.id)
      ))
      const failed = results.find(r => r.error)
      if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 })
    }

    if (toInsert?.length) {
      // plan_id bierzemy ze sprawdzonego parametru, nie z wiersza od klienta
      const rows = toInsert.map(i => ({
        plan_id,
        exercise_id: i.exercise_id,
        order_index: i.order_index,
        repetitions: i.repetitions,
        notes:       i.notes ?? null,
      }))
      const { error } = await supabase.from('plan_exercises').insert(rows)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    return NextResponse.json({ error: `Nieznana akcja: ${action}` }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
