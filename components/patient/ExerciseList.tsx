'use client'
import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { isDemo, getAllDemoCompleted, setDemoReps } from '@/lib/demoProgress'
import { addDemoExercisePoints, addDemoSessionBonus } from '@/lib/demoStats'
import { playExerciseDone, playSessionComplete } from '@/lib/sounds'
import Confetti from './Confetti'
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
  const [confettiKey, setConfettiKey] = useState(0)

  // Replay
  const [replaying, setReplaying]   = useState(false)
  const [replayDone, setReplayDone] = useState<Set<string>>(new Set())

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

  // Prawdziwy postęp dnia
  const done    = exercises.filter(e => e.completed_today).length
  const total   = exercises.length
  const allDone = done === total && total > 0
  const replayAllDone = replaying && replayDone.size === total

  function isExDone(ex: TodayExercise) {
    if (replaying) return replayDone.has(ex.plan_exercise_id)
    return ex.completed_today
  }

  async function markDone(ex: TodayExercise) {
    if (isExDone(ex)) return

    setJustDone(ex.plan_exercise_id)
    setTimeout(() => setJustDone(null), 600)

    if (replaying) {
      const newSet = new Set(replayDone)
      newSet.add(ex.plan_exercise_id)
      setReplayDone(newSet)
      if (newSet.size === total) {
        setTimeout(() => playSessionComplete(), 100)
      } else {
        playExerciseDone()
      }
      return
    }

    // Normalny tryb
    setExercises(prev => prev.map(e =>
      e.plan_exercise_id === ex.plan_exercise_id
        ? { ...e, completed_today: true }
        : e
    ))

    const prevDone = exercises.filter(e => e.completed_today).length
    const newDone = prevDone + 1
    if (newDone === total) {
      setTimeout(() => playSessionComplete(), 100)
      setConfettiKey(k => k + 1)
    } else {
      playExerciseDone()
    }

    if (demo) {
      setDemoReps(ex.plan_exercise_id, ex.repetitions, true)
      addDemoExercisePoints()
      const newDoneCount = exercises.filter(e => e.completed_today).length + 1
      if (newDoneCount >= total) addDemoSessionBonus()
      window.dispatchEvent(new Event('demo-stats-updated'))
      return
    }

    const res = await fetch('/api/pacjent/complete-exercise', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_exercise_id: ex.plan_exercise_id }),
    })
    if (!res.ok) {
      setExercises(initial)
    } else {
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="px-3 pb-6 space-y-3">
      <Confetti trigger={confettiKey > 0} key={confettiKey} />

      {/* Pasek postępu — animowany */}
      <div className="py-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dzisiaj</span>
          <motion.span
            key={done}
            initial={{ scale: 1.4, color: '#7c3aed' }}
            animate={{ scale: 1, color: '#7c3aed' }}
            className="text-sm font-bold"
          >
            {done}/{total}
          </motion.span>
        </div>
        <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full"
            initial={false}
            animate={{ width: total > 0 ? `${(done/total)*100}%` : '0%' }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          />
        </div>
        {/* Gwiazdki postępu */}
        <div className="flex justify-center gap-1.5 mt-2">
          {Array.from({ length: total }).map((_, i) => (
            <motion.span
              key={i}
              initial={false}
              animate={i < done
                ? { opacity: 1, scale: 1.15, rotate: [0, 15, -15, 0] }
                : { opacity: 0.2, scale: 1, rotate: 0 }
              }
              transition={i < done
                ? { duration: 0.4, delay: i * 0.08 }
                : { duration: 0.2 }
              }
              className="text-lg inline-block"
            >
              ⭐
            </motion.span>
          ))}
        </div>
      </div>

      {/* Wszystko zrobione — normalny tryb */}
      <AnimatePresence>
        {allDone && !replaying && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 12 }}
            className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl p-6 text-center text-white shadow-lg shadow-green-200"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-6xl mb-2"
            >
              🎉
            </motion.div>
            <p className="text-xl font-black">Super robota!</p>
            <p className="text-green-100 text-sm mt-1">Ćwiczenia na dziś zrobione!</p>
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="text-yellow-200 font-bold mt-2"
            >
              +50 ⭐ punktów!
            </motion.p>
            <button
              onClick={() => { setReplaying(true); setReplayDone(new Set()) }}
              className="mt-4 bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-2xl transition active:scale-95 text-base"
            >
              🔁 Jeszcze raz!
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replay zakończony */}
      <AnimatePresence>
        {replayAllDone && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 12 }}
            className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-3xl p-6 text-center text-white shadow-lg shadow-blue-200"
          >
            <div className="text-6xl mb-2">💪</div>
            <p className="text-xl font-black">Brawo, powtórka zrobiona!</p>
            <p className="text-blue-100 text-sm mt-1">Ćwiczenie czyni mistrza!</p>
            <button
              onClick={() => setReplayDone(new Set())}
              className="mt-4 bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-2xl transition active:scale-95 text-base"
            >
              🔁 Jeszcze raz!
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duży przycisk START — normalny tryb */}
      {!allDone && !replaying && (() => {
        const nextEx = exercises.find(e => !e.completed_today)
        if (!nextEx) return null
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <Link
              href={`/pacjent/cwiczenie/${nextEx.plan_exercise_id}`}
              className="block bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl p-6 text-center text-white shadow-lg shadow-brand-200 active:scale-95 transition-transform"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-5xl mb-2"
              >
                {nextEx.emoji}
              </motion.div>
              <p className="text-2xl font-black">
                {done === 0 ? 'Zacznij ćwiczenia!' : 'Kontynuuj!'}
              </p>
              <p className="text-brand-200 text-sm mt-1">
                {done === 0
                  ? `${total} ćwiczeń na dziś`
                  : `Jeszcze ${total - done} do zrobienia`
                }
              </p>
            </Link>
          </motion.div>
        )
      })()}

      {/* Duży przycisk START — replay */}
      {replaying && !replayAllDone && (() => {
        const nextEx = exercises.find(e => !replayDone.has(e.plan_exercise_id))
        if (!nextEx) return null
        return (
          <Link
            href={`/pacjent/cwiczenie/${nextEx.plan_exercise_id}`}
            className="block bg-gradient-to-br from-blue-500 to-indigo-700 rounded-3xl p-6 text-center text-white shadow-lg shadow-blue-200 active:scale-95 transition-transform"
          >
            <div className="text-5xl mb-2">{nextEx.emoji}</div>
            <p className="text-2xl font-black">
              {replayDone.size === 0 ? 'Powtórka!' : 'Kontynuuj!'}
            </p>
            <p className="text-blue-200 text-sm mt-1">
              Jeszcze {total - replayDone.size} do zrobienia
            </p>
          </Link>
        )
      })()}

      {/* Karty ćwiczeń z animacjami */}
      <AnimatePresence mode="popLayout">
        {exercises.map((ex, idx) => {
          const exDone = isExDone(ex)
          const prevAllDone = exercises.slice(0, idx).every(e => isExDone(e))
          const isNext = !exDone && prevAllDone
          const isJust = justDone === ex.plan_exercise_id

          if (exDone) {
            return (
              <motion.div
                key={ex.plan_exercise_id}
                layout
                initial={isJust ? { scale: 0.95 } : false}
                animate={{ scale: isJust ? 1.03 : 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="flex items-center gap-4 bg-green-50 border-2 border-green-200 rounded-2xl px-4 py-3"
              >
                <motion.div
                  initial={isJust ? { rotate: -20 } : false}
                  animate={{ rotate: 0 }}
                  className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 shadow-sm"
                >
                  {ex.emoji}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-green-800 truncate">{ex.title}</p>
                  {!replaying && <p className="text-green-500 text-sm font-semibold">+20 ⭐</p>}
                </div>
                <motion.div
                  initial={isJust ? { scale: 0, rotate: -180 } : false}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-lg flex-shrink-0"
                >
                  ✓
                </motion.div>
              </motion.div>
            )
          }

          if (isNext) {
            return (
              <motion.div
                key={ex.plan_exercise_id}
                layout
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 20 }}
                className="rounded-2xl overflow-hidden shadow-md shadow-brand-100 border-2 border-brand-200"
              >
                <Link href={`/pacjent/cwiczenie/${ex.plan_exercise_id}`}
                  className="flex items-center gap-4 bg-white px-4 pt-4 pb-2 active:bg-brand-50 transition"
                >
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 shadow"
                  >
                    {ex.emoji}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-brand-900 text-lg truncate">{ex.title}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {ex.repetitions}×
                      </span>
                    </div>
                  </div>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="bg-brand-600 text-white text-xs font-black px-3 py-2 rounded-xl flex-shrink-0"
                  >
                    TERAZ
                  </motion.div>
                </Link>
                <button
                  onClick={() => markDone(ex)}
                  className="w-full bg-brand-600 text-white font-bold py-3.5 text-base active:bg-brand-700 transition flex items-center justify-center gap-2"
                >
                  <span className="text-lg">✓</span> Gotowe!
                </button>
              </motion.div>
            )
          }

          // Czekające
          return (
            <motion.div
              key={ex.plan_exercise_id}
              layout
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
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
