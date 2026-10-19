import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DASHBOARD: Record<string, string> = {
  admin:     '/admin',
  therapist: '/logopeda',
  patient:   '/pacjent/cwiczenia',
}

function baseUrl(request: NextRequest): string {
  const host  = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'logoped.fly.dev'
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

export async function POST(request: NextRequest) {
  const form  = await request.formData()
  const haslo = String(form.get('password') ?? '')
  const haslo2 = String(form.get('password2') ?? '')
  const base  = baseUrl(request)

  // Ten sam próg co przy resecie z panelu admina — inaczej te same konta mają
  // dwa różne wymagania w zależności od drogi.
  if (haslo.length < 8)  return NextResponse.redirect(`${base}/haslo/nowe?error=krotkie`, { status: 303 })
  if (haslo !== haslo2)  return NextResponse.redirect(`${base}/haslo/nowe?error=rozne`,   { status: 303 })

  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.redirect(`${base}/login/reset?error=link`, { status: 303 })
  }

  const { error } = await supabase.auth.updateUser({ password: haslo })
  if (error) {
    // Supabase odrzuca hasło identyczne z obecnym — bez własnego komunikatu
    // użytkownik widziałby „nie udało się" i nie wiedziałby dlaczego.
    const kod = (error as { code?: string }).code === 'same_password' ? 'takie_samo' : 'nieudane'
    return NextResponse.redirect(`${base}/haslo/nowe?error=${kod}`, { status: 303 })
  }

  // Po zmianie hasła użytkownik ma już ważną sesję — prowadzimy go prosto
  // do jego panelu, zamiast kazać logować się jeszcze raz.
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const cel = DASHBOARD[profile?.role ?? ''] ?? '/login'
  return NextResponse.redirect(`${base}${cel}`, { status: 303 })
}
