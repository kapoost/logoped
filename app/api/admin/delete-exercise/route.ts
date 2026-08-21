// app/api/admin/delete-exercise/route.ts
// Twarde usunięcie — tylko dla ćwiczeń nieużywanych w żadnym planie.
// Użyte mają ON DELETE RESTRICT na plan_exercises; dla nich jest archiwizacja.

import { NextResponse } from 'next/server'
import { getSessionUser, createAdminClient } from '@/lib/supabase/server'
import { getExerciseUsage, blockedDeleteMessage } from '@/lib/exercises/usage'

export async function POST(request: Request) {
  const session = await getSessionUser()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  const { exercise_id } = await request.json()
  if (!exercise_id) return NextResponse.json({ error: 'Brak ID' }, { status: 400 })

  const usage = await getExerciseUsage(exercise_id)
  if (!usage.canHardDelete) {
    return NextResponse.json({ error: blockedDeleteMessage(usage), usage }, { status: 409 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('exercises').delete().eq('id', exercise_id)
  if (error) {
    console.error('[delete-exercise]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
