import { NextRequest, NextResponse } from 'next/server'

function base(req: NextRequest) {
  const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'logoped.fly.dev'
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

export async function POST(request: NextRequest) {
  const redirect = NextResponse.redirect(`${base(request)}/login`, { status: 303 })

  // Wyczyść wszystkie cookies Supabase bezpośrednio
  request.cookies.getAll().forEach(cookie => {
    if (
      cookie.name.startsWith('sb-') ||
      cookie.name.includes('supabase') ||
      cookie.name.includes('auth-token')
    ) {
      redirect.cookies.set(cookie.name, '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      })
    }
  })

  return redirect
}
