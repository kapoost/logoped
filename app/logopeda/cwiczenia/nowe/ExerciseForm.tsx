'use client'
// app/logopeda/cwiczenia/nowe/ExerciseForm.tsx
// Jeden formularz w dwóch trybach: dodawanie (brak `exercise`) i edycja (`exercise` podane).

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORY_LABELS } from '@/types/database'
import ExerciseImage from '@/components/shared/ExerciseImage'
import type { Exercise, ExerciseCategory, DifficultyLevel } from '@/types/database'

const EMOJIS = ['👅','👄','💨','🔤','👂','🐍','🐱','🔔','🎯','🦷','🎤','🐸','💪','🌸','🎈','🥤','🪶','🧘','🐘','😛','😮','😁']

interface Props {
  therapistId: string
  isAdmin?:    boolean
  exercise?:   Exercise    // podane = tryb edycji
  onSuccess?:  () => void
}

export default function ExerciseForm({ therapistId, isAdmin, exercise, onSuccess }: Props) {
  const router = useRouter()
  const isEdit = !!exercise

  const [title,        setTitle]        = useState(exercise?.title ?? '')
  const [description,  setDescription]  = useState(exercise?.description ?? '')
  const [descChild,    setDescChild]    = useState(exercise?.description_child ?? '')
  const [instructions, setInstructions] = useState(exercise?.instructions ?? '')
  const [category,     setCategory]     = useState<ExerciseCategory>(exercise?.category ?? 'jezyka')
  const [difficulty,   setDifficulty]   = useState<DifficultyLevel>(exercise?.difficulty ?? 'latwe')
  const [emoji,        setEmoji]        = useState(exercise?.emoji ?? '👅')
  const [sounds,       setSounds]       = useState(exercise?.target_sounds?.join(', ') ?? '')
  const [duration,     setDuration]     = useState(exercise?.duration_seconds ?? 60)
  const [isPublic,     setIsPublic]     = useState(exercise?.is_public ?? false)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [success,      setSuccess]      = useState(false)

  // Ćwiczenie może mieć ikonę spoza palety — pokaż ją, żeby picker nie wyglądał na pusty
  const palette = exercise?.emoji && !EMOJIS.includes(exercise.emoji)
    ? [exercise.emoji, ...EMOJIS]
    : EMOJIS

  // Przy dodawaniu przez admina widoczność jest wymuszona (publiczna baza),
  // więc przełącznik pokazujemy tylko logopedzie. W edycji admin steruje nią wprost.
  const showVisibilityToggle = isEdit || !isAdmin

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

    const payload = {
      title:            title.trim(),
      description:       description.trim() || null,
      description_child: descChild.trim() || null,
      instructions:     instructions.trim(),
      category,
      difficulty,
      emoji,
      target_sounds,
      duration_seconds: duration,
      is_public:        showVisibilityToggle ? isPublic : true,
    }

    // Użyj API route (serwer widzi sesję z httpOnly cookies)
    const endpoint = isEdit
      ? (isAdmin ? '/api/admin/update-exercise' : '/api/logopeda/update-exercise')
      : '/api/logopeda/create-exercise'

    const res = await fetch(
      endpoint,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...payload, exercise_id: exercise!.id } : payload),
      }
    )

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError('Błąd zapisu: ' + (data.error ?? 'nieznany błąd'))
      return
    }

    setSuccess(true)
    onSuccess?.()
    setTimeout(() => {
      if (isAdmin)      router.push('/admin/cwiczenia')
      else if (isEdit)  router.push(`/logopeda/cwiczenia/${exercise!.id}`)
      else              router.push('/logopeda/cwiczenia')
      router.refresh()
    }, 1200)
  }

  if (success) return (
    <div className="text-center py-8">
      <div className="text-5xl mb-3">✅</div>
      <p className="font-bold text-green-700 text-lg">
        {isEdit ? 'Zmiany zapisane!' : 'Ćwiczenie dodane!'}
      </p>
      <p className="text-sm text-gray-500 mt-1">Przekierowuję…</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Ilustracja — duża, bo to formularz, w którym zapada decyzja o ćwiczeniu
          dla dziecka, a dziecko zobaczy ten rysunek na pół ekranu. Podgląd jest
          żywy: bez ilustracji pokazuje wybraną ikonę, więc picker niżej od razu
          widać w docelowym rozmiarze. */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ilustracja ćwiczenia</label>
        <div className="flex items-center gap-5">
          <div className="w-40 h-40 text-7xl bg-gray-50 border-2 border-gray-100 rounded-3xl overflow-hidden flex items-center justify-center flex-shrink-0">
            <ExerciseImage
              src={exercise?.media_url}
              emoji={emoji}
              title={title || 'Podgląd ćwiczenia'}
              size={320}
            />
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            {exercise?.media_url
              ? 'Tak zobaczy to dziecko na ekranie ćwiczenia.'
              : 'To ćwiczenie nie ma jeszcze ilustracji — dziecko zobaczy wybraną ikonę.'}
          </p>
        </div>
      </div>

      {/* Ikona zapasowa */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {exercise?.media_url ? 'Ikona zapasowa' : 'Ikona ćwiczenia'}
        </label>
        <p className="text-xs text-gray-400 mb-2">
          {exercise?.media_url
            ? 'Używana tam, gdzie ilustracja się nie wczyta.'
            : 'Zastępuje ilustrację, dopóki ćwiczenie jej nie ma.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {palette.map(e => (
            <button key={e} type="button" onClick={() => setEmoji(e)}
              className={`text-3xl w-14 h-14 rounded-xl border-2 flex items-center justify-center transition
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

      {/* Opis kliniczny */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Krótki opis (opcjonalny)</label>
        <p className="text-xs text-gray-400 mb-1.5">Dla ciebie — cel ćwiczenia. Dziecko tego nie zobaczy.</p>
        <input type="text" value={description} onChange={e => setDescription(e.target.value)}
          placeholder="np. pionizacja języka, przygotowanie do głoski r"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm" />
      </div>

      {/* Opis dla dziecka — osobne pole, bo rejestr kliniczny jest dla dziecka
          nieczytelny. Puste = dziecko zobaczy opis powyżej, czyli stan sprzed
          migracji 013. */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Co przeczyta dziecko</label>
        <p className="text-xs text-gray-400 mb-1.5">
          Jedno zdanie, do dziecka, bez terminów. Puste — dziecko zobaczy opis powyżej.
        </p>
        <input type="text" value={descChild} onChange={e => setDescChild(e.target.value)}
          maxLength={120}
          placeholder="np. Przyklej język do podniebienia i mocno klaśnij!"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm" />
        <p className="text-xs text-gray-400 mt-1 text-right tabular-nums">{descChild.length}/120</p>
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
      {showVisibilityToggle && (
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setIsPublic(!isPublic)}
            className={`w-11 h-6 rounded-full transition-colors ${isPublic ? 'bg-green-600' : 'bg-gray-300'} relative`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? 'left-6' : 'left-1'}`} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{isPublic ? 'Publiczne' : 'Prywatne'}</div>
            <div className="text-xs text-gray-400">
              {isEdit && exercise!.created_by === null
                ? (isPublic ? 'Widoczne dla wszystkich logopedów' : 'Ukryte — nikt go nie zobaczy w bazie')
                : (isPublic ? 'Widoczne dla innych logopedów' : 'Tylko Twoje ćwiczenie')}
            </div>
          </div>
        </label>
      )}

      {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      <button type="submit" disabled={saving}
        className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition active:scale-95 flex items-center justify-center gap-2">
        {saving ? 'Zapisuję…' : isEdit ? '✓ Zapisz zmiany' : '✓ Dodaj ćwiczenie'}
      </button>
    </form>
  )
}
