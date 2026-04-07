'use client'
// app/(admin)/cwiczenia/AdminExerciseActions.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'


export default function AdminExerciseActions({ exerciseId, title }: { exerciseId: string; title: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function deleteExercise() {
    if (!confirm(`Usunąć ćwiczenie "${title}"? Nie można cofnąć tej operacji.`)) return
    setLoading(true)
    await fetch('/api/admin/delete-exercise', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_id: exerciseId }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={deleteExercise}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 transition"
    >
      {loading ? '…' : 'Usuń'}
    </button>
  )
}
