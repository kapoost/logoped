// components/patient/TodayHeader.tsx
// Ekran główny — dla dziecka które nie czyta. TYLKO ikony i liczby.

interface Props {
  name: string
  streak: number
  done: number
  total: number
}

export default function TodayHeader({ name, streak, done, total }: Props) {
  const streakEmoji = streak >= 30 ? '🦁' : streak >= 7 ? '🏅' : streak >= 3 ? '🔥' : '💧'
  const allDone = done === total && total > 0

  return (
    <div className="bg-brand-600 text-white relative overflow-hidden">
      <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/8 rounded-full pointer-events-none" />

      <div className="relative px-5 pt-5 pb-2">
        {/* Imię + papuga */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-3xl font-black">Cześć, {name}!</h1>
          </div>
          <div className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center border-2 border-white/25 flex-shrink-0">
            <span className="text-4xl animate-wiggle inline-block">🦜</span>
          </div>
        </div>

        {/* Seria — duża ikona, tylko liczba */}
        <div className="flex gap-3 mb-4">
          <div className="bg-white/15 rounded-2xl px-5 py-3 flex items-center gap-3">
            <span className="text-4xl">{streakEmoji}</span>
            <span className="text-3xl font-black">{streak}</span>
          </div>

          {/* Gwiazdki postępu — duże */}
          <div className="flex-1 bg-white/15 rounded-2xl px-4 py-3 flex items-center justify-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} className={`text-2xl transition-all duration-300 ${i < done ? 'opacity-100' : 'opacity-25'}`}>
                ⭐
              </span>
            ))}
            {total === 0 && <span className="text-2xl opacity-50">⭐⭐⭐</span>}
          </div>
        </div>

        {/* Komunikat — tylko emoji gdy wszystko zrobione */}
        {allDone && (
          <div className="bg-white/20 rounded-2xl py-3 mb-2 text-center text-2xl animate-pop">
            🎉 🏆 🎉
          </div>
        )}
      </div>

      {/* Fala */}
      <svg viewBox="0 0 390 24" className="w-full block" preserveAspectRatio="none" height="24">
        <path d="M0 24 Q97 0 195 16 Q293 32 390 8 L390 24Z" fill="#F9FAFB" />
      </svg>
    </div>
  )
}
