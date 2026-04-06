'use client'
// components/patient/ExerciseView.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { TodayExercise } from '@/types/database'
import { DIFFICULTY_LABELS } from '@/types/database'

interface Props {
  exercise: TodayExercise
  nextId: string | null
  patientId: string
}

export default function ExerciseView({ exercise: ex, nextId, patientId }: Props) {
  const router  = useRouter()
  const supabase = createClient()

  const [repsDone, setRepsDone] = useState(ex.completed_today ? ex.repetitions : 0)
  const [saving, setSaving]     = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  const totalReps   = ex.repetitions
  const isCompleted = ex.completed_today || repsDone >= totalReps

  // Parsuj instrukcje z Markdown-like kroków
  const steps = ex.instructions
    .split('\n')
    .map(s => s.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)

  async function addRep() {
    if (repsDone >= totalReps || saving) return
    const next = repsDone + 1
    setRepsDone(next)

    if (next >= totalReps && !ex.completed_today) {
      await markComplete()
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
    if (!error) {
      setShowCelebration(true)
      setTimeout(() => {
        setShowCelebration(false)
        if (nextId) {
          router.push(`/pacjent/cwiczenie/${nextId}`)
        } else {
          router.push('/pacjent/cwiczenia')
        }
        router.refresh()
      }, 1800)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nagłówek */}
      <div className="bg-brand-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/pacjent/cwiczenia"
            className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white text-lg flex-shrink-0"
          >
            ←
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold truncate">{ex.title}</p>
            <p className="text-brand-200 text-xs">{ex.plan_name}</p>
          </div>
          <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0">
            +20 ⭐
          </span>
        </div>

        {/* Difficulty badge */}
        <div className="flex gap-2">
          <span className="bg-white/15 text-white/80 text-xs px-2.5 py-1 rounded-full">
            {DIFFICULTY_LABELS[ex.difficulty]}
          </span>
          {ex.target_sounds && ex.target_sounds.length > 0 && (
            <span className="bg-white/15 text-white/80 text-xs px-2.5 py-1 rounded-full">
              Głoski: {ex.target_sounds.join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Ilustracja emoji */}
      <div className="bg-brand-50 border-b border-brand-100 flex items-center justify-center py-8 relative">
        <motion.div
          animate={isCompleted ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="text-[80px] leading-none select-none"
        >
          {ex.emoji}
        </motion.div>
        {ex.media_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ex.media_url}
            alt={ex.title}
            className="absolute inset-0 w-full h-full object-contain p-4"
          />
        )}
      </div>

      {/* Treść */}
      <div className="flex-1 px-4 py-5 space-y-5 overflow-y-auto">
        {/* Kroki instrukcji */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Jak to zrobić</h2>
          <ol className="space-y-2">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Notatka logopedy */}
        {ex.therapist_notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">💬 Uwaga od logopedy</p>
            <p className="text-sm text-amber-800">{ex.therapist_notes}</p>
          </div>
        )}

        {/* Licznik powtórzeń */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
            Powtórzenia ({repsDone}/{totalReps})
          </h2>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: totalReps }).map((_, i) => (
              <motion.div
                key={i}
                animate={i < repsDone ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.2 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < repsDone
                    ? 'bg-green-500 text-white shadow-sm'
                    : i === repsDone
                    ? 'bg-brand-100 border-2 border-brand-600 text-brand-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i < repsDone ? '✓' : i + 1}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Przycisk akcji */}
      <div className="px-4 pb-8 pt-3 bg-white border-t border-gray-100">
        <AnimatePresence mode="wait">
          {isCompleted ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-green-700 font-bold mb-3">Brawo! Ćwiczenie ukończone!</p>
              {nextId ? (
                <Link
                  href={`/pacjent/cwiczenie/${nextId}`}
                  className="w-full block bg-brand-600 text-white font-bold py-4 rounded-2xl text-center active:scale-95 transition"
                >
                  Następne ćwiczenie →
                </Link>
              ) : (
                <Link
                  href="/pacjent/cwiczenia"
                  className="w-full block bg-green-500 text-white font-bold py-4 rounded-2xl text-center active:scale-95 transition"
                >
                  🏆 Wróć do listy
                </Link>
              )}
            </motion.div>
          ) : (
            <motion.button
              key="tap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.95 }}
              onClick={addRep}
              disabled={saving}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-lg transition shadow-lg shadow-brand-600/30 active:scale-95"
            >
              {saving ? 'Zapisuję…' : `✓ Gotowe! (${repsDone + 1}/${totalReps})`}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Animacja confetti po ukończeniu */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/20 z-50 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 text-center shadow-2xl"
            >
              <div className="text-6xl mb-3">⭐</div>
              <p className="text-2xl font-bold text-brand-600">+20 punktów!</p>
              <p className="text-gray-500 text-sm mt-1">Świetna robota!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
