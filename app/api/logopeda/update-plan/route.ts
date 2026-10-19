import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type UpdateItem = { id: string; order_index?: number; repetitions?: number; notes?: string | null }
type InsertItem = { exercise_id: string; order_index?: number; repetitions?: number; notes?: string | null }

/** Wiersze planu w kształcie, którego oczekuje PlanEditForm. */
const PLAN_ROWS = 'id, order_index, repetitions, notes, exercises(id, title, emoji, category, difficulty, duration_seconds)'

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

    // Wstawiamy PRZED usuwaniem — to nie jest transakcja (trzy osobne wywołania
    // PostgREST), więc gdy insert padnie na FK albo CHECK repetitions, plan ma
    // nadal komplet ćwiczeń zamiast zostać okrojony w połowie zapisu.
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

    if (toUpdate?.length) {
      // Tylko pola faktycznie przysłane — inaczej brak `notes` w payloadzie
      // kasowałby notatkę logopedy, a brak order_index i tak nic nie robi.
      const results = await Promise.all(toUpdate.map(u => {
        const patch: Record<string, unknown> = {}
        if ('order_index' in u) patch.order_index = u.order_index
        if ('repetitions' in u) patch.repetitions = u.repetitions
        if ('notes'       in u) patch.notes       = u.notes ?? null
        return supabase.from('plan_exercises')
          .update(patch)
          .eq('id', u.id)
          .eq('plan_id', plan_id)   // nie pozwól adresować wierszy z innego planu
      }))
      const failed = results.find(r => r.error)
      if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 })
    }

    if (toDelete?.length) {
      const { error } = await supabase
        .from('plan_exercises')
        .delete()
        .in('id', toDelete)
        .eq('plan_id', plan_id)     // jw. — id samo w sobie nie dowodzi, że to ten plan
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    return NextResponse.json({ error: `Nieznana akcja: ${action}` }, { status: 400 })
  }

  // Zwracamy stan po zapisie, żeby klient odtworzył listę z bazy zamiast trzymać
  // własne pozycje `new-…` — inaczej drugi zapis wstawiłby je po raz kolejny.
  const { data: items } = await supabase
    .from('plan_exercises')
    .select(PLAN_ROWS)
    .eq('plan_id', plan_id)
    .order('order_index')

  return NextResponse.json({ ok: true, items: items ?? [] })
}
