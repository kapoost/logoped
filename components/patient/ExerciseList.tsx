'use client'
// components/patient/ExerciseList.tsx

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/client'
import type { TodayExercise } from '@/types/database'
import { CATEGORY_LABELS } from '@/types/database'

interface Props { exercises: TodayExercise[] }

export default function ExerciseList({ exercises: initial }: Props) {
  const router = useRouter()
  const [exercises, setExercises] = useState(initial)
  const [isPending, startTransition] = useTransition()

  // Optymistyczne zaznaczenie — natychmiastowy feedback
  async function markDone(ex: TodayExercise) {
    if (ex.completed_today) return

    // Optimistic update
    setExercises(prev =>
      prev.map(e =>
        e.plan_exercise_id === ex.plan_exercise_id
          ? { ...e, completed_today: true, completed_at: new Date().toISOString() }
          : e
      )
    )

    const supabase = createClient()
    const { error } = await supabase
      .from('exercise_completions')
      .insert({
        patient_id:       ex.patient_id,
        plan_exercise_id: ex.plan_exercise_id,
        session_date:     new Date().toISOString().split('T')[0],
      })

    if (error) {
      // Rollback przy błędzie
      setExercises(initial)
      console.error('Błąd zapisu:', error.message)
      return
    }

    startTransition(() => router.refresh())
  }

  const done  = exercises.filter(e => e.completed_today).length
  const total = exercises.length
  const allDone = done === total && total > 0

  return (
    <>
      {allDone && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center animate-pop">
          <div className="text-4xl mb-2">🎉</div>
          <p className="font-bold text-green-800">Brawo! Wszystko zrobione!</p>
          <p className="text-green-600 text-sm mt-0.5">Zarobiłeś +50 punktów bonusowych!</p>
        </div>
      )}

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">
        Dzisiejsze zadania
      </p>

      {exercises.map((ex, idx) => {
        const isNext = !ex.completed_today &&
          exercises.slice(0, idx).every(e => e.completed_today)

        return (
          <ExerciseCard
            key={ex.plan_exercise_id}
            exercise={ex}
            isNext={isNext}
            onMarkDone={() => markDone(ex)}
          />
        )
      })}
    </>
  )
}

// ── Karta pojedynczego ćwiczenia ─────────────────────────────────────────

function ExerciseCard({
  exercise: ex,
  isNext,
  onMarkDone,
}: {
  exercise: TodayExercise
  isNext: boolean
  onMarkDone: () => void
}) {
  if (ex.completed_today) {
    return (
      <div className="exercise-card-done rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="w-11 h-11 bg-green-500 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
          {ex.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-500 line-through truncate">{ex.title}</p>
          <p className="text-xs text-green-600 font-medium">Zrobione! +20 ⭐</p>
        </div>
        <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
          ✓
        </div>
      </div>
    )
  }

  if (isNext) {
    return (
      <div className="exercise-card-active rounded-2xl overflow-hidden animate-slide-up">
        {/* Klikalna część — otwiera widok ćwiczenia */}
        <Link
          href={`/pacjent/cwiczenie/${ex.plan_exercise_id}`}
          className="flex items-center gap-3 px-4 pt-3 pb-2"
        >
          <div className="w-11 h-11 bg-brand-600 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
            {ex.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-900 truncate">{ex.title}</p>
            <p className="text-xs text-brand-500">
              {ex.repetitions} powtórzeń · {CATEGORY_LABELS[ex.category]}
            </p>
          </div>
          <span className="bg-brand-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0">
            Teraz!
          </span>
        </Link>

        {/* Szybkie zaznaczenie bez otwierania widoku */}
        <div className="border-t border-brand-200 px-4 py-2 flex items-center justify-between">
          <p className="text-xs text-brand-400">Dotknij, żeby zobaczyć instrukcję</p>
          <button
            onClick={onMarkDone}
            className="text-xs text-brand-600 font-semibold hover:text-brand-800 transition py-1"
          >
            ✓ Gotowe
          </button>
        </div>
      </div>
    )
  }

  // Ćwiczenie czeka (nie jest następne)
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 opacity-60">
      <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
        {ex.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-600 truncate">{ex.title}</p>
        <p className="text-xs text-gray-400">{ex.repetitions} powtórzeń</p>
      </div>
      <div className="w-7 h-7 bg-gray-100 rounded-full flex-shrink-0" />
    </div>
  )
}
