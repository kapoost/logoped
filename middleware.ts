// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

const PUBLIC_ROUTES       = ['/', '/login', '/register', '/auth/callback', '/auth/error']
const PUBLIC_API_PREFIXES = ['/api/push/', '/api/health', '/api/auth/', '/api/demo/']

const ROLE_ROUTES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: '/admin',    roles: ['admin'] },
  { prefix: '/logopeda', roles: ['therapist', 'admin'] },
  { prefix: '/pacjent',  roles: ['patient', 'admin'] },
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // API z własną auth — przepuść
  if (PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Strony publiczne
  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    if (user && (pathname === '/login' || pathname === '/register')) {
      const profile = await getProfile(supabase, user.id)
      return NextResponse.redirect(new URL(getDashboard(profile?.role), request.url))
    }
    return supabaseResponse
  }

  // Niezalogowany → /login (bez ?redirect= w URL)
  if (!user) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    // Zapisz cel w cookie — nie w URL
    response.cookies.set('logoped_redirect', pathname, {
      httpOnly: true, sameSite: 'lax', maxAge: 300, path: '/'
    })
    return response
  }

  // Sprawdź rolę
  const matchedRoute = ROLE_ROUTES.find(r => pathname.startsWith(r.prefix))
  if (matchedRoute) {
    const profile = await getProfile(supabase, user.id)
    if (!matchedRoute.roles.includes(profile?.role ?? '')) {
      return NextResponse.redirect(new URL(getDashboard(profile?.role), request.url))
    }
  }

  return supabaseResponse
}

async function getProfile(supabase: ReturnType<typeof createServerClient>, userId: string) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
  return data
}

function getDashboard(role: string | undefined | null): string {
  switch (role) {
    case 'admin':     return '/admin'
    case 'therapist': return '/logopeda'
    case 'patient':   return '/pacjent/cwiczenia'
    default:          return '/login'
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css)$).*)',
  ],
}
