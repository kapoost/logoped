// app/(pacjent)/papuga/page.tsx
import { redirect } from 'next/navigation'
import { getSessionUser, createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import PushSetup from '@/components/patient/PushSetup'
import LogoutButton from '@/components/shared/LogoutButton'

export const metadata: Metadata = { title: 'Papuga' }
export const revalidate = 0

export default async function PapugaPage() {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = createClient()
  const { data: stats } = await supabase
    .from('patient_stats')
    .select('total_exercises, current_streak, points, level')
    .eq('patient_id', session.profile.id)
    .single()

  const name      = session.profile.full_name.split(' ')[0]
  const exercises = stats?.total_exercises ?? 0
  const streak    = stats?.current_streak ?? 0

  // Papuga "mówi" różne rzeczy zależnie od postępów
  const messages = getPapugaMessages(name, exercises, streak)

  return (
    <div className="animate-fade-in">
      {/* Nagłówek */}
      <div className="bg-brand-600 text-white px-5 pt-6 pb-10 text-center">
        <div className="text-7xl mb-3 inline-block animate-wiggle">🦜</div>
        <h1 className="text-2xl font-bold">Papuga</h1>
        <p className="text-brand-200 text-sm mt-1">Twoja logopedyczna przyjaciółka</p>
      </div>

      <div className="px-4 -mt-6 space-y-4">
        {/* Bańka dymkowa papugi */}
        <div className="bg-white rounded-3xl border border-brand-100 shadow-sm p-5 relative">
          <div className="absolute -top-3 left-8 text-2xl">💬</div>
          <p className="text-gray-800 font-medium leading-relaxed text-center mt-1">
            {messages[Math.floor(Date.now() / (1000 * 60 * 60 * 6)) % messages.length]}
          </p>
        </div>

        {/* Nauki papugi — słowa z ćwiczeń */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-bold text-gray-800 mb-3">🎓 Papuga nauczyła się</h2>
          <div className="flex flex-wrap gap-2">
            {['SZ', 'CZ', 'S', 'Z', 'L', 'R', 'K', 'G'].map(sound => (
              <span
                key={sound}
                className="bg-brand-50 text-brand-700 text-sm font-bold px-3 py-1.5 rounded-xl border border-brand-200"
              >
                {sound}
              </span>
            ))}
            <span className="bg-gray-50 text-gray-400 text-sm px-3 py-1.5 rounded-xl border border-dashed border-gray-200">
              + więcej po ćwiczeniach!
            </span>
          </div>
        </div>

        {/* Ustawienia powiadomień */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-bold text-gray-800 mb-1">🔔 Przypomnienia papugi</h2>
          <p className="text-sm text-gray-500 mb-3">
            Papuga przypomniana Ci o ćwiczeniach o wybranej godzinie.
          </p>
          <PushSetup />
        </div>

        {/* Profil */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h2 className="font-bold text-gray-800">👤 Profil</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center font-bold text-brand-700">
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
  )
}

function getPapugaMessages(name: string, exercises: number, streak: number): string[] {
  const msgs = [
    `Cześć ${name}! Pamiętaj o ćwiczeniach — ja też codziennie ćwiczę mówienie! 🦜`,
    `${name}, razem możemy wszystko! Każde ćwiczenie przybliża Cię do mistrzostwa mowy! ⭐`,
    `Hej ${name}! Słyszałam jak pięknie mówisz — ćwicz dalej! 🎤`,
  ]

  if (exercises >= 10) msgs.push(`Już ${exercises} ćwiczeń za Tobą, ${name}! Jestem z Ciebie dumna! 🏆`)
  if (streak >= 3)     msgs.push(`${streak} dni z rzędu! Jesteś niesamowity/a, ${name}! 🔥🔥🔥`)
  if (streak === 0)    msgs.push(`${name}, dawno Cię nie było! Tęskniłam za Tobą! Wróćmy do ćwiczeń! 💙`)

  return msgs
}
