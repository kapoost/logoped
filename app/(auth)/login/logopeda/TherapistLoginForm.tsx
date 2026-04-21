// TherapistLoginForm.tsx — logowanie logopedy / admina
// Plain HTML form, POST do /api/auth/login, zero JS client-side
import Link from 'next/link'

export default function TherapistLoginForm({ error }: { error?: string }) {
  const errorMsg = error === 'invalid'
    ? 'Nieprawidłowy email lub hasło.'
    : error === 'unknown'
    ? 'Wystąpił błąd. Spróbuj ponownie.'
    : null

  return (
    <div className="space-y-4">
      <form action="/api/auth/login" method="POST" className="space-y-4">
        <input type="hidden" name="isDemo" value="false" />
        <input type="hidden" name="redirect" value="/login/logopeda" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" name="login" required autoComplete="email"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-700 text-sm transition"
            placeholder="jan.kowalski@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hasło</label>
          <input type="password" name="password" required autoComplete="current-password"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-700 text-sm transition"
            placeholder="••••••••" />
        </div>
        {errorMsg && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>}
        <button type="submit"
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition active:scale-95">
          Zaloguj się
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-4">
        Pacjent lub rodzic? <Link href="/login" className="text-brand-600 hover:underline font-medium">Zaloguj się tutaj</Link>
      </p>
    </div>
  )
}
