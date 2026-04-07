'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isDemo, getDemoReps, getDemoCompleted, setDemoReps } from '@/lib/demoProgress'
import { playRep, playExerciseDone, playSessionComplete } from '@/lib/sounds'
import { addDemoExercisePoints, addDemoSessionBonus } from '@/lib/demoStats'
import type { TodayExercise } from '@/types/database'

interface Props {
  exercise: TodayExercise
  nextId: string | null
  patientId: string
  isLastExercise: boolean
}

const DIFFICULTY_COLOR = {
  latwe:   'bg-green-100 text-green-700',
  srednie: 'bg-amber-100 text-amber-700',
  trudne:  'bg-red-100 text-red-700',
}
const DIFFICULTY_LABEL = { latwe: 'łatwe', srednie: 'średnie', trudne: 'trudne' }

export default function ExerciseView({ exercise: ex, nextId, patientId, isLastExercise }: Props) {
  const router   = useRouter()
  const supabase = createClient()
  const demo     = isDemo(patientId)

  const initReps = demo ? getDemoReps(ex.plan_exercise_id) : (ex.completed_today ? ex.repetitions : 0)
  const [repsDone, setRepsDone]           = useState(initReps)
  const [saving, setSaving]               = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [ripple, setRipple]               = useState(false)

  const totalReps   = ex.repetitions
  const isCompleted = (demo ? getDemoCompleted(ex.plan_exercise_id) : ex.completed_today) || repsDone >= totalReps
  const progress    = totalReps > 0 ? repsDone / totalReps : 0
  const circumference = 2 * Math.PI * 52

  const steps = ex.instructions
    .split('\n').map(s => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)

  const addRep = useCallback(async () => {
    if (repsDone >= totalReps || saving) return

    // Ripple effect
    setRipple(true)
    setTimeout(() => setRipple(false), 300)

    const next = repsDone + 1
    setRepsDone(next)

    if (next >= totalReps) {
      if (demo) {
        setDemoReps(ex.plan_exercise_id, next, true)
        addDemoExercisePoints()
        if (isLastExercise) addDemoSessionBonus()
        window.dispatchEvent(new Event('demo-stats-updated'))
        isLastExercise ? playSessionComplete() : playExerciseDone()
        await celebrate()
      } else {
        await markComplete()
      }
    } else {
      playRep()
      if (demo) setDemoReps(ex.plan_exercise_id, next, false)
    }
  }, [repsDone, totalReps, saving, demo, ex.plan_exercise_id, isLastExercise])

  async function markComplete() {
    setSaving(true)
    isLastExercise ? playSessionComplete() : playExerciseDone()

    const { error } = await supabase.from('exercise_completions').insert({
      patient_id:       patientId,
      plan_exercise_id: ex.plan_exercise_id,
      session_date:     new Date().toISOString().split('T')[0],
    }).select().single()

    setSaving(false)
    if (!error) await celebrate()
  }

  async function celebrate() {
    setShowCelebration(true)
    await new Promise(r => setTimeout(r, 1800))
    setShowCelebration(false)
    if (nextId) router.push(`/pacjent/cwiczenie/${nextId}`)
    else router.push('/pacjent/cwiczenia')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col select-none">

      {/* Nagłówek — minimalistyczny */}
      <div className="bg-brand-600 px-4 pt-5 pb-8 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
        <div className="absolute top-8 right-14 w-12 h-12 bg-white/5 rounded-full" />

        <Link href="/pacjent/cwiczenia"
          className="absolute top-5 left-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl"
        >
          ←
        </Link>

        {/* Duże emoji ćwiczenia */}
        <div className="flex flex-col items-center pt-2">
          <div className="text-7xl mb-2 drop-shadow">{ex.emoji}</div>
          <h1 className="text-xl font-black text-white text-center px-8">{ex.title}</h1>
          <span className={`mt-2 text-xs font-bold px-3 py-1 rounded-full ${DIFFICULTY_COLOR[ex.difficulty]} bg-opacity-90`}>
            {DIFFICULTY_LABEL[ex.difficulty]}
          </span>
        </div>
      </div>

      {/* Kołowy licznik — główny element */}
      <div className="flex flex-col items-center -mt-8 mb-4">
        <div className="bg-white rounded-full shadow-xl p-3 relative" style={{ width: 140, height: 140 }}>
          <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10"/>
            <circle cx="60" cy="60" r="52" fill="none"
              stroke="#7c3aed" strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-brand-700">{repsDone}</span>
            <span className="text-xs text-gray-400 font-semibold">/ {totalReps}</span>
          </div>
        </div>

        {/* Kółka powtórzeń */}
        <div className="flex gap-1.5 mt-3 flex-wrap justify-center px-8 max-w-xs">
          {Array.from({ length: totalReps }).map((_, i) => (
            <div key={i}
              className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                i < repsDone
                  ? 'bg-brand-600 border-brand-600 scale-110'
                  : 'bg-white border-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Instrukcje — zwinięte, tylko kluczowe kroki */}
      <div className="flex-1 px-4 space-y-3 overflow-y-auto pb-4">
        {ex.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex gap-3">
            <span className="text-xl flex-shrink-0">💬</span>
            <p className="text-sm text-amber-800 font-medium">{ex.notes}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {steps.slice(0, 3).map((step, i) => (
            <div key={i} className={`flex gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
              <span className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
            </div>
          ))}
          {steps.length > 3 && (
            <div className="px-4 py-2 border-t border-gray-50 text-xs text-gray-400 text-center">
              +{steps.length - 3} więcej kroków
            </div>
          )}
        </div>
      </div>

      {/* GŁÓWNY PRZYCISK — ogromny, tapowy */}
      <div className="px-4 pb-8 pt-2">
        {isCompleted ? (
          <div className="bg-green-500 text-white font-black text-xl py-5 rounded-2xl text-center shadow-lg shadow-green-200">
            ✓ Zrobione! +20 ⭐
          </div>
        ) : (
          <button
            onClick={addRep}
            disabled={saving}
            className={`relative w-full font-black text-xl py-5 rounded-2xl text-white shadow-lg transition-all duration-150 overflow-hidden
              ${saving
                ? 'bg-brand-400 cursor-wait'
                : 'bg-brand-600 shadow-brand-200 active:scale-95 active:shadow-none'
              }`}
          >
            {/* Ripple */}
            <AnimatePresence>
              {ripple && (
                <motion.div
                  className="absolute inset-0 bg-white/30 rounded-2xl"
                  initial={{ opacity: 0.6, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </AnimatePresence>

            {saving ? '💾 Zapisuję…' : repsDone === totalReps - 1
              ? `🎉 Ostatnie! (${repsDone + 1}/${totalReps})`
              : `+1 powtórzenie (${repsDone + 1}/${totalReps})`
            }
          </button>
        )}
      </div>

      {/* Celebracja */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6"
          >
            <motion.div
              initial={{ scale: 0.5, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 12 }}
              className="bg-white rounded-3xl p-8 text-center w-full max-w-xs shadow-2xl"
            >
              <div className="text-7xl mb-3">
                {isLastExercise ? '🏆' : '🎉'}
              </div>
              <p className="text-2xl font-black text-gray-900">
                {isLastExercise ? 'Wszystko gotowe!' : 'Super!'}
              </p>
              <p className="text-gray-500 mt-1 text-sm">
                {isLastExercise ? 'Ukończyłeś wszystkie ćwiczenia!' : '+20 punktów!'}
              </p>
              {isLastExercise && (
                <p className="text-yellow-500 font-black text-lg mt-2">+50 ⭐ bonus!</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
