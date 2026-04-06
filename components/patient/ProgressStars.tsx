// components/patient/ProgressStars.tsx
export default function ProgressStars({ done, total }: { done: number; total: number }) {
  const stars = Math.max(total, 1)

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
