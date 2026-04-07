'use client'
import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isDemo, getAllDemoCompleted, setDemoReps } from '@/lib/demoProgress'
import { addDemoExercisePoints, addDemoSessionBonus } from '@/lib/demoStats'
import { playExerciseDone, playSessionComplete } from '@/lib/sounds'
import type { TodayExercise } from '@/types/database'

interface Props {
  exercises: TodayExercise[]
  patientId: string
}

export default function ExerciseList({ exercises: initial, patientId }: Props) {
  const router = useRouter()
  const demo   = isDemo(patientId)
  const [exercises, setExercises] = useState(initial)
  const [justDone, setJustDone]   = useState<string | null>(null)
  const [, startTransition]       = useTransition()

  // Demo: nakładaj localStorage na listę
  useEffect(() => {
    if (!demo) return
    const completed = getAllDemoCompleted()
    if (!completed.length) return
    setExercises(prev =>
      prev.map(e => completed.includes(e.plan_exercise_id)
        ? { ...e, completed_today: true }
        : e
      )
    )
  }, [demo])

  const done    = exercises.filter(e => e.completed_today).length
  const total   = exercises.length
  const allDone = done === total && total > 0

  async function markDone(ex: TodayExercise) {
    if (ex.completed_today) return

    setJustDone(ex.plan_exercise_id)
    setExercises(prev => prev.map(e =>
      e.plan_exercise_id === ex.plan_exercise_id
        ? { ...e, completed_today: true }
        : e
    ))

    const prevDone = exercises.filter(e => e.completed_today).length
    const newDone = prevDone + 1
    if (newDone === total) {
      setTimeout(() => playSessionComplete(), 100)
    } else {
      playExerciseDone()
    }

    setTimeout(() => setJustDone(null), 600)

    if (demo) {
      setDemoReps(ex.plan_exercise_id, ex.repetitions, true)
      addDemoExercisePoints()
      const newDoneCount = exercises.filter(e => e.completed_today).length + 1
      if (newDoneCount >= total) addDemoSessionBonus()
      window.dispatchEvent(new Event('demo-stats-updated'))
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from('exercise_completions').insert({
      patient_id:       ex.patient_id,
      plan_exercise_id: ex.plan_exercise_id,
      session_date:     new Date().toISOString().split('T')[0],
    })
    if (error) {
      setExercises(initial)
    } else {
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="px-3 pb-6 space-y-3">

      {/* Pasek postępu — duży, wizualny */}
      <div className="py-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dzisiaj</span>
          <span className="text-sm font-bold text-brand-600">{done}/{total}</span>
        </div>
        <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: total > 0 ? `${(done/total)*100}%` : '0%' }}
          />
        </div>
        {/* Gwiazdki postępu */}
        <div className="flex justify-center gap-1.5 mt-2">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`text-lg transition-all duration-300 ${i < done ? 'opacity-100 scale-110' : 'opacity-20'}`}>
              ⭐
            </span>
          ))}
        </div>
      </div>

      {/* Wszystko zrobione */}
      {allDone && (
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl p-6 text-center text-white shadow-lg shadow-green-200 animate-pop">
          <div className="text-6xl mb-2">🎉</div>
          <p className="text-xl font-black">Super robota!</p>
          <p className="text-green-100 text-sm mt-1">Ćwiczenia na dziś zrobione!</p>
          <p className="text-yellow-200 font-bold mt-2">+50 ⭐ punktów!</p>
        </div>
      )}

      {/* Karty ćwiczeń */}
      {exercises.map((ex, idx) => {
        const isNext = !ex.completed_today && exercises.slice(0, idx).every(e => e.completed_today)
        const isJust = justDone === ex.plan_exercise_id

        if (ex.completed_today) {
          return (
            <div key={ex.plan_exercise_id}
              className={`flex items-center gap-4 bg-green-50 border-2 border-green-200 rounded-2xl px-4 py-3 transition-all duration-300 ${isJust ? 'scale-105' : 'scale-100'}`}
            >
              <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">
                {ex.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-green-800 truncate">{ex.title}</p>
                <p className="text-green-500 text-sm font-semibold">+20 ⭐</p>
              </div>
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-lg flex-shrink-0">
                ✓
              </div>
            </div>
          )
        }

        if (isNext) {
          return (
            <div key={ex.plan_exercise_id} className="rounded-2xl overflow-hidden shadow-md shadow-brand-100 border-2 border-brand-200 animate-slide-up">
              {/* Tapowalne — otwiera widok ćwiczenia */}
              <Link href={`/pacjent/cwiczenie/${ex.plan_exercise_id}`}
                className="flex items-center gap-4 bg-white px-4 pt-4 pb-2 active:bg-brand-50 transition"
              >
                <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 shadow">
                  {ex.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-brand-900 text-lg truncate">{ex.title}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {ex.repetitions}×
                    </span>
                  </div>
                </div>
                <div className="bg-brand-600 text-white text-xs font-black px-3 py-2 rounded-xl flex-shrink-0">
                  TERAZ
                </div>
              </Link>

              {/* Szybkie "Gotowe!" bez otwierania */}
              <button
                onClick={() => markDone(ex)}
                className="w-full bg-brand-600 text-white font-bold py-3.5 text-base active:bg-brand-700 transition flex items-center justify-center gap-2"
              >
                <span className="text-lg">✓</span> Gotowe!
              </button>
            </div>
          )
        }

        // Czekające — wyszarzone, duże
        return (
          <div key={ex.plan_exercise_id}
            className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 opacity-50"
          >
            <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
              {ex.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-500 truncate">{ex.title}</p>
              <p className="text-gray-400 text-sm">{ex.repetitions} powtórzeń</p>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
          </div>
        )
      })}
    </div>
  )
}
