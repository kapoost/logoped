// components/patient/ProgressStars.tsx

/**
 * Postęp dnia w gwiazdkach.
 *
 * Powyżej ośmiu pozycji rząd gwiazdek przestaje być informacją i zaczyna być
 * paskiem, który i tak się nie mieści — przy planie na 14 ćwiczeń urywał się
 * za krawędzią ekranu. Wtedy pokazujemy jedną gwiazdkę z liczbą, bo dziecko
 * i tak czyta „ile z ilu", a nie liczy ikonki.
 */
export default function ProgressStars({ done, total }: { done: number; total: number }) {
  const stars = Math.max(total, 1)

  if (stars > 8) {
    return (
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={`text-lg leading-none ${done > 0 ? 'animate-bounce2' : 'opacity-30'}`}>⭐</span>
        <span className="font-black text-white leading-none tabular-nums">
          {done}<span className="opacity-60 font-bold">/{stars}</span>
        </span>
      </div>
    )
  }

  return (
    <div className="flex gap-1 flex-shrink-0">
      {Array.from({ length: stars }).map((_, i) => (
        <span
          key={i}
          className={`text-lg leading-none transition-all ${
            i < done ? 'animate-bounce2' : 'opacity-30'
          }`}
          style={{ animationDelay: `${i * 0.15}s` }}
        >
          ⭐
        </span>
      ))}
    </div>
  )
}
