// app/(logopeda)/layout.tsx
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/supabase/server'
import TherapistNav from '@/components/therapist/TherapistNav'

export default async function TherapistLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSessionUser()

  if (!session) redirect('/login')
  if (session.profile.role !== 'therapist' && session.profile.role !== 'admin') {
    redirect('/pacjent/cwiczenia')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      <TherapistNav name={session.profile.full_name} />
      <main className="flex-1 pb-24 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
