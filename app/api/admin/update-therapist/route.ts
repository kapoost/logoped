// app/api/admin/update-therapist/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  const body = await req.json()
  const {
    id, full_name, organization, phone, notes,
    license_type, license_expires_at, max_patients,
    is_blocked, block_reason, new_password,
  } = body

  if (!id) return NextResponse.json({ error: 'Brak ID' }, { status: 400 })

  const admin = createAdminClient()

  // Aktualizuj profil
  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name,
      organization:        organization || null,
      phone:               phone || null,
      notes:               notes || null,
      license_type:        license_type || 'trial',
      license_expires_at:  license_expires_at || null,
      max_patients:        max_patients || 5,
      is_blocked:          is_blocked ?? false,
      block_reason:        is_blocked ? (block_reason || null) : null,
    })
    .eq('id', id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Opcjonalna zmiana hasła
  if (new_password && new_password.length >= 8) {
    const { error: pwError } = await admin.auth.admin.updateUserById(id, {
      password: new_password,
    })
    if (pwError) {
      return NextResponse.json({ error: 'Profil zapisany, ale błąd zmiany hasła: ' + pwError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
