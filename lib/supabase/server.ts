// lib/supabase/server.ts
// Używany w Server Components, Route Handlers i Server Actions
// Czyta/zapisuje cookies przez next/headers

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll wywołane z Server Component — ignorujemy
            // Middleware odświeża sesję
          }
        },
      },
    }
  )
}

// Wersja z service_role — TYLKO dla operacji adminowych (server-side)
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Helper: pobierz aktualnego użytkownika + profil w jednym zapytaniu
// Rzuca błąd jeśli brak sesji (redirect do /login)
export async function getSessionUser() {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return { user, profile }
}
