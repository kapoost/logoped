// app/api/admin/create-patient/route.ts
// Tworzy konto pacjenta przez service_role (pomija RLS)
// i od razu przypisuje go do logopedy

import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { loginToEmail, validateLogin } from '@/lib/login'

/** Surowe błędy GoTrue → komunikat dla logopedy */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Ten login jest już zajęty. Wybierz inny.'
  if (m.includes('validate email'))
    return 'Login może zawierać tylko litery (bez polskich znaków), cyfry, kropkę, podkreślnik i myślnik.'
  if (m.includes('password'))
    return 'Hasło jest za słabe — użyj co najmniej 8 znaków.'
  return 'Nie udało się utworzyć konta. Spróbuj ponownie.'
}

export async function POST(request: Request) {
  try {
    // Weryfikuj sesję logopedy
    const supabase  = await createClient()
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

    const { full_name, email: rawLogin, password, date_of_birth, therapist_id } = await request.json()

    if (!full_name?.trim()) {
      return NextResponse.json({ error: 'Podaj imię dziecka.' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Hasło musi mieć minimum 8 znaków.' }, { status: 400 })
    }

    // Login → email (ta sama normalizacja co przy logowaniu, inaczej dziecko się nie zaloguje)
    const loginError = validateLogin(rawLogin ?? '')
    if (loginError) {
      return NextResponse.json({ error: loginError }, { status: 400 })
    }
    const email = loginToEmail(rawLogin)

    // Sprawdź unikalność imienia pacjenta dla tego logopedy
    const { data: existingPatients } = await supabase
      .from('therapist_patients')
      .select('patient_id, profiles!therapist_patients_patient_id_fkey(full_name)')
      .eq('therapist_id', therapist_id)

    if (existingPatients) {
      const nameTaken = existingPatients.some((row: any) => {
        const name = row.profiles?.full_name ?? ''
        return name.trim().toLowerCase() === full_name.trim().toLowerCase()
      })
      if (nameTaken) {
        return NextResponse.json(
          { error: `Masz już pacjenta o imieniu "${full_name}". Podaj inne imię lub dodaj nazwisko, żeby odróżnić pacjentów.` },
          { status: 409 }
        )
      }
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
      console.error('[create-patient] createUser', createError.message)
      return NextResponse.json(
        { error: friendlyAuthError(createError.message) },
        { status: 400 }
      )
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

    return NextResponse.json({ patient_id: patientId, login: email.endsWith('@logoped.app') ? email.split('@')[0] : email })
  } catch (err) {
    console.error('[create-patient]', err)
    return NextResponse.json({ error: 'Błąd serwera.' }, { status: 500 })
  }
}
