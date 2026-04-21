// app/api/logopeda/update-patient/route.ts
// Aktualizacja danych pacjenta (imię, data urodzenia, reset hasła)
// Dostępne dla logopedy (własny pacjent) i admina

import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

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

    const { patient_id, full_name, date_of_birth, new_password } = await request.json()
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

    // Aktualizuj profil
    if (full_name !== undefined || date_of_birth !== undefined) {
      const updates: Record<string, any> = {}
      if (full_name !== undefined) updates.full_name = full_name.trim()
      if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth || null

      const { error: updateError } = await admin
        .from('profiles')
        .update(updates)
        .eq('id', patient_id)

      if (updateError) {
        return NextResponse.json({ error: 'Błąd aktualizacji profilu.' }, { status: 500 })
      }

      // Aktualizuj user_metadata w auth jeśli zmieniono imię
      if (full_name !== undefined) {
        await admin.auth.admin.updateUserById(patient_id, {
          user_metadata: { full_name: full_name.trim() },
        })
      }
    }

    // Reset hasła
    if (new_password) {
      if (new_password.length < 8) {
        return NextResponse.json({ error: 'Hasło musi mieć minimum 8 znaków.' }, { status: 400 })
      }
      const { error: pwError } = await admin.auth.admin.updateUserById(patient_id, {
        password: new_password,
      })
      if (pwError) {
        return NextResponse.json({ error: 'Błąd zmiany hasła.' }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[update-patient]', err)
    return NextResponse.json({ error: 'Błąd serwera.' }, { status: 500 })
  }
}
