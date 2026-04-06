'use client'
// app/(admin)/cwiczenia/AdminExerciseActions.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminExerciseActions({ exerciseId, title }: { exerciseId: string; title: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function deleteExercise() {
    if (!confirm(`Usunąć ćwiczenie "${title}"? Nie można cofnąć tej operacji.`)) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('exercises').delete().eq('id', exerciseId)
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
