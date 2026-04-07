import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { plan_id, action, payload } = await request.json()
  const { data: plan } = await supabase.from('exercise_plans').select('therapist_id').eq('id', plan_id).single()
  if (!plan || plan.therapist_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (action === 'toggle_active') {
    await supabase.from('exercise_plans').update({ is_active: payload.is_active }).eq('id', plan_id)
  } else if (action === 'save_exercises') {
    const { toDelete, toUpdate, toInsert } = payload
    if (toDelete?.length) await supabase.from('plan_exercises').delete().in('id', toDelete)
    if (toUpdate?.length) await Promise.all(toUpdate.map((u: any) =>
      supabase.from('plan_exercises').update({ repetitions: u.repetitions, notes: u.notes }).eq('id', u.id)
    ))
    if (toInsert?.length) await supabase.from('plan_exercises').insert(toInsert)
  }
  return NextResponse.json({ ok: true })
}
