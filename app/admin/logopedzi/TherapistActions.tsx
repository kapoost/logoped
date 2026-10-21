'use client'
// app/(admin)/logopedzi/TherapistActions.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PrzyciskNieodwracalny from '@/components/shared/PrzyciskNieodwracalny'

export default function TherapistActions({ therapistId, name }: { therapistId: string; name: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function deleteTherapist() {
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
    <PrzyciskNieodwracalny
      onConfirm={deleteTherapist}
      label="Usuń"
      pytanie={`Usunąć konto ${name} wraz z jego pacjentami?`}
      disabled={loading}
      busy={loading}
    />
  )
}
