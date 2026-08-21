'use client'
// app/logopeda/cwiczenia/[id]/ExercisePreviewActions.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  exerciseId: string
  isOwn:      boolean
  isArchived: boolean
}

export default function ExercisePreviewActions({ exerciseId, isOwn, isArchived }: Props) {
  const router = useRouter()
  const [cloning, setCloning] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function clone() {
    setCloning(true)
    setError(null)
    const res = await fetch('/api/logopeda/clone-exercise', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_id: exerciseId }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError('Nie udało się sklonować: ' + (data.error ?? 'nieznany błąd'))
      setCloning(false)
      return
    }
    // Od razu do edycji kopii — po to się klonuje
    router.push(`/logopeda/cwiczenia/${data.exercise_id}/edytuj`)
    router.refresh()
  }

  // Zarchiwizowane jest wycofane z obiegu — klonowanie go do nowych planów
  // obchodziłoby decyzję o wycofaniu. Właściciel widzi tu akcje cyklu życia.
  if (isArchived && !isOwn) return (
    <p className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-center">
      Ćwiczenie zostało wycofane z bazy — nie można go sklonować.
    </p>
  )

  if (isOwn) return (
    <Link
      href={`/logopeda/cwiczenia/${exerciseId}/edytuj`}
      className="block w-full text-center bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 rounded-xl transition active:scale-95"
    >
      ✏️ Edytuj ćwiczenie
    </Link>
  )

  return (
    <div className="space-y-2">
      <button
        onClick={clone}
        disabled={cloning}
        className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition active:scale-95"
      >
        {cloning ? 'Klonuję…' : '📋 Sklonuj po swojemu'}
      </button>
      <p className="text-xs text-gray-400 text-center">
        Powstanie Twoja prywatna kopia — oryginał z bazy zostaje bez zmian.
      </p>
      {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}
    </div>
  )
}
