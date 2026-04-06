'use client'
// app/(logopeda)/cwiczenia/nowe/NewExerciseForm.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_LABELS } from '@/types/database'
import type { ExerciseCategory, DifficultyLevel } from '@/types/database'

const EMOJIS = ['👅','👄','💨','🔤','👂','🐍','🐱','🔔','🎯','🦷','🎤','🐸','💪','🌸','🎈','🥤','🪶','🧘','🐘','😛','😮','😁']

interface Props {
  therapistId: string
  isAdmin?:    boolean    // admin tworzy ćwiczenia publiczne (created_by = null)
  onSuccess?:  () => void
}

export default function NewExerciseForm({ therapistId, isAdmin, onSuccess }: Props) {
  const router  = useRouter()
  const supabase = createClient()

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [category,    setCategory]    = useState<ExerciseCategory>('jezyka')
  const [difficulty,  setDifficulty]  = useState<DifficultyLevel>('latwe')
  const [emoji,       setEmoji]       = useState('👅')
  const [sounds,      setSounds]      = useState('')     // CSV: "sz, cz, r"
  const [duration,    setDuration]    = useState(60)
  const [isPublic,    setIsPublic]    = useState(false)

  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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

    const { error: err } = await supabase.from('exercises').insert({
      title:        title.trim(),
      description:  description.trim() || null,
      instructions: instructions.trim(),
      category,
      difficulty,
      emoji,
      target_sounds: target_sounds.length ? target_sounds : null,
      duration_seconds: duration,
      created_by:   isAdmin ? null : therapistId,
      is_public:    isAdmin ? true : isPublic,
    })

    setSaving(false)

    if (err) {
      setError('Błąd zapisu: ' + err.message)
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
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Emoji picker */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Ikona ćwiczenia</label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map(e => (
            <button
              key={e} type="button" onClick={() => setEmoji(e)}
              className={`text-2xl w-10 h-10 rounded-xl transition ${
                emoji === e ? 'bg-brand-100 ring-2 ring-brand-600' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Nazwa */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Nazwa ćwiczenia <span className="text-red-500">*</span>
        </label>
        <input
          required value={title} onChange={e => setTitle(e.target.value)}
          placeholder="np. Żmijka — wariant zaawansowany"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm"
        />
      </div>

      {/* Kategoria + Trudność */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Kategoria</label>
          <select
            value={category} onChange={e => setCategory(e.target.value as ExerciseCategory)}
            className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700"
          >
            {(Object.entries(CATEGORY_LABELS) as [ExerciseCategory, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Trudność</label>
          <select
            value={difficulty} onChange={e => setDifficulty(e.target.value as DifficultyLevel)}
            className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700"
          >
            <option value="latwe">Łatwe</option>
            <option value="srednie">Średnie</option>
            <option value="trudne">Trudne</option>
          </select>
        </div>
      </div>

      {/* Czas + Głoski */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Czas (sekundy)
          </label>
          <input
            type="number" min={15} max={600} value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Głoski (opcja)
          </label>
          <input
            value={sounds} onChange={e => setSounds(e.target.value)}
            placeholder="np. sz, cz, r"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700"
          />
        </div>
      </div>

      {/* Krótki opis */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Krótki opis (opcjonalny)
        </label>
        <input
          value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Cel ćwiczenia w jednym zdaniu"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700"
        />
      </div>

      {/* Instrukcja krok po kroku */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Instrukcja <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-1">
          Każdy krok w nowej linii, zaczynając od numeru: "1. Otwórz usta…"
        </p>
        <textarea
          required value={instructions} onChange={e => setInstructions(e.target.value)}
          rows={6}
          placeholder={`1. Otwórz usta szeroko.\n2. Wysuń język.\n3. Powtórz 10 razy.`}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 resize-none font-mono"
        />
      </div>

      {/* Widoczność — tylko dla logopedy (nie admina) */}
      {!isAdmin && (
        <div className="flex items-center gap-3 py-2">
          <button
            type="button"
            onClick={() => setIsPublic(p => !p)}
            className={`relative w-11 h-6 rounded-full transition-colors ${isPublic ? 'bg-green-600' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
          </button>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isPublic ? 'Publiczne' : 'Prywatne'}
            </p>
            <p className="text-xs text-gray-400">
              {isPublic ? 'Widoczne dla innych logopedów' : 'Tylko Twoje ćwiczenie'}
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      <button
        type="submit" disabled={saving}
        className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition active:scale-95"
      >
        {saving ? 'Zapisuję…' : '✓ Dodaj ćwiczenie'}
      </button>
    </form>
  )
}
