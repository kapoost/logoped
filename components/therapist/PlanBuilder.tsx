'use client'
// components/therapist/PlanBuilder.tsx

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/types/database'
import type { ExerciseCategory, DifficultyLevel } from '@/types/database'

interface Exercise {
  id: string
  title: string
  category: ExerciseCategory
  difficulty: DifficultyLevel
  emoji: string
  duration_seconds: number
  target_sounds: string[] | null
}

interface Patient { patient_id: string; full_name: string }

interface PlanItem {
  exercise:    Exercise
  repetitions: number
  notes:       string
}

interface Props {
  patients:             Patient[]
  exercises:            Exercise[]
  therapistId:          string
  preselectedPatientId?: string
}

const DAYS = ['Pn','Wt','Śr','Cz','Pt','So','Nd']

export default function PlanBuilder({ patients, exercises, therapistId, preselectedPatientId }: Props) {
  const router  = useRouter()
  // ── Stan planu ────────────────────────────────────────────
  const [patientId,   setPatientId]   = useState(preselectedPatientId ?? '')
  const [planName,    setPlanName]    = useState('')
  const [planDesc,    setPlanDesc]    = useState('')
  const [items,       setItems]       = useState<PlanItem[]>([])
  const [daysOfWeek,  setDaysOfWeek]  = useState<number[]>([0,1,2,3,4,5,6])
  const [reminderTime, setReminderTime] = useState('18:00')

  // ── Filtrowanie bazy ćwiczeń ──────────────────────────────
  const [filterCat,  setFilterCat]  = useState<ExerciseCategory | ''>('')
  const [filterQ,    setFilterQ]    = useState('')

  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [step,    setStep]    = useState<1|2|3>(1)   // 1=info, 2=ćwiczenia, 3=harmonogram

  // ── Filtrowane ćwiczenia ──────────────────────────────────
  const filteredExercises = useMemo(() => {
    return exercises.filter(e => {
      const matchCat = !filterCat || e.category === filterCat
      const matchQ   = !filterQ   || e.title.toLowerCase().includes(filterQ.toLowerCase())
      return matchCat && matchQ
    })
  }, [exercises, filterCat, filterQ])

  const addedIds = new Set(items.map(i => i.exercise.id))

  function addExercise(ex: Exercise) {
    if (addedIds.has(ex.id)) return
    setItems(prev => [...prev, { exercise: ex, repetitions: 5, notes: '' }])
  }

  function removeExercise(id: string) {
    setItems(prev => prev.filter(i => i.exercise.id !== id))
  }

  function updateItem(id: string, field: 'repetitions' | 'notes', value: string | number) {
    setItems(prev => prev.map(i =>
      i.exercise.id === id ? { ...i, [field]: value } : i
    ))
  }

  function moveItem(id: string, dir: -1 | 1) {
    setItems(prev => {
      const idx  = prev.findIndex(i => i.exercise.id === id)
      const next = idx + dir
      if (next < 0 || next >= prev.length) return prev
      const arr = [...prev]
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr
    })
  }

  function toggleDay(d: number) {
    setDaysOfWeek(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()
    )
  }

  async function savePlan() {
    if (!patientId)       { setError('Wybierz pacjenta.'); setStep(1); return }
    if (!planName.trim()) { setError('Podaj nazwę planu.'); setStep(1); return }
    if (items.length === 0) { setError('Dodaj co najmniej jedno ćwiczenie.'); setStep(2); return }
    if (daysOfWeek.length === 0) { setError('Wybierz co najmniej jeden dzień.'); setStep(3); return }

    setSaving(true)
    setError(null)

    // Użyj API route — serwer widzi sesję z httpOnly cookies
    const res = await fetch('/api/logopeda/create-plan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id:  patientId,
        name:        planName.trim(),
        description: planDesc.trim() || null,
        exercises: items.map((item, idx) => ({
          exercise_id: item.exercise.id,
          order_index: idx,
          repetitions: item.repetitions,
          notes:       item.notes.trim() || null,
        })),
        schedule: { days_of_week: daysOfWeek, reminder_time: reminderTime },
      }),
    })

    const result = await res.json()
    if (!res.ok) {
      setError('Błąd tworzenia planu: ' + result.error)
      setSaving(false)
      return
    }
    const plan = { id: result.plan_id }

    if (false) {
      console.warn('Harmonogram nie zapisany:', '')
    }

    router.push(`/logopeda/pacjenci/${patientId}`)
    router.refresh()
  }

  // ── Szacowany czas sesji ─────────────────────────────────
  const totalSeconds = items.reduce((s, i) => s + i.exercise.duration_seconds * i.repetitions / 5, 0)
  const totalMin     = Math.ceil(totalSeconds / 60)

  return (
    <div className="space-y-4 pb-8">
      {/* Pasek kroków */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center gap-2">
          {([1,2,3] as const).map(s => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={clsx(
                'flex-1 py-2 rounded-xl text-sm font-semibold transition',
                step === s
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              )}
            >
              {s === 1 ? '1. Info' : s === 2 ? `2. Ćwiczenia (${items.length})` : '3. Harmonogram'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── KROK 1: Info o planie ── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Pacjent <span className="text-red-500">*</span>
            </label>
            <select
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm bg-white"
            >
              <option value="">— Wybierz pacjenta —</option>
              {patients.map(p => (
                <option key={p.patient_id} value={p.patient_id}>{p.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nazwa planu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              placeholder="np. Ćwiczenia na głoskę R — etap 1"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Opis (opcjonalny)
            </label>
            <textarea
              value={planDesc}
              onChange={e => setPlanDesc(e.target.value)}
              rows={2}
              placeholder="Notatki dla siebie lub rodzica…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm resize-none"
            />
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!patientId || !planName.trim()}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
          >
            Dalej → Wybierz ćwiczenia
          </button>
        </div>
      )}

      {/* ── KROK 2: Ćwiczenia ── */}
      {step === 2 && (
        <div className="space-y-3">
          {/* Wybrane ćwiczenia */}
          {items.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-bold text-gray-800 text-sm">
                  Plan ({items.length} ćwiczeń · ~{totalMin} min)
                </h2>
                <button
                  onClick={() => setStep(3)}
                  className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg font-semibold"
                >
                  Dalej →
                </button>
              </div>

              <div className="divide-y divide-gray-50">
                {items.map((item, idx) => (
                  <div key={item.exercise.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveItem(item.exercise.id, -1)}
                          disabled={idx === 0}
                          className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none"
                        >▲</button>
                        <button
                          onClick={() => moveItem(item.exercise.id, 1)}
                          disabled={idx === items.length - 1}
                          className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none"
                        >▼</button>
                      </div>

                      <span className="text-xl">{item.exercise.emoji}</span>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {item.exercise.title}
                        </p>
                      </div>

                      {/* Powtórzenia */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateItem(item.exercise.id, 'repetitions', Math.max(1, item.repetitions - 1))}
                          className="w-7 h-7 bg-gray-100 rounded-lg text-gray-700 font-bold hover:bg-gray-200 transition flex items-center justify-center text-sm"
                        >−</button>
                        <span className="text-sm font-bold text-gray-800 w-6 text-center">
                          {item.repetitions}
                        </span>
                        <button
                          onClick={() => updateItem(item.exercise.id, 'repetitions', Math.min(20, item.repetitions + 1))}
                          className="w-7 h-7 bg-gray-100 rounded-lg text-gray-700 font-bold hover:bg-gray-200 transition flex items-center justify-center text-sm"
                        >+</button>
                      </div>

                      <button
                        onClick={() => removeExercise(item.exercise.id)}
                        className="text-gray-300 hover:text-red-500 transition text-lg leading-none ml-1"
                      >×</button>
                    </div>

                    <input
                      type="text"
                      value={item.notes}
                      onChange={e => updateItem(item.exercise.id, 'notes', e.target.value)}
                      placeholder="Wskazówka dla pacjenta (opcjonalnie)…"
                      className="w-full px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Baza ćwiczeń do wyboru */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h2 className="font-bold text-gray-800 text-sm mb-2">Dodaj ćwiczenia</h2>
              <input
                value={filterQ}
                onChange={e => setFilterQ(e.target.value)}
                placeholder="Szukaj…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 mb-2"
              />
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setFilterCat('')}
                  className={clsx('flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium transition',
                    !filterCat ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600')}
                >
                  Wszystkie
                </button>
                {(Object.entries(CATEGORY_LABELS) as [ExerciseCategory, string][]).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setFilterCat(filterCat === k ? '' : k)}
                    className={clsx('flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium transition',
                      filterCat === k ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600')}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
              {filteredExercises.map(ex => {
                const isAdded = addedIds.has(ex.id)
                return (
                  <button
                    key={ex.id}
                    onClick={() => addExercise(ex)}
                    disabled={isAdded}
                    className={clsx(
                      'w-full px-4 py-3 flex items-center gap-3 text-left transition',
                      isAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-green-50 active:bg-green-100'
                    )}
                  >
                    <span className="text-xl">{ex.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{ex.title}</p>
                      <p className="text-xs text-gray-400">
                        {DIFFICULTY_LABELS[ex.difficulty]}
                        {ex.target_sounds?.length ? ` · ${ex.target_sounds.join(', ')}` : ''}
                      </p>
                    </div>
                    <span className={clsx(
                      'text-xl flex-shrink-0 transition',
                      isAdded ? 'text-green-500' : 'text-gray-300'
                    )}>
                      {isAdded ? '✓' : '+'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── KROK 3: Harmonogram ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Dni tygodnia</p>
              <div className="flex gap-2">
                {DAYS.map((d, i) => (
                  <button
                    key={d}
                    onClick={() => toggleDay(i)}
                    className={clsx(
                      'flex-1 py-2.5 rounded-xl text-xs font-bold transition',
                      daysOfWeek.includes(i)
                        ? 'bg-green-700 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {daysOfWeek.length === 7
                  ? 'Codziennie'
                  : `${daysOfWeek.length} dni w tygodniu`}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Godzina przypomnienia 🔔
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Papuga wyśle przypomnienie o tej godzinie (jeśli pacjent włączy powiadomienia).
              </p>
            </div>
          </div>

          {/* Podsumowanie */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-1 text-sm">
            <p className="font-bold text-green-800 mb-2">Podsumowanie planu</p>
            <p className="text-green-700">👤 Pacjent: <strong>{patients.find(p => p.patient_id === patientId)?.full_name ?? '—'}</strong></p>
            <p className="text-green-700">📋 Plan: <strong>{planName}</strong></p>
            <p className="text-green-700">💪 Ćwiczeń: <strong>{items.length}</strong> (~{totalMin} min/dzień)</p>
            <p className="text-green-700">📅 Dni: <strong>{daysOfWeek.length === 7 ? 'codziennie' : `${daysOfWeek.length} dni w tygodniu`}</strong></p>
            <p className="text-green-700">🔔 Przypomnienie: <strong>{reminderTime}</strong></p>
          </div>

          <button
            onClick={savePlan}
            disabled={saving}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-base transition shadow-lg shadow-green-700/20 active:scale-95"
          >
            {saving ? 'Zapisuję plan…' : '✓ Zapisz plan ćwiczeń'}
          </button>
        </div>
      )}
    </div>
  )
}
