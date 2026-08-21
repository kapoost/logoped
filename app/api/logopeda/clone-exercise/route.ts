// app/api/logopeda/clone-exercise/route.ts
// Kopiuje cudze (lub publiczne) ćwiczenie na własne, prywatne — do przerobienia po swojemu.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['therapist', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { exercise_id } = await request.json()
    if (!exercise_id) return NextResponse.json({ error: 'Brak ID' }, { status: 400 })

    // RLS przepuści tylko to, co logopeda i tak widzi (publiczne albo własne)
    const { data: src } = await supabase
      .from('exercises')
      .select('title, description, instructions, category, difficulty, target_sounds, media_url, duration_seconds, emoji')
      .eq('id', exercise_id)
      .single()

    if (!src) return NextResponse.json({ error: 'Nie znaleziono ćwiczenia.' }, { status: 404 })

    const { data, error } = await supabase.from('exercises').insert({
      ...src,
      title:      `${src.title} (moja wersja)`,
      created_by: user.id,
      is_public:  false,
    }).select('id').single()

    if (error) {
      console.error('[clone-exercise]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ exercise_id: data.id })
  } catch (err) {
    console.error('[clone-exercise]', err)
    return NextResponse.json({ error: 'Błąd serwera.' }, { status: 500 })
  }
}
