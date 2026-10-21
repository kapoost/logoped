// app/(pacjent)/layout.tsx
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/supabase/server'
import PatientNav from '@/components/patient/PatientNav'
import LogoutButton from '@/components/shared/LogoutButton'

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
    <div className="h-[100dvh] overflow-hidden bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Top bar z wylogowaniem */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-xs text-gray-400">{session.profile.full_name}</span>
        <LogoutButton className="text-xs text-gray-400 hover:text-red-500 transition" label="Wyloguj" />
      </div>

      {/* Treść strony — padding-bottom dla dolnej nawigacji */}
      {/* Odstęp pod nawigację należy do stron, nie do layoutu — ekran
          ćwiczenia ukrywa pasek i nie może płacić za niego 80 px. */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </main>

      {/* Dolna nawigacja — stała */}
      <PatientNav />
    </div>
  )
}
