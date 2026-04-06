import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.updateUserById(
    'fb57af1e-8bd7-4a1a-a8de-488874d1ec4b',
    { password: 'Demo2026!', email_confirm: true }
  )
  return NextResponse.json({ ok: !error, email: data?.user?.email, error: error?.message })
}
