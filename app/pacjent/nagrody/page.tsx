// app/(pacjent)/nagrody/page.tsx
import { redirect } from 'next/navigation'
import { getSessionUser, createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { BADGES, LEVELS } from '@/types/database'

export const metadata: Metadata = { title: 'Nagrody' }
export const revalidate = 0

export default async function NagrodyPage() {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = createClient()
  const userId   = session.profile.id

  const [{ data: stats }, { data: achievements }] = await Promise.all([
    supabase.from('patient_stats').select('*').eq('patient_id', userId).single(),
    supabase.from('achievements').select('badge_key, unlocked_at').eq('patient_id', userId),
  ])

  const points      = stats?.points ?? 0
  const level       = stats?.level ?? 1
  const streak      = stats?.current_streak ?? 0
  const levelDef    = LEVELS.find(l => l.level === level) ?? LEVELS[0]
  const nextLevel   = LEVELS.find(l => l.level === level + 1)
  const unlockedSet = new Set(achievements?.map(a => a.badge_key) ?? [])

  const progressPct = nextLevel
    ? Math.min(100, Math.round(((points - levelDef.minPoints) / (nextLevel.minPoints - levelDef.minPoints)) * 100))
    : 100

  // Buduj kafelki tygodnia — sprawdź ostatnie 7 dni (uproszczone: używamy streak)
  const weekDays = ['Pn','Wt','Śr','Cz','Pt','So','Nd']
  const today    = new Date().getDay() // 0=nd
  // Pobierz dni z wykonaniami z ostatnich 7 dni
  const { data: recentDays } = await supabase
    .from('exercise_completions')
    .select('session_date')
    .eq('patient_id', userId)
    .gte('session_date', new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0])
    .order('session_date')

  const doneDates = new Set(recentDays?.map(r => r.session_date) ?? [])

  const weekTiles = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    const dateStr = d.toISOString().split('T')[0]
    const dayIdx  = (d.getDay() + 6) % 7  // 0=pon
    return { label: weekDays[dayIdx], done: doneDates.has(dateStr), isToday: i === 6 }
  })

  return (
    <div className="animate-fade-in">
      {/* Nagłówek złoty */}
      <div className="bg-amber-500 text-white px-5 pt-6 pb-0">
        <div className="flex items-center gap-3 mb-5">
          <div className="text-5xl">🏆</div>
          <div>
            <h1 className="text-2xl font-bold">Moje nagrody</h1>
            <p className="text-amber-100 text-sm">
              {levelDef.emoji} {levelDef.title} · {points.toLocaleString('pl-PL')} ⭐
            </p>
          </div>
        </div>

        {/* Pasek poziomu */}
        <div className="bg-white/20 rounded-2xl px-4 py-3 mb-0">
          <div className="flex justify-between text-xs text-amber-100 mb-2">
            <span>{levelDef.emoji} {levelDef.title}</span>
            {nextLevel
              ? <span>{nextLevel.emoji} {nextLevel.title} — jeszcze {(nextLevel.minPoints - points).toLocaleString('pl-PL')} pkt</span>
              : <span>🏆 Maksymalny poziom!</span>
            }
          </div>
          <div className="bg-white/25 rounded-full h-3 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-right text-xs text-amber-100 mt-1">{progressPct}%</p>
        </div>

        {/* Fala */}
        <svg viewBox="0 0 390 20" className="w-full block mt-0" preserveAspectRatio="none" height="20">
          <path d="M0 20 Q97 0 195 14 Q293 28 390 6 L390 20Z" fill="#F9FAFB" />
        </svg>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Seria tygodnia */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">Seria tygodnia</h2>
            <span className="text-sm text-gray-500">
              {streak >= 7 ? '🏅' : streak >= 3 ? '🔥' : '💧'} {streak} dni z rzędu
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex justify-between gap-1">
              {weekTiles.map((t, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className={`w-full aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                      t.done
                        ? 'bg-green-500 text-white shadow-sm'
                        : t.isToday
                        ? 'bg-brand-100 border-2 border-brand-600 border-dashed'
                        : 'bg-gray-100 text-gray-300'
                    }`}
                  >
                    {t.done ? '✓' : ''}
                  </div>
                  <span className={`text-[10px] font-medium ${t.isToday ? 'text-brand-600' : 'text-gray-400'}`}>
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Odznaki */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">Odznaki</h2>
            <span className="text-sm text-gray-400">
              {unlockedSet.size}/{BADGES.length} zdobytych
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {BADGES.map(badge => {
              const unlocked = unlockedSet.has(badge.key)
              const ach = achievements?.find(a => a.badge_key === badge.key)

              return (
                <div
                  key={badge.key}
                  title={badge.description}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                    unlocked
                      ? 'bg-white border-yellow-200 shadow-sm'
                      : 'bg-gray-50 border-gray-100 opacity-40'
                  }`}
                >
                  <span className={`text-3xl ${unlocked ? '' : 'grayscale'}`}>
                    {badge.emoji}
                  </span>
                  <span className={`text-[10px] font-semibold text-center leading-tight ${
                    unlocked ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {badge.title}
                  </span>
                  {unlocked && ach && (
                    <span className="text-[9px] text-green-600">
                      ✓ zdobyta
                    </span>
                  )}
                  {!unlocked && (
                    <span className="text-[9px] text-gray-400">🔒</span>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Statystyki */}
        <section>
          <h2 className="font-bold text-gray-800 mb-3">Statystyki</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Wszystkich sesji',   value: stats?.total_sessions ?? 0,  emoji: '📅' },
              { label: 'Ćwiczeń łącznie',    value: stats?.total_exercises ?? 0, emoji: '💪' },
              { label: 'Najdłuższa seria',   value: `${stats?.longest_streak ?? 0} dni`, emoji: '🔥' },
              { label: 'Zdobyte punkty',     value: (stats?.points ?? 0).toLocaleString('pl-PL'), emoji: '⭐' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="text-2xl mb-1">{s.emoji}</div>
                <div className="text-xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
