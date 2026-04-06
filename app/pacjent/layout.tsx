// app/(pacjent)/layout.tsx
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/supabase/server'
import PatientNav from '@/components/patient/PatientNav'

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSessionUser()

  if (!session) redirect('/login')
  if (session.profile.role !== 'patient' && session.profile.role !== 'admin') {
    redirect('/logopeda')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Treść strony — padding-bottom dla dolnej nawigacji */}
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>

      {/* Dolna nawigacja — stała */}
      <PatientNav />
    </div>
  )
}
