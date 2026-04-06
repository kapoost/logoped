import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function base(req: NextRequest) {
  const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'logoped.fly.dev'
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

export async function POST(request: NextRequest) {
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

  await supabase.auth.signOut()

  const redirect = NextResponse.redirect(`${base(request)}/login`, { status: 303 })

  // Usuń wszystkie cookies sesji Supabase
  request.cookies.getAll()
    .filter(c => c.name.startsWith('sb-'))
    .forEach(c => redirect.cookies.delete(c.name))

  // Zapisz nowe (wyczyszczone) cookies od Supabase
  cookieJar.forEach(({ name, value, options }) =>
    redirect.cookies.set(name, value, { ...options, path: '/' })
  )

  return redirect
}
