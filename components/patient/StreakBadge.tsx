// components/patient/StreakBadge.tsx
export default function StreakBadge({ streak }: { streak: number }) {
  const flame = streak >= 30 ? '🦁' : streak >= 7 ? '🏅' : streak >= 3 ? '🔥' : '💧'

  return (
    <div className="bg-white/15 rounded-2xl px-4 py-2.5 flex items-center gap-2 min-w-[100px]">
      <span className="text-2xl animate-bounce2 inline-block">{flame}</span>
      <div>
        <p className="text-white/70 text-xs">Seria</p>
        <p className="text-sm font-bold leading-tight">
          {streak} {streak === 1 ? 'dzień' : streak < 5 ? 'dni' : 'dni'}
        </p>
      </div>
    </div>
  )
}
