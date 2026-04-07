// app/pacjent/papuga/page.tsx
import { redirect } from 'next/navigation'
import { getSessionUser, createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import PushSetup from '@/components/patient/PushSetup'
import LogoutButton from '@/components/shared/LogoutButton'
import DemoStatsOverlay from '@/components/patient/DemoStatsOverlay'

export const metadata: Metadata = { title: 'Papuga' }
export const revalidate = 0

export default async function PapugaPage() {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = createClient()
  const userId   = session.profile.id

  const [{ data: stats }, { data: achievements }] = await Promise.all([
    supabase.from('patient_stats').select('*').eq('patient_id', userId).single(),
    supabase.from('achievements').select('badge_key').eq('patient_id', userId),
  ])

  const name       = session.profile.full_name.split(' ')[0]
  const streak     = stats?.current_streak ?? 0
  const exercises  = stats?.total_exercises ?? 0
  const unlockedBadges = achievements?.map(a => a.badge_key) ?? []

  const message = getPapugaMessage(name, exercises, streak)

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">

      {/* Nagłówek */}
      <div className="bg-brand-600 text-white text-center px-5 pt-6 pb-12 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-8 w-20 h-20 bg-white/5 rounded-full" />
        <div className="text-8xl mb-1 inline-block animate-float">🦜</div>
        <h1 className="text-2xl font-black">Papuga Lolo</h1>
      </div>

      <div className="-mt-7 space-y-0">

        {/* Bańka z wiadomością */}
        <div className="mx-4 bg-white rounded-3xl shadow-sm border border-brand-100 p-5 relative mb-4">
          <div className="absolute -top-3 left-6 text-2xl">💬</div>
          <p className="text-gray-800 font-semibold text-center leading-relaxed mt-1 text-lg">
            {message}
          </p>
        </div>

        {/* Demo: Client Component z live stats z localStorage */}
        <DemoStatsOverlay
          patientId={userId}
          dbPoints={stats?.points ?? 0}
          dbLevel={stats?.level ?? 1}
          dbStreak={streak}
          dbTotalExercises={exercises}
          dbUnlockedBadges={unlockedBadges}
          name={name}
        />

        {/* Ustawienia — dla rodzica */}
        <div className="mx-4 space-y-4 pb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="font-bold text-gray-600 mb-1 text-sm">🔔 Przypomnienia</h2>
            <p className="text-xs text-gray-400 mb-3">
              Papuga przypomni o ćwiczeniach o wybranej godzinie.
            </p>
            <PushSetup />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="font-bold text-gray-600 mb-3 text-sm">👤 Profil</h2>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center font-black text-brand-700 text-lg">
                {name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{session.profile.full_name}</p>
                <p className="text-xs text-gray-400">Pacjent</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  )
}

function getPapugaMessage(name: string, exercises: number, streak: number): string {
  if (streak >= 7)     return `${streak} dni z rzędu! 🔥 Niesamowite!`
  if (streak >= 3)     return `Brawo ${name}! Ćwiczysz już ${streak} dni! 🔥`
  if (streak === 0)    return `Cześć ${name}! Tęskniłam! Ćwiczymy? 💙`
  if (exercises >= 50) return `${exercises} ćwiczeń! Jesteś mistrzem! 🏆`
  return `Cześć ${name}! Ćwicz razem ze mną! 🦜`
}
