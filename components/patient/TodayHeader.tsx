// components/patient/TodayHeader.tsx
import { LEVELS } from '@/types/database'
import StreakBadge from './StreakBadge'
import ProgressStars from './ProgressStars'

interface Props {
  name: string
  streak: number
  points: number
  level: number
  done: number
  total: number
}

export default function TodayHeader({ name, streak, points, level, done, total }: Props) {
  const levelDef = LEVELS.find(l => l.level === level) ?? LEVELS[0]
  const nextLevel = LEVELS.find(l => l.level === level + 1)

  // Oblicz % do następnego poziomu
  const currentMin = levelDef.minPoints
  const nextMin    = nextLevel?.minPoints ?? currentMin
  const progress   = nextLevel
    ? Math.min(100, Math.round(((points - currentMin) / (nextMin - currentMin)) * 100))
    : 100

  const greeting = getGreeting()

  return (
    <div className="bg-brand-600 text-white relative overflow-hidden">
      {/* Dekoracyjne kółka */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/8 rounded-full pointer-events-none" />
      <div className="absolute top-8 right-12 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />

      <div className="relative px-5 pt-5 pb-0">
        {/* Górna belka — powitanie + papuga */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-brand-200 text-xs font-medium tracking-wide uppercase">
              {greeting}
            </p>
            <h1 className="text-2xl font-bold mt-0.5">
              Cześć, {name}!
            </h1>
          </div>

          {/* Papuga — maskotka */}
          <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center border-2 border-white/25 flex-shrink-0">
            <span className="text-3xl animate-wiggle inline-block">🦜</span>
          </div>
        </div>

        {/* Seria + punkty */}
        <div className="flex gap-3 mb-4">
          <StreakBadge streak={streak} />

          {/* Punkty + poziom */}
          <div className="flex-1 bg-white/15 rounded-2xl px-4 py-2.5 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs">Poziom</p>
              <p className="text-sm font-bold leading-tight">
                {levelDef.emoji} {levelDef.title}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs">Punkty</p>
              <p className="text-sm font-bold">{points.toLocaleString('pl-PL')} ⭐</p>
            </div>
          </div>
        </div>

        {/* Pasek XP do następnego poziomu */}
        {nextLevel && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>{levelDef.title}</span>
              <span>{nextLevel.emoji} {nextLevel.title} za {(nextMin - points).toLocaleString('pl-PL')} pkt</span>
            </div>
            <div className="bg-white/20 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Gwiazdy postępu */}
        <div className="bg-white/15 rounded-2xl px-4 py-3 mb-0 flex items-center gap-3">
          <ProgressStars done={done} total={total} />
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {done === 0
                ? 'Zaczynamy!'
                : done === total && total > 0
                ? '🎉 Wszystko zrobione!'
                : `${done} z ${total} ćwiczeń`}
            </p>
            <p className="text-white/65 text-xs">
              {done === total && total > 0
                ? 'Świetna robota!'
                : 'Dotknij ćwiczenie, żeby zacząć'}
            </p>
          </div>
          <div className="bg-white/20 rounded-xl px-2.5 py-1 text-xs font-bold">
            {total > 0 ? Math.round((done / total) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Fala przejścia do białego tła */}
      <svg
        viewBox="0 0 390 24"
        className="w-full block mt-0"
        preserveAspectRatio="none"
        height="24"
      >
        <path d="M0 24 Q97 0 195 16 Q293 32 390 8 L390 24Z" fill="#F9FAFB" />
      </svg>
    </div>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 10) return 'Dzień dobry'
  if (h < 18) return 'Cześć'
  return 'Dobry wieczór'
}
