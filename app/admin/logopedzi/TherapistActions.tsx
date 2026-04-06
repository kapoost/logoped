'use client'
// app/(admin)/logopedzi/TherapistActions.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TherapistActions({ therapistId, name }: { therapistId: string; name: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function deleteTherapist() {
    if (!confirm(`Czy na pewno usunąć konto logopedy ${name}? Tej operacji nie można cofnąć.`)) return
    setLoading(true)

    await fetch('/api/admin/delete-user', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId: therapistId }),
    })

    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={deleteTherapist}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 transition"
    >
      {loading ? 'Usuwanie…' : 'Usuń'}
    </button>
  )
}
