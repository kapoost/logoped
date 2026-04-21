'use client'
// app/(auth)/register/RegisterForm.tsx
// Logopeda rejestruje się z mailem, pacjent z loginem (dostaje go od logopedy)

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/types/database'

const ROLES: { value: Role; label: string; emoji: string; desc: string }[] = [
  { value: 'therapist', label: 'Logopeda',  emoji: '🩺', desc: 'Zarządzam pacjentami i tworzę plany ćwiczeń' },
  { value: 'patient',   label: 'Pacjent',   emoji: '🧒', desc: 'Chcę ćwiczyć i zbierać punkty' },
]

/** Login → email wewnętrzny dla Supabase (tylko pacjenci) */
function loginToEmail(login: string): string {
  return login.includes('@') ? login : `${login.toLowerCase().trim()}@logoped.app`
}

export default function RegisterForm() {
  const router  = useRouter()
  const supabase = createClient()

  const [role, setRole]         = useState<Role>('patient')
  const [fullName, setFullName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const isPatient = role === 'patient'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków.')
      setLoading(false)
      return
    }

    if (isPatient && identifier.length < 3) {
      setError('Login musi mieć co najmniej 3 znaki.')
      setLoading(false)
      return
    }

    const email = isPatient ? loginToEmail(identifier) : identifier

    const metadata: Record<string, string> = { role, full_name: fullName }
    if (isPatient) metadata.login = identifier.toLowerCase().trim()

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })

    if (authError) {
      const msg = authError.message.includes('already registered')
        ? isPatient ? 'Ten login jest już zajęty.' : 'Ten email jest już zarejestrowany.'
        : authError.message
      setError(msg)
      setLoading(false)
      return
    }

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
              onClick={() => { setRole(r.value); setIdentifier('') }}
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
          {isPatient ? 'Imię dziecka' : 'Imię i nazwisko'}
        </label>
        <input
          type="text"
          required
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 text-sm transition"
          placeholder={isPatient ? 'np. Zosia' : 'np. Anna Kowalska'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isPatient ? 'Login' : 'Email'}
        </label>
        <input
          type={isPatient ? 'text' : 'email'}
          required
          autoComplete={isPatient ? 'username' : 'email'}
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 text-sm transition"
          placeholder={isPatient ? 'np. zosia123' : 'twoj@email.pl'}
        />
        {isPatient && (
          <p className="text-xs text-gray-400 mt-1">Otrzymasz login od logopedy na wizycie</p>
        )}
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
