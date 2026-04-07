import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { plan_exercise_id } = await request.json()
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase.from('exercise_completions').insert({
    patient_id: user.id, plan_exercise_id, session_date: today,
  })
  if (error && !error.message.includes('unique')) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
