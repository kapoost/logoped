'use client'
// app/(logopeda)/plany/[id]/PlanEditForm.tsx

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/types/database'
import type { ExerciseCategory, DifficultyLevel } from '@/types/database'

interface PlanExerciseRow {
  id: string
  order_index: number
  repetitions: number
  notes: string | null
  exercises: {
    id: string
    title: string
    emoji: string
    category: ExerciseCategory
    difficulty: DifficultyLevel
    duration_seconds: number
  }
}

interface AvailableExercise {
  id: string
  title: string
  emoji: string
  category: ExerciseCategory
  difficulty: DifficultyLevel
  duration_seconds: number
  target_sounds: string[] | null
}

interface Props {
  planId:       string
  initialItems: PlanExerciseRow[]
  allExercises: AvailableExercise[]
  isActive:     boolean
  patientId:    string
}

export default function PlanEditForm({ planId, initialItems, allExercises, isActive, patientId }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [items,       setItems]       = useState(initialItems)
  const [showPicker,  setShowPicker]  = useState(false)
  const [filterQ,     setFilterQ]     = useState('')
  const [filterCat,   setFilterCat]   = useState<ExerciseCategory | ''>('')
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [toDelete,    setToDelete]    = useState<Set<string>>(new Set())

  const addedIds = new Set(items.map(i => i.exercises.id))

  const filtered = allExercises.filter(e => {
    const matchCat = !filterCat || e.category === filterCat
    const matchQ   = !filterQ   || e.title.toLowerCase().includes(filterQ.toLowerCase())
    return matchCat && matchQ && !addedIds.has(e.id)
  })

  function markDelete(id: string) {
    setToDelete(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function addExercise(ex: AvailableExercise) {
    const fakeId = `new-${Date.now()}-${ex.id}`
    setItems(prev => [...prev, {
      id: fakeId,
      order_index: prev.length,
      repetitions: 5,
      notes: null,
      exercises: { id: ex.id, title: ex.title, emoji: ex.emoji,
                   category: ex.category, difficulty: ex.difficulty,
                   duration_seconds: ex.duration_seconds },
    }])
    setShowPicker(false)
  }

  function moveItem(idx: number, dir: -1 | 1) {
    const next = idx + dir
    if (next < 0 || next >= items.length) return
    const arr = [...items]
    ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
    setItems(arr)
  }

  function updateItem(id: string, field: 'repetitions' | 'notes', value: string | number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  async function saveChanges() {
    setSaving(true)
    setSaved(false)

    // 1. Usuń zaznaczone (tylko istniejące, nie nowe)
    const existingToDelete = [...toDelete].filter(id => !id.startsWith('new-'))
    if (existingToDelete.length) {
      await fetch('/api/logopeda/update-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId, action: 'save_exercises', payload: {
          toDelete: existingToDelete, toUpdate: [], toInsert: [],
        }}),
      })
    }

    // 2. Aktualizuj istniejące (order + repetitions + notes)
    const existingItems = items.filter(i => !i.id.startsWith('new-') && !toDelete.has(i.id))
    await Promise.all(existingItems.map((item, idx) =>
      supabase.from('plan_exercises').update({
        order_index: idx,
        repetitions: item.repetitions,
        notes:       item.notes ?? null,
      }).eq('id', item.id)
    ))

    // 3. Wstaw nowe
    const newItems = items.filter(i => i.id.startsWith('new-') && !toDelete.has(i.id))
    if (newItems.length) {
      const insertOffset = existingItems.length
      await supabase.from('plan_exercises').insert(
        newItems.map((item, idx) => ({
          plan_id:     planId,
          exercise_id: item.exercises.id,
          order_index: insertOffset + idx,
          repetitions: item.repetitions,
          notes:       item.notes ?? null,
        }))
      )
    }

    setToDelete(new Set())
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    startTransition(() => router.refresh())
  }

  async function togglePlanActive() {
    await fetch('/api/logopeda/update-plan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId, action: 'toggle_active', payload: { is_active: !isActive } }),
    })
    startTransition(() => router.refresh())
  }

  const visibleItems = items.filter(i => !toDelete.has(i.id))
  const totalMin = Math.ceil(
    visibleItems.reduce((s, i) => s + i.exercises.duration_seconds * i.repetitions / 5, 0) / 60
  )

  return (
    <div className="space-y-3">
      {/* Nagłówek listy */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <h2 className="font-bold text-gray-800 text-sm">
            Ćwiczenia ({visibleItems.length} · ~{totalMin} min)
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPicker(p => !p)}
              className="text-xs bg-brand-50 text-brand-700 border border-brand-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-brand-100 transition"
            >
              + Dodaj
            </button>
            <button
              onClick={saveChanges}
              disabled={saving}
              className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg font-semibold disabled:opacity-60 transition"
            >
              {saving ? 'Zapisuję…' : saved ? '✓ Zapisano' : 'Zapisz'}
            </button>
          </div>
        </div>

        {/* Lista ćwiczeń */}
        {visibleItems.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            Brak ćwiczeń. Dodaj pierwsze klikając „+ Dodaj".
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {visibleItems.map((item, idx) => (
              <div key={item.id} className={clsx(
                'px-4 py-3 transition',
                item.id.startsWith('new-') && 'bg-green-50'
              )}>
                <div className="flex items-center gap-2 mb-1.5">
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button onClick={() => moveItem(idx, -1)} disabled={idx === 0}
                      className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none">▲</button>
                    <button onClick={() => moveItem(idx, 1)} disabled={idx === visibleItems.length - 1}
                      className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none">▼</button>
                  </div>

                  <span className="text-lg">{item.exercises.emoji}</span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {item.exercises.title}
                      {item.id.startsWith('new-') && (
                        <span className="ml-1.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">nowe</span>
                      )}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {DIFFICULTY_LABELS[item.exercises.difficulty]} · {CATEGORY_LABELS[item.exercises.category]}
                    </p>
                  </div>

                  {/* Powtórzenia */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => updateItem(item.id, 'repetitions', Math.max(1, item.repetitions - 1))}
                      className="w-7 h-7 bg-gray-100 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-200 flex items-center justify-center">−</button>
                    <span className="text-sm font-bold text-gray-900 w-6 text-center">{item.repetitions}</span>
                    <button onClick={() => updateItem(item.id, 'repetitions', Math.min(20, item.repetitions + 1))}
                      className="w-7 h-7 bg-gray-100 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-200 flex items-center justify-center">+</button>
                  </div>

                  {/* Usuń */}
                  <button onClick={() => markDelete(item.id)}
                    className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 transition text-lg leading-none flex-shrink-0">
                    ×
                  </button>
                </div>

                {/* Notatka */}
                <input
                  type="text"
                  value={item.notes ?? ''}
                  onChange={e => updateItem(item.id, 'notes', e.target.value)}
                  placeholder="Wskazówka dla pacjenta…"
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Picker ćwiczeń */}
      {showPicker && (
        <div className="bg-white rounded-2xl border border-brand-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50">
            <input
              autoFocus
              value={filterQ}
              onChange={e => setFilterQ(e.target.value)}
              placeholder="Szukaj ćwiczenia…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 mb-2"
            />
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button onClick={() => setFilterCat('')}
                className={clsx('flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium',
                  !filterCat ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600')}>
                Wszystkie
              </button>
              {(Object.entries(CATEGORY_LABELS) as [ExerciseCategory, string][]).map(([k, v]) => (
                <button key={k} onClick={() => setFilterCat(filterCat === k ? '' : k)}
                  className={clsx('flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium',
                    filterCat === k ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600')}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">Brak wyników.</p>
            ) : filtered.map(ex => (
              <button key={ex.id} onClick={() => addExercise(ex)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-green-50 transition">
                <span className="text-lg">{ex.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{ex.title}</p>
                  <p className="text-xs text-gray-400">
                    {DIFFICULTY_LABELS[ex.difficulty]} · {CATEGORY_LABELS[ex.category]}
                  </p>
                </div>
                <span className="text-green-600 text-lg">+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dezaktywacja planu */}
      <button
        onClick={togglePlanActive}
        className={clsx(
          'w-full py-3 rounded-2xl text-sm font-semibold border-2 border-dashed transition',
          isActive
            ? 'border-red-200 text-red-500 hover:bg-red-50'
            : 'border-green-300 text-green-700 hover:bg-green-50'
        )}
      >
        {isActive ? '⏸ Dezaktywuj plan' : '▶ Aktywuj plan'}
      </button>
    </div>
  )
}
