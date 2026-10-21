'use client'
// app/admin/cwiczenia/AdminExerciseActions.tsx — akcje w wierszu listy

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PrzyciskNieodwracalny from '@/components/shared/PrzyciskNieodwracalny'
import Link from 'next/link'
import { plural } from '@/lib/plural'

interface Props {
  exerciseId:    string
  title:         string
  isArchived:    boolean
  canHardDelete: boolean
  planCount:     number
}

export default function AdminExerciseActions({
  exerciseId, title, isArchived, canHardDelete, planCount,
}: Props) {
  const router = useRouter()
  const [busy,  setBusy]  = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function post(action: string, body: object = {}) {
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/admin/${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_id: exerciseId, ...body }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      // Wcześniej odpowiedź była ignorowana i błąd znikał bez śladu
      setError(data.error ?? 'Operacja nie powiodła się.')
      return
    }
    router.refresh()
  }

  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-3">
        <Link
          href={`/admin/cwiczenia/${exerciseId}`}
          className="text-xs text-gray-500 hover:text-gray-800 font-medium transition"
        >
          Podgląd
        </Link>
        <Link
          href={`/admin/cwiczenia/${exerciseId}/edytuj`}
          className="text-xs text-green-700 hover:text-green-900 font-medium transition"
        >
          Edytuj
        </Link>
        {isArchived ? (
          <button
            onClick={() => post('archive-exercise', { archived: false })}
            disabled={busy}
            className="text-xs text-green-700 hover:text-green-900 font-medium disabled:opacity-50 transition"
          >
            {busy ? '…' : 'Przywróć'}
          </button>
        ) : (
          <button
            onClick={() => post('archive-exercise', { archived: true })}
            disabled={busy}
            className="text-xs text-amber-700 hover:text-amber-900 font-medium disabled:opacity-50 transition"
          >
            {busy ? '…' : 'Archiwizuj'}
          </button>
        )}
        {canHardDelete && (
          <PrzyciskNieodwracalny
            onConfirm={() => post('delete-exercise')}
            label="Usuń"
            pytanie={`Usunąć „${title}" bezpowrotnie?`}
            disabled={busy}
            busy={busy}
          />
        )}
      </div>
      {!canHardDelete && !isArchived && (
        <p className="text-[10px] text-gray-300 mt-0.5">
          w {planCount} {plural(planCount, 'planie', 'planach', 'planach')}
        </p>
      )}
      {error && <p className="text-[11px] text-red-600 mt-1 max-w-[16rem] ml-auto">{error}</p>}
    </div>
  )
}
