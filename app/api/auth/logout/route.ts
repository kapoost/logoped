import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function base(req: NextRequest) {
  const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'logoped.fly.dev'
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

export async function POST(request: NextRequest) {
  const redirect = NextResponse.redirect(`${base(request)}/login`, { status: 303 })

  // Znajdź wszystkie cookies Supabase i usuń je
  const allCookies = request.cookies.getAll()
  allCookies.forEach(cookie => {
    redirect.cookies.set(cookie.name, '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
  })

  // Wywołaj signOut przez Supabase SSR (opcjonalnie — może failować gdy cookie już wyczyszczone)
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => allCookies,
          setAll: () => {},
        },
      }
    )
    // scope: 'local' — domyślny 'global' unieważnia wszystkie sesje użytkownika,
    // więc wylogowanie na telefonie wywalało logopedę z komputera (i rozsypywało
    // zestaw E2E, bo projekt `integration` ubijał sesję projektowi `admin`).
    await supabase.auth.signOut({ scope: 'local' })
  } catch (_) {}

  return redirect
}
