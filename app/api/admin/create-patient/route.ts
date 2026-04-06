// app/api/admin/create-patient/route.ts
// Tworzy konto pacjenta przez service_role (pomija RLS)
// i od razu przypisuje go do logopedy

import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // Weryfikuj sesję logopedy
    const supabase  = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: therapistProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!therapistProfile || !['therapist', 'admin'].includes(therapistProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { full_name, email, password, date_of_birth, therapist_id } = await request.json()

    if (!full_name || !email || !password || password.length < 8) {
      return NextResponse.json({ error: 'Nieprawidłowe dane formularza.' }, { status: 400 })
    }

    // Logopeda może tworzyć tylko swoich pacjentów
    if (therapist_id !== user.id && therapistProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()

    // 1. Utwórz konto auth (service_role — pomija email confirm)
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,   // od razu zweryfikowane
      user_metadata: {
        role:      'patient',
        full_name,
      },
    })

    if (createError) {
      const msg = createError.message.includes('already registered')
        ? 'Ten email jest już zarejestrowany.'
        : createError.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const patientId = newUser.user.id

    // 2. Uzupełnij profil (trigger tworzy bazowy rekord, my go teraz aktualizujemy)
    await admin
      .from('profiles')
      .update({ date_of_birth: date_of_birth ?? null })
      .eq('id', patientId)

    // 3. Przypisz pacjenta do logopedy
    const { error: assignError } = await admin
      .from('therapist_patients')
      .insert({ therapist_id, patient_id: patientId })

    if (assignError) {
      // Spróbuj usunąć konto jeśli przypisanie się nie udało
      await admin.auth.admin.deleteUser(patientId)
      return NextResponse.json({ error: 'Błąd przypisania pacjenta.' }, { status: 500 })
    }

    return NextResponse.json({ patient_id: patientId })
  } catch (err) {
    console.error('[create-patient]', err)
    return NextResponse.json({ error: 'Błąd serwera.' }, { status: 500 })
  }
}
