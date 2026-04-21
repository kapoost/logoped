// app/api/logopeda/delete-patient/route.ts
// Usuwanie pacjenta — logopeda może usunąć własnego pacjenta

import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function DELETE(request: Request) {
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

    const { patient_id } = await request.json()
    if (!patient_id) return NextResponse.json({ error: 'Brak patient_id.' }, { status: 400 })

    // Sprawdź relację logopeda-pacjent
    if (profile.role === 'therapist') {
      const { data: relation } = await supabase
        .from('therapist_patients')
        .select('patient_id')
        .eq('therapist_id', user.id)
        .eq('patient_id', patient_id)
        .single()

      if (!relation) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(patient_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[delete-patient]', err)
    return NextResponse.json({ error: 'Błąd serwera.' }, { status: 500 })
  }
}
