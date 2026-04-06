// app/auth/callback/route.ts
// Obsługuje redirect po kliknięciu linku weryfikacyjnego z emaila

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Pobierz rolę i przekieruj do odpowiedniego dashboardu
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .single()

      switch (profile?.role) {
        case 'admin':     return NextResponse.redirect(`${origin}/admin`)
        case 'therapist': return NextResponse.redirect(`${origin}/logopeda`)
        case 'patient':   return NextResponse.redirect(`${origin}/pacjent/cwiczenia`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
