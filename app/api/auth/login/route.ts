// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const DASHBOARD: Record<string, string> = {
  admin:     '/admin',
  therapist: '/logopeda',
  patient:   '/pacjent/cwiczenia',
}

function baseUrl(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host')
    ?? request.headers.get('host')
    ?? 'logoped.fly.dev'
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

/** Login → email: jeśli brak @, dopisz @logoped.app */
function loginToEmail(login: string): string {
  return login.includes('@') ? login : `${login.toLowerCase().trim()}@logoped.app`
}

export async function POST(request: NextRequest) {
  const form         = await request.formData()
  const login        = form.get('login')    as string
  const password     = form.get('password') as string
  const isDemo       = form.get('isDemo')   === 'true'
  const redirectPath = (form.get('redirect') as string) || '/login'
  const base         = baseUrl(request)
  const email        = loginToEmail(login)

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

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const msg = error.message.toLowerCase().includes('invalid') ? 'invalid' : 'unknown'
    return NextResponse.redirect(`${base}${redirectPath}?error=${msg}`, { status: 303 })
  }

  if (isDemo) {
    fetch(`${base}/api/demo/reset`, { method: 'POST' }).catch(() => {})
  }

  // Użyj service role do odczytu roli — omija RLS
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()

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
