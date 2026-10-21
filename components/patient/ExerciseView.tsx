'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { isDemo, getDemoReps, getDemoCompleted, setDemoReps } from '@/lib/demoProgress'
import { playRep, playExerciseDone, playSessionComplete } from '@/lib/sounds'
import { addDemoExercisePoints, addDemoSessionBonus } from '@/lib/demoStats'
import Confetti from './Confetti'
import ExerciseImage from '@/components/shared/ExerciseImage'
import PrzekrojJamyUstnej from '@/components/shared/PrzekrojJamyUstnej'
import type { TodayExercise } from '@/types/database'

const DIFFICULTY_COLOR = {
  latwe:   'bg-green-100 text-green-700',
  srednie: 'bg-amber-100 text-amber-700',
  trudne:  'bg-red-100 text-red-700',
}
const DIFFICULTY_LABEL = { latwe: 'łatwe', srednie: 'średnie', trudne: 'trudne' }

interface Props {
  exercise: TodayExercise
  nextId: string | null
  patientId: string
  isLastExercise: boolean
}

export default function ExerciseView({ exercise: ex, nextId, patientId, isLastExercise }: Props) {
  const router   = useRouter()
  const demo = isDemo(patientId)

  const initCompleted = demo ? getDemoCompleted(ex.plan_exercise_id) : ex.completed_today
  const initReps      = demo ? getDemoReps(ex.plan_exercise_id) : (ex.completed_today ? ex.repetitions : 0)

  const [repsDone, setRepsDone]             = useState(initReps)
  const [completed, setCompleted]           = useState(!!initCompleted || initReps >= ex.repetitions)
  const [saving, setSaving]                 = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [ripple, setRipple]                 = useState(false)

  const totalReps   = ex.repetitions
  const progress    = totalReps > 0 ? Math.min(repsDone / totalReps, 1) : 0

  const steps = ex.instructions
    .split('\n').map(s => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)

  // Powtórz ćwiczenie — reset licznika (nie usuwa completion z bazy)
  function repeatExercise() {
    setRepsDone(0)
    setCompleted(false)
    if (demo) setDemoReps(ex.plan_exercise_id, 0, false)
  }


  const addRep = useCallback(async () => {
    if (repsDone >= totalReps || saving || completed) return

    setRipple(true)
    setTimeout(() => setRipple(false), 300)

    const next = repsDone + 1
    setRepsDone(next)

    if (next >= totalReps) {
      setCompleted(true)
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
  }, [repsDone, totalReps, saving, completed, demo, ex.plan_exercise_id, isLastExercise])

  async function markComplete() {
    setSaving(true)
    isLastExercise ? playSessionComplete() : playExerciseDone()

    const res = await fetch('/api/pacjent/complete-exercise', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_exercise_id: ex.plan_exercise_id }),
    })
    const error = res.ok ? null : (await res.json()).error

    setSaving(false)
    if (!error) await celebrate()
    else setCompleted(false) // rollback
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
    <div className="h-full overflow-hidden bg-gray-50 flex flex-col select-none">
      <Confetti trigger={showCelebration} type={isLastExercise ? 'levelup' : 'celebration'} />

      {/* Nagłówek */}
      <div className="bg-brand-600 px-4 pt-3 pb-6 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
        <div className="relative flex items-center h-10 mb-1">
          <Link href="/pacjent/cwiczenia"
            data-testid="wyjscie"
            className="h-10 pl-3 pr-4 bg-white/20 rounded-full flex items-center gap-1.5 text-white font-bold text-sm active:scale-95 transition"
          >
            <span className="text-lg leading-none">←</span> Wyjdź
          </Link>
        </div>

        <div className="flex flex-col items-center">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="text-8xl mb-3 drop-shadow-lg w-[clamp(8rem,30vh,16rem)] h-[clamp(8rem,30vh,16rem)] [@media(max-height:720px)]:w-40 [@media(max-height:720px)]:h-40 rounded-[2rem] overflow-hidden flex items-center justify-center"
          >
            <ExerciseImage src={ex.media_url} emoji={ex.emoji} title={ex.title} size={448} priority />
          </motion.div>
          <h1 className="text-xl font-black text-white text-center px-8">{ex.title}</h1>
          <span className={`mt-2 text-xs font-bold px-3 py-1 rounded-full ${DIFFICULTY_COLOR[ex.difficulty]}`}>
            {DIFFICULTY_LABEL[ex.difficulty]}
          </span>
        </div>
      </div>

      {/* Pasek postępu — jeden element zamiast pierścienia 140 px i rzędu
          kropek pod nim. Oba pokazywały tę samą liczbę, a razem z marginesami
          zajmowały 176 px zmierzonej wysokości; ten pasek zajmuje 36 px.
          Przy wielu powtórzeniach segmenty ustępują ciągłemu wypełnieniu,
          bo czternaście kapsułek w 390 px to już nie jest informacja. */}
      <div
        data-testid="licznik-powtorzen"
        className={`mx-4 my-3 h-9 px-3.5 rounded-full flex items-center justify-between gap-3 border transition-colors ${
          completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 shadow-sm'
        }`}
      >
        <div className="flex items-baseline gap-1.5 flex-shrink-0">
          {completed
            ? <span className="text-green-700 font-black text-lg leading-none">✓ Gotowe</span>
            : <>
                <span className="font-black text-xl leading-none text-brand-700 tabular-nums">{repsDone}</span>
                <span className="text-sm font-bold text-gray-400 leading-none">z {totalReps}</span>
              </>
          }
        </div>

        {totalReps <= 8 ? (
          <div className="flex items-center gap-1.5" data-testid="segmenty">
            {Array.from({ length: totalReps }).map((_, i) => (
              <motion.span
                key={i}
                initial={false}
                animate={i < repsDone
                  ? { backgroundColor: completed ? '#16a34a' : '#7c3aed', width: 18 }
                  : { backgroundColor: '#e5e7eb', width: 10 }}
                transition={i === repsDone - 1
                  ? { type: 'spring', stiffness: 500, damping: 18 }
                  : { duration: 0.2 }}
                className="h-2.5 rounded-full block"
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 h-2.5 rounded-full bg-gray-200 overflow-hidden" data-testid="segmenty">
            <motion.div
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`h-full rounded-full ${completed ? 'bg-green-600' : 'bg-brand-600'}`}
            />
          </div>
        )}
      </div>

      {/* Instrukcje */}
      <div className="flex-1 min-h-0 px-4 space-y-3 overflow-y-auto pb-2">
        {/* Opis mówi PO CO jest ćwiczenie, kroki mówią JAK — stąd nad nimi.
            Pole było w danych i w typie TodayExercise od początku, ale nic go
            nie renderowało, więc dziecko widziało obrazek, tytuł i od razu kroki. */}
        {/* Wersja dziecięca, a bez niej kliniczna — tak było do tej pory.
            Dzięki temu ekran działa też zanim migracja 013 wejdzie na bazę:
            kolumny po prostu nie ma i fallback załatwia sprawę. */}
        {(ex.description_child || ex.description) && (
          <p className="text-sm text-gray-500 px-1 leading-relaxed">
            {ex.description_child || ex.description}
          </p>
        )}

        {ex.therapist_notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex gap-3">
            <span className="text-xl flex-shrink-0">💬</span>
            <p className="text-sm text-amber-800 font-medium">{ex.therapist_notes}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {steps.map((step, i) => (
            <div key={i} className={`flex gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
              <span className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        {/* Przekrój pokazuje to, czego ilustracja z bohaterem nie pokaże —
            układ języka w jamie ustnej. Dziecko widzi wyłącznie pozycje
            zaakceptowane przez logopedę. */}
        <PrzekrojJamyUstnej gloski={ex.target_sounds} dlaPacjenta />
      </div>

      {/* Przyciski akcji */}
      <div className="px-4 pb-8 pt-2 space-y-2">
        {(completed || repsDone >= totalReps) ? (
          <>
            <div className="bg-green-500 text-white font-black text-xl py-5 rounded-2xl text-center shadow-lg shadow-green-200">
              ✓ Zrobione! +20 ⭐
            </div>
            {/* Powtórz ćwiczenie */}
            <button
              onClick={repeatExercise}
              className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-2xl text-sm active:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              🔄 Powtórz ćwiczenie
            </button>
          </>
        ) : (
          <button
            onClick={addRep}
            disabled={saving}
            className={`relative w-full font-black text-xl py-5 rounded-2xl text-white shadow-lg transition-all duration-150 overflow-hidden
              ${saving ? 'bg-brand-400 cursor-wait' : 'bg-brand-600 shadow-brand-200 active:scale-95 active:shadow-none'}`}
          >
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
            {saving ? '💾 Zapisuję…'
              : repsDone === 0 ? `Zacznij! (0/${totalReps})`
              : repsDone === totalReps - 1 ? `🎉 Ostatnie! (${repsDone + 1}/${totalReps})`
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
              <div className="text-7xl mb-3">{isLastExercise ? '🏆' : '🎉'}</div>
              <p className="text-2xl font-black text-gray-900">
                {isLastExercise ? 'Wszystko gotowe!' : 'Super!'}
              </p>
              <p className="text-gray-500 mt-1 text-sm">
                {isLastExercise ? 'Ukończyłeś wszystkie ćwiczenia!' : '+20 punktów!'}
              </p>
              {isLastExercise && <p className="text-yellow-500 font-black text-lg mt-2">+50 ⭐ bonus!</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
