// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const DASHBOARD: Record<string, string> = {
  admin:     '/admin',
  therapist: '/logopeda',
  patient:   '/pacjent/cwiczenia',
}

function baseUrl(request: NextRequest): string {
  // Fly.io proxy ustawia X-Forwarded-Host z prawdziwą domeną
  const host = request.headers.get('x-forwarded-host')
    ?? request.headers.get('host')
    ?? 'logoped.fly.dev'
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

export async function POST(request: NextRequest) {
  const form     = await request.formData()
  const email    = form.get('email')    as string
  const password = form.get('password') as string
  const isDemo   = form.get('isDemo')   === 'true'
  const base     = baseUrl(request)

  const cookieJar: Array<{ name: string; value: string; options: any }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cs) => cookieJar.push(...cs),
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const msg = error.message.toLowerCase().includes('invalid') ? 'invalid' : 'unknown'
    return NextResponse.redirect(`${base}/login?error=${msg}`, { status: 303 })
  }

  if (isDemo) {
    fetch(`${base}/api/demo/reset`, { method: 'POST' }).catch(() => {})
  }

  const { data: profile } = await supabase.from('profiles').select('role').single()
  const dest = DASHBOARD[profile?.role ?? ''] ?? '/pacjent/cwiczenia'

  const redirect = NextResponse.redirect(`${base}${dest}`, { status: 303 })
  cookieJar.forEach(({ name, value, options }) =>
    redirect.cookies.set(name, value, {
      ...options,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
  )
  return redirect
}
