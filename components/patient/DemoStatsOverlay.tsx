'use client'
// Nakłada lokalne stats demo na dane z DB w widoku Papugi
import { useEffect, useState } from 'react'
import { isDemo } from '@/lib/demoProgress'
import { seedDemoStats, getDemoStats, type DemoStats } from '@/lib/demoStats'
import { LEVELS, BADGES } from '@/types/database'

interface Props {
  patientId: string
  // DB stats
  dbPoints: number
  dbLevel: number
  dbStreak: number
  dbTotalExercises: number
  dbUnlockedBadges: string[]
  name: string
}

export default function DemoStatsOverlay({
  patientId, dbPoints, dbLevel, dbStreak, dbTotalExercises, dbUnlockedBadges, name
}: Props) {
  const demo = isDemo(patientId)
  const [stats, setStats] = useState<DemoStats | null>(null)

  useEffect(() => {
    if (!demo) return
    seedDemoStats({ points: dbPoints, level: dbLevel, streak: dbStreak, total_exercises: dbTotalExercises })
    setStats(getDemoStats())
    const handler = () => setStats(getDemoStats())
    window.addEventListener('demo-stats-updated', handler)
    return () => window.removeEventListener('demo-stats-updated', handler)
  }, [demo, dbPoints, dbLevel, dbStreak, dbTotalExercises])

  if (!demo || !stats) return null

  const points    = stats.points
  const level     = stats.level
  const streak    = stats.streak
  const exercises = stats.total_exercises

  const levelDef  = LEVELS.find(l => l.level === level) ?? LEVELS[0]
  const nextLevel = LEVELS.find(l => l.level === level + 1)
  const progressPct = nextLevel
    ? Math.min(100, Math.round(((points - levelDef.minPoints) / (nextLevel.minPoints - levelDef.minPoints)) * 100))
    : 100
  const streakEmoji = streak >= 30 ? '🦁' : streak >= 7 ? '🏅' : streak >= 3 ? '🔥' : '💧'

  // Symulowane odznaki na podstawie stats
  const fakeUnlocked = new Set([...dbUnlockedBadges])
  if (streak >= 3) fakeUnlocked.add('streak_3')
  if (streak >= 7) fakeUnlocked.add('streak_7')
  if (exercises >= 10) fakeUnlocked.add('sessions_10')
  if (exercises >= 1) fakeUnlocked.add('first_session')

  return (
    <div className="px-4 space-y-4 pb-8">

      {/* POZIOM */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-brand-50 px-5 py-4 flex items-center gap-4">
          <span className="text-5xl">{levelDef.emoji}</span>
          <div className="flex-1">
            <p className="text-xs text-brand-500 font-bold uppercase tracking-wide">Poziom {level}</p>
            <p className="text-xl font-black text-brand-900">{levelDef.title}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-brand-600 tabular-nums">{points.toLocaleString('pl-PL')}</p>
            <p className="text-xs text-brand-400">⭐ punktów</p>
          </div>
        </div>
        {nextLevel && (
          <div className="px-5 py-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>{levelDef.title}</span>
              <span>{nextLevel.emoji} {nextLevel.title}</span>
            </div>
            <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-xs text-gray-400 text-center mt-1">
              jeszcze {(nextLevel.minPoints - points).toLocaleString('pl-PL')} ⭐
            </p>
          </div>
        )}
      </div>

      {/* SERIA */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex items-center gap-4">
        <span className="text-5xl">{streakEmoji}</span>
        <div>
          <p className="text-4xl font-black text-gray-900 tabular-nums">{streak}</p>
          <p className="text-sm text-gray-400">dni z rzędu</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-black text-gray-700 tabular-nums">{exercises}</p>
          <p className="text-xs text-gray-400">ćwiczeń</p>
        </div>
      </div>

      {/* ODZNAKI */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Odznaki</p>
        <div className="grid grid-cols-4 gap-3">
          {BADGES.map(badge => {
            const unlocked = fakeUnlocked.has(badge.key)
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
    </div>
  )
}
