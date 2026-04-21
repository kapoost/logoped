// LoginForm.tsx — logowanie pacjenta (dziecko/rodzic)
// Plain HTML form, POST do /api/auth/login, zero JS client-side
import Link from 'next/link'

const DEMO_LOGIN    = 'demo'
const DEMO_PASSWORD = 'Demo2026!'

export default function LoginForm({ error }: { error?: string }) {
  const errorMsg = error === 'invalid'
    ? 'Nieprawidłowy login lub hasło.'
    : error === 'unknown'
    ? 'Wystąpił błąd. Spróbuj ponownie.'
    : null

  return (
    <div className="space-y-4">

      {/* DEMO */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🧚</span>
          <span className="text-sm font-semibold text-amber-800">Wypróbuj bez rejestracji</span>
        </div>
        <p className="text-xs text-amber-700 mb-3 leading-relaxed">
          Zaloguj się jako <strong>Zosia Zaczarowana</strong> — bajkowa pacjentka
          z 45-dniową historią ćwiczeń i odznakami.
        </p>
        <form action="/api/auth/login" method="POST">
          <input type="hidden" name="login"    value={DEMO_LOGIN} />
          <input type="hidden" name="password" value={DEMO_PASSWORD} />
          <input type="hidden" name="isDemo"   value="true" />
          <input type="hidden" name="redirect" value="/login" />
          <button type="submit"
            className="w-full bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold py-2.5 rounded-xl transition active:scale-95 text-sm flex items-center justify-center gap-2">
            <span>🦜</span> Wejdź jako demo — Zosia Zaczarowana
          </button>
        </form>
        <div className="flex items-center gap-2 mt-2 justify-center">
          <code className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">{DEMO_LOGIN}</code>
          <span className="text-xs text-amber-500">·</span>
          <code className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">{DEMO_PASSWORD}</code>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200"/>
        <span className="text-xs text-gray-400 font-medium">lub zaloguj się</span>
        <div className="flex-1 h-px bg-gray-200"/>
      </div>

      {/* FORMULARZ */}
      <form action="/api/auth/login" method="POST" className="space-y-4">
        <input type="hidden" name="isDemo" value="false" />
        <input type="hidden" name="redirect" value="/login" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Login</label>
          <input type="text" name="login" required autoComplete="username"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 text-sm transition"
            placeholder="twój login" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hasło</label>
          <input type="password" name="password" required autoComplete="current-password"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 text-sm transition"
            placeholder="••••••••" />
        </div>
        {errorMsg && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>}
        <button type="submit"
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition active:scale-95">
          Zaloguj się
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-4">
        Jesteś logopedą? <Link href="/login/logopeda" className="text-brand-600 hover:underline font-medium">Zaloguj się tutaj</Link>
      </p>
    </div>
  )
}
