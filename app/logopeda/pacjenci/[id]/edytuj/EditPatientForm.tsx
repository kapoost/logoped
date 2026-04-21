'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  patientId: string
  initialName: string
  initialBirthDate: string
  existingNames: string[]
}

export default function EditPatientForm({ patientId, initialName, initialBirthDate, existingNames }: Props) {
  const router = useRouter()

  const [fullName,    setFullName]    = useState(initialName)
  const [birthDate,   setBirthDate]   = useState(initialBirthDate)
  const [newPassword, setNewPassword] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [success,     setSuccess]     = useState<string | null>(null)

  // Usuwanie
  const [showDelete, setShowDelete] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  const isDuplicate = fullName.trim().length > 0 &&
    fullName.trim().toLowerCase() !== initialName.trim().toLowerCase() &&
    existingNames.some(n => n.trim().toLowerCase() === fullName.trim().toLowerCase())

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!fullName.trim()) { setError('Podaj imię dziecka.'); return }
    if (isDuplicate) { setError(`Masz już pacjenta o imieniu "${fullName}".`); return }
    if (newPassword && newPassword.length < 8) { setError('Hasło musi mieć minimum 8 znaków.'); return }

    setLoading(true)

    const res = await fetch('/api/logopeda/update-patient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id:    patientId,
        full_name:     fullName.trim(),
        date_of_birth: birthDate || null,
        new_password:  newPassword || undefined,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Wystąpił błąd.')
      return
    }

    setSuccess('Zapisano zmiany.')
    setNewPassword('')
    setTimeout(() => router.push(`/logopeda/pacjenci/${patientId}`), 1200)
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)

    const res = await fetch('/api/logopeda/delete-patient', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patientId }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Błąd usuwania.')
      setDeleting(false)
      return
    }

    router.push('/logopeda/pacjenci')
  }

  return (
    <>
      <form onSubmit={handleSave} className="space-y-4">
        {/* Imię */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Imię dziecka <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2
              ${isDuplicate
                ? 'border-amber-400 bg-amber-50 focus:ring-amber-400/20 focus:border-amber-500'
                : 'border-gray-200 focus:ring-green-600/20 focus:border-green-700'
              }`}
          />
          {isDuplicate && (
            <p className="text-amber-600 text-xs mt-1.5">
              Masz już pacjenta o tym imieniu.
            </p>
          )}
        </div>

        {/* Data urodzenia */}
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

        {/* Nowe hasło */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Zmiana hasła
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nowe hasło
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="zostaw puste aby nie zmieniać"
              minLength={8}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-700 text-sm transition"
            />
            <p className="text-xs text-gray-400 mt-1">Minimum 8 znaków. Zostaw puste, jeśli nie chcesz zmieniać.</p>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}
        {success && <p className="text-green-600 text-sm bg-green-50 rounded-xl px-4 py-3">{success}</p>}

        <button
          type="submit"
          disabled={loading || isDuplicate}
          className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition active:scale-95"
        >
          {loading ? 'Zapisuję…' : 'Zapisz zmiany'}
        </button>
      </form>

      {/* Sekcja usuwania */}
      <div className="mt-6 border-t border-gray-100 pt-5">
        {!showDelete ? (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="text-sm text-red-500 hover:text-red-700 font-medium transition"
          >
            Usuń pacjenta…
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-sm text-red-700 font-semibold">
              Na pewno usunąć pacjenta &quot;{initialName}&quot;?
            </p>
            <p className="text-xs text-red-600">
              Usuniesz konto, wszystkie dane ćwiczeń, statystyki i odznaki. Tej operacji nie można cofnąć.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl transition"
              >
                {deleting ? 'Usuwam…' : 'Tak, usuń'}
              </button>
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
