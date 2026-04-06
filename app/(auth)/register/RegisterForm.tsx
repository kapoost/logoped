'use client'
// app/(auth)/register/RegisterForm.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/types/database'

const ROLES: { value: Role; label: string; emoji: string; desc: string }[] = [
  { value: 'therapist', label: 'Logopeda',  emoji: '🩺', desc: 'Zarządzam pacjentami i tworzę plany ćwiczeń' },
  { value: 'patient',   label: 'Pacjent',   emoji: '🧒', desc: 'Chcę ćwiczyć i zbierać punkty' },
]

export default function RegisterForm() {
  const router  = useRouter()
  const supabase = createClient()

  const [role, setRole]         = useState<Role>('patient')
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków.')
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName },
        // Callback po weryfikacji email (jeśli włączona)
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(
        authError.message.includes('already registered')
          ? 'Ten email jest już zarejestrowany.'
          : authError.message
      )
      setLoading(false)
      return
    }

    // Dla MVP — email confirm wyłączony, od razu przekieruj
    switch (role) {
      case 'therapist': router.push('/logopeda'); break
      case 'patient':   router.push('/pacjent/cwiczenia'); break
      default:          router.push('/login')
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Wybór roli */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Konto dla
        </label>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`p-3 rounded-xl border-2 text-left transition ${
                role === r.value
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{r.emoji}</div>
              <div className="text-sm font-semibold text-gray-800">{r.label}</div>
              <div className="text-xs text-gray-500 mt-0.5 leading-tight">{r.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {role === 'patient' ? 'Imię dziecka' : 'Imię i nazwisko'}
        </label>
        <input
          type="text"
          required
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 text-sm transition"
          placeholder={role === 'patient' ? 'np. Zosia' : 'np. Anna Kowalska'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 text-sm transition"
          placeholder="twoj@email.pl"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Hasło</label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 text-sm transition"
          placeholder="minimum 8 znaków"
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition active:scale-95"
      >
        {loading ? 'Tworzenie konta…' : 'Utwórz konto'}
      </button>
    </form>
  )
}
