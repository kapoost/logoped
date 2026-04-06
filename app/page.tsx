// app/page.tsx
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSessionUser } from '@/lib/supabase/server'

export default async function HomePage() {
  const session = await getSessionUser()

  if (!session) redirect('/login')

  // Sprawdź czy jest cookie z celem redirect
  const cookieStore = cookies()
  const redirectTarget = cookieStore.get('logoped_redirect')?.value

  if (redirectTarget && redirectTarget.startsWith('/')) {
    redirect(redirectTarget)
  }

  // Domyślny redirect wg roli
  switch (session.profile.role) {
    case 'admin':     redirect('/admin')
    case 'therapist': redirect('/logopeda')
    case 'patient':   redirect('/pacjent/cwiczenia')
    default:          redirect('/login')
  }
}
