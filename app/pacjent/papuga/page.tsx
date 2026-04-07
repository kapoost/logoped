// app/pacjent/papuga/page.tsx
// Ekran Papugi — gamifikacja dla dziecka + rodzica + ustawienia
import { redirect } from 'next/navigation'
import { getSessionUser, createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { BADGES, LEVELS } from '@/types/database'
import PushSetup from '@/components/patient/PushSetup'
import LogoutButton from '@/components/shared/LogoutButton'

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

  const name        = session.profile.full_name.split(' ')[0]
  const points      = stats?.points ?? 0
  const level       = stats?.level ?? 1
  const streak      = stats?.current_streak ?? 0
  const exercises   = stats?.total_exercises ?? 0
  const levelDef    = LEVELS.find(l => l.level === level) ?? LEVELS[0]
  const nextLevel   = LEVELS.find(l => l.level === level + 1)
  const unlockedSet = new Set(achievements?.map(a => a.badge_key) ?? [])

  const progressPct = nextLevel
    ? Math.min(100, Math.round(((points - levelDef.minPoints) / (nextLevel.minPoints - levelDef.minPoints)) * 100))
    : 100

  const streakEmoji = streak >= 30 ? '🦁' : streak >= 7 ? '🏅' : streak >= 3 ? '🔥' : '💧'

  const message = getPapugaMessage(name, exercises, streak)

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">

      {/* Nagłówek — wielka animowana papuga */}
      <div className="bg-brand-600 text-white text-center px-5 pt-6 pb-12 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-8 w-20 h-20 bg-white/5 rounded-full" />
        <div className="text-8xl mb-1 inline-block animate-float">🦜</div>
        <h1 className="text-2xl font-black">Papuga Lolo</h1>
      </div>

      <div className="px-4 -mt-7 space-y-4 pb-8">

        {/* Bańka dymkowa — prosta wiadomość */}
        <div className="bg-white rounded-3xl shadow-sm border border-brand-100 p-5 relative">
          <div className="absolute -top-3 left-6 text-2xl">💬</div>
          <p className="text-gray-800 font-semibold text-center leading-relaxed mt-1 text-lg">
            {message}
          </p>
        </div>

        {/* POZIOM — duże, wizualne */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-brand-50 px-5 py-4 flex items-center gap-4">
            <span className="text-5xl">{levelDef.emoji}</span>
            <div className="flex-1">
              <p className="text-xs text-brand-500 font-bold uppercase tracking-wide">Poziom {level}</p>
              <p className="text-xl font-black text-brand-900">{levelDef.title}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-brand-600">{points.toLocaleString('pl-PL')}</p>
              <p className="text-xs text-brand-400">⭐ punktów</p>
            </div>
          </div>

          {/* Pasek XP */}
          {nextLevel && (
            <div className="px-5 py-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>{levelDef.title}</span>
                <span>{nextLevel.emoji} {nextLevel.title}</span>
              </div>
              <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 text-center mt-1">
                jeszcze {(nextLevel.minPoints - points).toLocaleString('pl-PL')} ⭐ do następnego poziomu
              </p>
            </div>
          )}
        </div>

        {/* SERIA — duża */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex items-center gap-4">
          <span className="text-5xl">{streakEmoji}</span>
          <div>
            <p className="text-4xl font-black text-gray-900">{streak}</p>
            <p className="text-sm text-gray-400">dni z rzędu</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-black text-gray-700">{exercises}</p>
            <p className="text-xs text-gray-400">ćwiczeń</p>
          </div>
        </div>

        {/* ODZNAKI — duże emoji, mały tekst dla rodzica */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Odznaki</p>
          <div className="grid grid-cols-4 gap-3">
            {BADGES.map(badge => {
              const unlocked = unlockedSet.has(badge.key)
              return (
                <div key={badge.key} className="flex flex-col items-center gap-1">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all
                    ${unlocked
                      ? 'bg-brand-50 border-2 border-brand-200 shadow-sm'
                      : 'bg-gray-50 border-2 border-gray-100 opacity-30 grayscale'
                    }`}>
                    {badge.emoji}
                  </div>
                  {unlocked && (
                    <p className="text-[10px] text-center text-brand-600 font-bold leading-tight">
                      {badge.name}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Ustawienia — dla RODZICA (mały tekst OK tutaj) */}
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
  )
}

function getPapugaMessage(name: string, exercises: number, streak: number): string {
  if (streak >= 7)     return `${streak} dni z rzędu! 🔥 Niesamowite!`
  if (streak >= 3)     return `Brawo ${name}! Ćwiczysz już ${streak} dni! 🔥`
  if (streak === 0)    return `Cześć ${name}! Tęskniłam! Ćwiczymy? 💙`
  if (exercises >= 50) return `${exercises} ćwiczeń! Jesteś mistrzem! 🏆`
  return `Cześć ${name}! Ćwicz razem ze mną! 🦜`
}
