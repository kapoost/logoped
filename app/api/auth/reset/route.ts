import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function baseUrl(request: NextRequest): string {
  const host  = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'logoped.fly.dev'
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

export async function POST(request: NextRequest) {
  const form  = await request.formData()
  const email = String(form.get('email') ?? '').trim()
  const base  = baseUrl(request)

  // Odpowiedź jest zawsze taka sama, niezależnie od tego, czy konto istnieje —
  // inaczej formularz staje się wyszukiwarką adresów zarejestrowanych w systemie.
  const sukces = NextResponse.redirect(`${base}/login/reset?sent=1`, { status: 303 })
  if (!email) return sukces

  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/callback?next=/haslo/nowe`,
  })

  // Jedyny wyjątek: limit wysyłki. Milczenie zostawiłoby użytkownika czekającego
  // na maila, który nigdy nie przyjdzie.
  if (error?.status === 429) {
    return NextResponse.redirect(`${base}/login/reset?error=limit`, { status: 303 })
  }

  return sukces
}
