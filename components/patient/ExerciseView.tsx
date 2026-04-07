'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isDemo, getDemoReps, getDemoCompleted, setDemoReps } from '@/lib/demoProgress'
import type { TodayExercise } from '@/types/database'
import { DIFFICULTY_LABELS } from '@/types/database'

interface Props {
  exercise: TodayExercise
  nextId: string | null
  patientId: string
}

export default function ExerciseView({ exercise: ex, nextId, patientId }: Props) {
  const router   = useRouter()
  const supabase = createClient()
  const demo     = isDemo(patientId)

  // Inicjalizuj z localStorage jeśli demo, lub z ex.completed_today
  const [repsDone, setRepsDone] = useState(() => {
    if (demo) return getDemoReps(ex.plan_exercise_id)
    return ex.completed_today ? ex.repetitions : 0
  })
  const [saving, setSaving]           = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  const totalReps   = ex.repetitions
  const isCompleted = (demo ? getDemoCompleted(ex.plan_exercise_id) : ex.completed_today) || repsDone >= totalReps

  const steps = ex.instructions
    .split('\n')
    .map(s => s.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)

  async function addRep() {
    if (repsDone >= totalReps || saving) return
    const next = repsDone + 1
    setRepsDone(next)

    if (demo) {
      // Demo: zapisz do localStorage
      setDemoReps(ex.plan_exercise_id, next, next >= totalReps)
      if (next >= totalReps) await celebrateAndNav()
    } else {
      if (next >= totalReps && !ex.completed_today) await markComplete()
    }
  }

  async function markComplete() {
    setSaving(true)
    const { error } = await supabase
      .from('exercise_completions')
      .insert({
        patient_id:       patientId,
        plan_exercise_id: ex.plan_exercise_id,
        session_date:     new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    setSaving(false)
    if (!error) await celebrateAndNav()
  }

  async function celebrateAndNav() {
    setShowCelebration(true)
    await new Promise(r => setTimeout(r, 1800))
    setShowCelebration(false)
    if (nextId) {
      router.push(`/pacjent/cwiczenie/${nextId}`)
    } else {
      router.push('/pacjent/cwiczenia')
    }
    router.refresh()
  }

  // Parsuj kroki
  const circumference = 2 * Math.PI * 36
  const progress      = totalReps > 0 ? repsDone / totalReps : 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-brand-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/pacjent/cwiczenia"
            className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white text-lg flex-shrink-0"
          >
            ←
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-brand-200 uppercase tracking-wide font-medium">Ćwiczenie</p>
            <h1 className="text-lg font-bold truncate">{ex.title}</h1>
          </div>
          <span className="text-2xl">{ex.emoji}</span>
        </div>

        {/* Kołowy licznik powtórzeń */}
        <div className="flex flex-col items-center py-2">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6"/>
              <circle
                cx="40" cy="40" r="36" fill="none"
                stroke="white" strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{repsDone}</span>
              <span className="text-xs text-brand-200">/ {totalReps}</span>
            </div>
          </div>
          <p className="text-brand-200 text-sm mt-2">powtórzeń</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-4">
        {/* Trudność */}
        <div className="flex gap-2">
          <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full font-medium">
            {DIFFICULTY_LABELS[ex.difficulty]}
          </span>
          {ex.target_sounds && ex.target_sounds.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              głoski: {ex.target_sounds.join(', ')}
            </span>
          )}
        </div>

        {/* Opis */}
        {ex.description && (
          <p className="text-sm text-gray-500">{ex.description}</p>
        )}

        {/* Kroki instrukcji */}
        <div className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Jak to zrobić?</p>
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        {/* Notatka logopedy */}
        {ex.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-amber-700 mb-1">💬 Wskazówka logopedy</p>
            <p className="text-sm text-amber-800">{ex.notes}</p>
          </div>
        )}
      </div>

      {/* Przycisk +1 / Gotowe */}
      <div className="px-4 pb-8 pt-4 bg-white border-t border-gray-100">
        {isCompleted ? (
          <div className="bg-green-500 text-white font-bold py-4 rounded-2xl text-center text-lg">
            ✓ Zrobione! +20 ⭐
          </div>
        ) : (
          <button
            onClick={addRep}
            disabled={saving}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-lg active:scale-95 transition"
          >
            {saving ? 'Zapisuję…' : repsDone === totalReps - 1 ? '🎉 Ostatnie!' : `+1 powtórzenie`}
          </button>
        )}
        {demo && repsDone > 0 && !isCompleted && (
          <p className="text-center text-xs text-gray-400 mt-2">
            Postęp zapisany lokalnie 🔒
          </p>
        )}
      </div>

      {/* Celebracja */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-3xl p-8 text-center mx-4">
              <div className="text-6xl mb-3">🎉</div>
              <p className="text-2xl font-bold text-gray-900">Brawo!</p>
              <p className="text-gray-500 mt-1">+20 punktów!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
