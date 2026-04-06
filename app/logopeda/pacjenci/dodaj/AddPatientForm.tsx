'use client'
// app/(logopeda)/pacjenci/dodaj/AddPatientForm.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AddPatientForm() {
  const router  = useRouter()
  const supabase = createClient()

  const [fullName,  setFullName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 1. Pobierz aktualnego logopedę
    const { data: { user: therapist } } = await supabase.auth.getUser()
    if (!therapist) { setError('Błąd sesji — zaloguj się ponownie.'); setLoading(false); return }

    // 2. Utwórz konto pacjenta przez API route (wymaga service_role)
    const res = await fetch('/api/admin/create-patient', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name:     fullName,
        email,
        password,
        date_of_birth: birthDate || null,
        therapist_id:  therapist.id,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Wystąpił błąd. Spróbuj ponownie.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push(`/logopeda/pacjenci/${data.patient_id}`), 1500)
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-3">✅</div>
        <p className="font-bold text-green-700 text-lg">Pacjent dodany!</p>
        <p className="text-sm text-gray-500 mt-1">Przekierowuję do profilu…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Imię dziecka <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="np. Zosia Kowalska"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Data urodzenia
        </label>
        <input
          type="date"
          value={birthDate}
          onChange={e => setBirthDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm transition"
        />
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Dane logowania dla rodzica / dziecka
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="rodzic@email.pl"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasło <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="minimum 8 znaków"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm transition"
            />
            <p className="text-xs text-gray-400 mt-1">
              Przekaż dane logowania rodzicom. Mogą je zmienić po pierwszym logowaniu.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition active:scale-95"
      >
        {loading ? 'Tworzę konto…' : 'Dodaj pacjenta'}
      </button>
    </form>
  )
}
