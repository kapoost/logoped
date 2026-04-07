'use client'
// app/logopeda/cwiczenia/nowe/NewExerciseForm.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORY_LABELS } from '@/types/database'
import type { ExerciseCategory, DifficultyLevel } from '@/types/database'

const EMOJIS = ['👅','👄','💨','🔤','👂','🐍','🐱','🔔','🎯','🦷','🎤','🐸','💪','🌸','🎈','🥤','🪶','🧘','🐘','😛','😮','😁']

interface Props {
  therapistId: string
  isAdmin?:    boolean
  onSuccess?:  () => void
}

export default function NewExerciseForm({ therapistId, isAdmin, onSuccess }: Props) {
  const router = useRouter()

  const [title,        setTitle]        = useState('')
  const [description,  setDescription]  = useState('')
  const [instructions, setInstructions] = useState('')
  const [category,     setCategory]     = useState<ExerciseCategory>('jezyka')
  const [difficulty,   setDifficulty]   = useState<DifficultyLevel>('latwe')
  const [emoji,        setEmoji]        = useState('👅')
  const [sounds,       setSounds]       = useState('')
  const [duration,     setDuration]     = useState(60)
  const [isPublic,     setIsPublic]     = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [success,      setSuccess]      = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !instructions.trim()) {
      setError('Nazwa i instrukcja są wymagane.')
      return
    }

    setSaving(true)
    setError(null)

    const target_sounds = sounds
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)

    // Użyj API route (serwer widzi sesję z httpOnly cookies)
    const res = await fetch('/api/logopeda/create-exercise', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:            title.trim(),
        description:      description.trim() || null,
        instructions:     instructions.trim(),
        category,
        difficulty,
        emoji,
        target_sounds,
        duration_seconds: duration,
        is_public:        isAdmin ? true : isPublic,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError('Błąd zapisu: ' + (data.error ?? 'nieznany błąd'))
      return
    }

    setSuccess(true)
    onSuccess?.()
    setTimeout(() => {
      router.push(isAdmin ? '/admin/cwiczenia' : '/logopeda/cwiczenia')
      router.refresh()
    }, 1200)
  }

  if (success) return (
    <div className="text-center py-8">
      <div className="text-5xl mb-3">✅</div>
      <p className="font-bold text-green-700 text-lg">Ćwiczenie dodane!</p>
      <p className="text-sm text-gray-500 mt-1">Przekierowuję…</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Emoji picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ikona ćwiczenia</label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map(e => (
            <button key={e} type="button" onClick={() => setEmoji(e)}
              className={`text-2xl w-10 h-10 rounded-xl border-2 flex items-center justify-center transition
                ${emoji === e ? 'border-green-600 bg-green-50 scale-110' : 'border-gray-200 hover:border-gray-300'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Nazwa */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nazwa ćwiczenia <span className="text-red-500">*</span>
        </label>
        <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
          placeholder="np. Trąbka językiem"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm" />
      </div>

      {/* Kategoria i trudność */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
          <select value={category} onChange={e => setCategory(e.target.value as ExerciseCategory)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm bg-white">
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trudność</label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value as DifficultyLevel)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm bg-white">
            <option value="latwe">Łatwe</option>
            <option value="srednie">Średnie</option>
            <option value="trudne">Trudne</option>
          </select>
        </div>
      </div>

      {/* Czas i głoski */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Czas (sekundy)</label>
          <input type="number" min={10} max={600} value={duration} onChange={e => setDuration(+e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Głoski (opcja)</label>
          <input type="text" value={sounds} onChange={e => setSounds(e.target.value)}
            placeholder="np. sz, cz, r"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm" />
        </div>
      </div>

      {/* Opis */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Krótki opis (opcjonalny)</label>
        <input type="text" value={description} onChange={e => setDescription(e.target.value)}
          placeholder="np. ćwiczenie warg i policzków"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm" />
      </div>

      {/* Instrukcja */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Instrukcja <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-1">Każdy krok w nowej linii, zaczynając od numeru: &quot;1. Otwórz usta...&quot;</p>
        <textarea required rows={5} value={instructions} onChange={e => setInstructions(e.target.value)}
          placeholder={"1. Zrób trąbkę językiem\n2. Przytrzymaj 3 sekundy\n3. Wróć do pozycji wyjściowej"}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm font-mono resize-none" />
      </div>

      {/* Prywatne/publiczne */}
      {!isAdmin && (
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setIsPublic(!isPublic)}
            className={`w-11 h-6 rounded-full transition-colors ${isPublic ? 'bg-green-600' : 'bg-gray-300'} relative`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? 'left-6' : 'left-1'}`} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{isPublic ? 'Publiczne' : 'Prywatne'}</div>
            <div className="text-xs text-gray-400">{isPublic ? 'Widoczne dla innych logopedów' : 'Tylko Twoje ćwiczenie'}</div>
          </div>
        </label>
      )}

      {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      <button type="submit" disabled={saving}
        className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition active:scale-95 flex items-center justify-center gap-2">
        {saving ? 'Zapisuję…' : '✓ Dodaj ćwiczenie'}
      </button>
    </form>
  )
}
