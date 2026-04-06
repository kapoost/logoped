// app/api/admin/create-therapist/route.ts
import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { full_name, email, password } = await request.json()
  if (!full_name || !email || !password || password.length < 8) {
    return NextResponse.json({ error: 'Nieprawidłowe dane.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email, password,
    email_confirm: true,
    user_metadata: { role: 'therapist', full_name },
  })

  if (error) {
    const msg = error.message.includes('already registered') ? 'Ten email jest już zarejestrowany.' : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ therapist_id: data.user.id })
}
