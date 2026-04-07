// app/api/logopeda/create-exercise/route.ts
// Tworzy ćwiczenie logopedy — po stronie serwera (widzi sesję httpOnly)

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

    const body = await request.json()
    const { title, description, instructions, category, difficulty, emoji,
            target_sounds, duration_seconds, is_public } = body

    if (!title?.trim() || !instructions?.trim()) {
      return NextResponse.json({ error: 'Nazwa i instrukcja są wymagane.' }, { status: 400 })
    }

    const isAdmin = profile.role === 'admin'

    const { data, error } = await supabase.from('exercises').insert({
      title:            title.trim(),
      description:      description?.trim() || null,
      instructions:     instructions.trim(),
      category,
      difficulty,
      emoji:            emoji || '👅',
      target_sounds:    target_sounds?.length ? target_sounds : null,
      duration_seconds: duration_seconds || 60,
      created_by:       isAdmin ? null : user.id,
      is_public:        isAdmin ? true : (is_public ?? false),
    }).select('id').single()

    if (error) {
      console.error('[create-exercise]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ exercise_id: data.id })
  } catch (err) {
    console.error('[create-exercise]', err)
    return NextResponse.json({ error: 'Błąd serwera.' }, { status: 500 })
  }
}
