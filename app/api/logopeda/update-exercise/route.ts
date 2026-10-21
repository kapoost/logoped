// app/api/logopeda/update-exercise/route.ts
// Logopeda edytuje WYŁĄCZNIE własne ćwiczenie (created_by = jego id).

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { exercise_id, title, description, description_child, instructions, category, difficulty,
            emoji, target_sounds, duration_seconds, is_public } = body

    if (!exercise_id) return NextResponse.json({ error: 'Brak ID' }, { status: 400 })
    if (!title?.trim() || !instructions?.trim()) {
      return NextResponse.json({ error: 'Nazwa i instrukcja są wymagane.' }, { status: 400 })
    }

    // Sprawdź własność wprost — RLS na UPDATE dałby ciche 0 zmienionych wierszy
    const { data: owned } = await supabase
      .from('exercises')
      .select('created_by')
      .eq('id', exercise_id)
      .single()

    if (!owned) return NextResponse.json({ error: 'Nie znaleziono ćwiczenia.' }, { status: 404 })
    if (owned.created_by !== user.id) {
      return NextResponse.json({ error: 'To nie jest Twoje ćwiczenie. Sklonuj je, żeby zmienić po swojemu.' }, { status: 403 })
    }

    const { error } = await supabase.from('exercises').update({
      title:            title.trim(),
      description:      description?.trim() || null,
      description_child: description_child?.trim() || null,
      instructions:     instructions.trim(),
      category,
      difficulty,
      emoji:            emoji || '👅',
      target_sounds:    target_sounds?.length ? target_sounds : null,
      duration_seconds: duration_seconds || 60,
      is_public:        is_public ?? false,
    }).eq('id', exercise_id)

    if (error) {
      console.error('[update-exercise]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[update-exercise]', err)
    return NextResponse.json({ error: 'Błąd serwera.' }, { status: 500 })
  }
}
