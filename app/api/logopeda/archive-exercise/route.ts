// app/api/logopeda/archive-exercise/route.ts
// Logopeda wycofuje/przywraca WYŁĄCZNIE własne ćwiczenie.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { exercise_id, archived } = await request.json()
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

    const { error } = await supabase
      .from('exercises')
      .update(archived
        ? { archived_at: new Date().toISOString(), archived_by: user.id }
        : { archived_at: null, archived_by: null })
      .eq('id', exercise_id)

    if (error) {
      console.error('[archive-exercise]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, archived: !!archived })
  } catch (err) {
    console.error('[archive-exercise]', err)
    return NextResponse.json({ error: 'Błąd serwera.' }, { status: 500 })
  }
}
