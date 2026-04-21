'use client'
// app/(admin)/logopedzi/dodaj/AddTherapistForm.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddTherapistForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Hasło musi mieć min. 8 znaków.'); return }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/create-therapist', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ full_name: fullName, email, password }),
    })
    const data = await res.json()

    if (!res.ok) { setError(data.error ?? 'Błąd serwera.'); setLoading(false); return }

    setSuccess(true)
    setTimeout(() => router.push('/admin/logopedzi'), 1500)
  }

  if (success) return (
    <div className="text-center py-8">
      <div className="text-5xl mb-3">✅</div>
      <p className="font-bold text-green-700 text-lg">Logopeda dodany!</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { label: 'Imię i nazwisko', value: fullName, set: setFullName, type: 'text',     placeholder: 'np. Anna Kowalska' },
        { label: 'Email',           value: email,    set: setEmail,    type: 'email',    placeholder: 'logopeda@email.pl'   },
        { label: 'Hasło startowe',  value: password, set: setPassword, type: 'password', placeholder: 'minimum 8 znaków'   },
      ].map(f => (
        <div key={f.label}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{f.label} <span className="text-red-500">*</span></label>
          <input
            type={f.type} required value={f.value} placeholder={f.placeholder}
            onChange={e => f.set(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm"
          />
        </div>
      ))}

      {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      <button
        type="submit" disabled={loading}
        className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition"
      >
        {loading ? 'Tworzę konto…' : 'Utwórz konto logopedy'}
      </button>
    </form>
  )
}
