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
    await supabase.auth.signOut()
  } catch (_) {}

  return redirect
}
