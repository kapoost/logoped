import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function base(req: NextRequest) {
  const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'logoped.fly.dev'
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

export async function POST(request: NextRequest) {
  const redirect = NextResponse.redirect(`${base(request)}/login`, { status: 303 })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) =>
          redirect.cookies.set(name, value, { ...options, path: '/' })
        ),
      },
    }
  )

  await supabase.auth.signOut()

  // Dodatkowo wyczyść wszystkie cookies sesji Supabase
  request.cookies.getAll()
    .filter(c => c.name.startsWith('sb-'))
    .forEach(c => redirect.cookies.set(c.name, '', {
      maxAge: 0, path: '/', httpOnly: true, sameSite: 'lax'
    }))

  return redirect
}
