// app/api/admin/archive-exercise/route.ts
// Wycofanie ćwiczenia z obiegu i przywrócenie. Admin — dowolne ćwiczenie.

import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  const { exercise_id, archived } = await req.json()
  if (!exercise_id) return NextResponse.json({ error: 'Brak ID' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('exercises')
    .update(archived
      ? { archived_at: new Date().toISOString(), archived_by: session.profile.id }
      : { archived_at: null, archived_by: null })
    .eq('id', exercise_id)

  if (error) {
    console.error('[archive-exercise]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, archived: !!archived })
}
