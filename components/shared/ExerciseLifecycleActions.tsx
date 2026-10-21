'use client'
// components/shared/ExerciseLifecycleActions.tsx
// Archiwizacja / przywrócenie / usunięcie — wspólne dla admina i logopedy.
// Różni je tylko prefiks API, bo uprawnienia pilnuje serwer.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PrzyciskNieodwracalny from './PrzyciskNieodwracalny'
import { plural } from '@/lib/plural'

interface Props {
  exerciseId:    string
  title:         string
  isArchived:    boolean
  canHardDelete: boolean
  planCount:     number
  /** 'admin' → /api/admin/*, 'logopeda' → /api/logopeda/* */
  scope:         'admin' | 'logopeda'
  /** dokąd wrócić po usunięciu */
  listHref:      string
}

export default function ExerciseLifecycleActions({
  exerciseId, title, isArchived, canHardDelete, planCount, scope, listHref,
}: Props) {
  const router = useRouter()
  const [busy,  setBusy]  = useState<'archive' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function call(action: 'archive-exercise' | 'delete-exercise', body: object) {
    setError(null)
    const res = await fetch(`/api/${scope}/${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_id: exerciseId, ...body }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error ?? 'Nie udało się wykonać operacji.')
      return false
    }
    return true
  }

  async function toggleArchive() {
    setBusy('archive')
    const ok = await call('archive-exercise', { archived: !isArchived })
    setBusy(null)
    if (ok) router.refresh()
  }

  async function hardDelete() {
    setBusy('delete')
    const ok = await call('delete-exercise', {})
    setBusy(null)
    if (ok) {
      router.push(listHref)
      router.refresh()
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={toggleArchive}
        disabled={busy !== null}
        className={`w-full font-semibold py-3 rounded-xl transition active:scale-95 disabled:opacity-60 ${
          isArchived
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
        }`}
      >
        {busy === 'archive' ? '…' : isArchived ? '↩︎ Przywróć do bazy' : '📦 Archiwizuj'}
      </button>

      {!isArchived && (
        <p className="text-xs text-gray-400 text-center">
          Znika z bazy do wyboru i z kreatora planów. Istniejące plany działają dalej.
        </p>
      )}

      {canHardDelete ? (
        <div className="w-full flex justify-center py-1">
          <PrzyciskNieodwracalny
            onConfirm={hardDelete}
            label={busy === 'delete' ? 'Usuwam…' : 'Usuń trwale'}
            pytanie={`Usunąć „${title}" bezpowrotnie?`}
            disabled={busy !== null}
            className="text-sm text-red-600 hover:text-red-800 font-medium py-2 disabled:opacity-50 transition"
          />
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center pt-1">
          Trwałe usunięcie niedostępne — ćwiczenie jest w {planCount}&nbsp;
          {plural(planCount, 'planie', 'planach', 'planach')}.
        </p>
      )}

      {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}
    </div>
  )
}
