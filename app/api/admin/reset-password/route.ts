// app/api/admin/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Brak emaila' }, { status: 400 })

  const admin = createAdminClient()

  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/logopeda/reset-password`,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
