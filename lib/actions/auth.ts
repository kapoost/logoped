'use server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function signOut() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)),
      },
    }
  )
  await supabase.auth.signOut()
  redirect('/login')
}

export async function signIn(_: unknown, formData: FormData) {
  const email    = formData.get('email')    as string
  const password = formData.get('password') as string
  const isDemo   = formData.get('isDemo')   === 'true'

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)),
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return {
      error: error.message.toLowerCase().includes('invalid')
        ? 'Nieprawidłowy email lub hasło.'
        : 'Wystąpił błąd. Spróbuj ponownie.'
    }
  }

  // Pobierz rolę — sesja już jest w cookies po stronie serwera
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .single()

  // Reset ćwiczeń demo — wywołaj osobno (nie blokuj redirect)
  if (isDemo) {
    // Trigger async bez await — nie blokuj
    fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/demo/reset`,
      { method: 'POST' }
    ).catch(() => {})
  }

  // Redirect wg roli — serwer ustawił cookies, middleware je widzi
  switch (profile?.role) {
    case 'admin':     redirect('/admin')
    case 'therapist': redirect('/logopeda')
    default:          redirect('/pacjent/cwiczenia')
  }
}
