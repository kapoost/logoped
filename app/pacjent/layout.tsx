// app/(pacjent)/layout.tsx
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/supabase/server'
import PatientNav from '@/components/patient/PatientNav'
import PasekGorny from '@/components/patient/PasekGorny'

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
    <div className="h-[100dvh] overflow-hidden bg-sand flex flex-col max-w-md mx-auto">
      {/* Top bar z wylogowaniem — ukrywa się na ekranie ćwiczenia */}
      <PasekGorny imie={session.profile.full_name} />

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
