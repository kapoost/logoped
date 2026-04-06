// app/api/demo/reset/route.ts
// Resetuje dzisiejsze wykonania dla konta demo
// Wywoływane automatycznie po każdym zalogowaniu jako Zosia

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const DEMO_EMAIL = 'demo@logoped.pl'

export async function POST() {
  const admin = createAdminClient()

  // Znajdź ID konta demo
  const { data: user } = await admin.auth.admin.listUsers()
  const demoUser = user?.users?.find(u => u.email === DEMO_EMAIL)
  if (!demoUser) {
    return NextResponse.json({ ok: false, error: 'Demo user not found' })
  }

  const patientId = demoUser.id
  const today = new Date().toISOString().slice(0, 10)

  // Usuń dzisiejsze wykonania — jutro historia zostaje
  const { error } = await admin
    .from('exercise_completions')
    .delete()
    .eq('patient_id', patientId)
    .eq('session_date', today)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message })
  }

  return NextResponse.json({ ok: true, reset: today })
}
