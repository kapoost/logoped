// app/api/admin/update-exercise/route.ts
// Edycja ćwiczenia z panelu admina — publicznego (created_by = NULL) i prywatnego logopedy.

import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  const body = await req.json()
  const { exercise_id, title, description, instructions, category, difficulty,
          emoji, target_sounds, duration_seconds, is_public } = body

  if (!exercise_id) return NextResponse.json({ error: 'Brak ID' }, { status: 400 })
  if (!title?.trim() || !instructions?.trim()) {
    return NextResponse.json({ error: 'Nazwa i instrukcja są wymagane.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // created_by celowo nietknięte — edycja nie przejmuje cudzego ćwiczenia
  const { error } = await admin
    .from('exercises')
    .update({
      title:            title.trim(),
      description:      description?.trim() || null,
      instructions:     instructions.trim(),
      category,
      difficulty,
      emoji:            emoji || '👅',
      target_sounds:    target_sounds?.length ? target_sounds : null,
      duration_seconds: duration_seconds || 60,
      is_public:        is_public ?? true,
    })
    .eq('id', exercise_id)

  if (error) {
    console.error('[update-exercise]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
