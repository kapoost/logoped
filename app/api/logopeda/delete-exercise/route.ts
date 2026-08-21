// app/api/logopeda/delete-exercise/route.ts
// Twarde usunięcie własnego ćwiczenia — tylko jeśli nie jest użyte w żadnym planie.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getExerciseUsage, blockedDeleteMessage } from '@/lib/exercises/usage'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { exercise_id } = await request.json()
    if (!exercise_id) return NextResponse.json({ error: 'Brak ID' }, { status: 400 })

    const { data: owned } = await supabase
      .from('exercises')
      .select('created_by')
      .eq('id', exercise_id)
      .single()

    if (!owned) return NextResponse.json({ error: 'Nie znaleziono ćwiczenia.' }, { status: 404 })
    if (owned.created_by !== user.id) {
      return NextResponse.json({ error: 'To nie jest Twoje ćwiczenie.' }, { status: 403 })
    }

    // Liczone service rolem — RLS pokazałby logopedzie tylko jego plany
    const usage = await getExerciseUsage(exercise_id)
    if (!usage.canHardDelete) {
      return NextResponse.json({ error: blockedDeleteMessage(usage), usage }, { status: 409 })
    }

    const { error } = await supabase.from('exercises').delete().eq('id', exercise_id)
    if (error) {
      console.error('[delete-exercise]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[delete-exercise]', err)
    return NextResponse.json({ error: 'Błąd serwera.' }, { status: 500 })
  }
}
