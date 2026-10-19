import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Nowe hasło' }
export const dynamic = 'force-dynamic'

export default async function NoweHasloPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  // Sesja powstaje dopiero po wymianie kodu z linku w /auth/callback.
  // Bez niej nie ma czego aktualizować — i trzeba to powiedzieć wprost,
  // zamiast pokazywać formularz, który i tak nie zadziała.
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Link wygasł</h1>
        <p className="text-sm text-gray-500">
          Ten link do ustawienia hasła już nie działa — jest ważny godzinę i tylko za pierwszym razem.
        </p>
        <Link
          href="/login/reset"
          className="block text-center w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition"
        >
          Poproś o nowy link
        </Link>
      </div>
    )
  }

  const blad = {
    krotkie:  'Hasło musi mieć co najmniej 8 znaków.',
    rozne:    'Oba pola muszą zawierać to samo hasło.',
    takie_samo: 'To jest Twoje obecne hasło — wybierz inne.',
    nieudane:  'Nie udało się zapisać hasła. Spróbuj jeszcze raz.',
  }[searchParams.error ?? '']

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ustaw nowe hasło</h1>
        <p className="text-sm text-gray-500 mt-1">Konto: {user.email}</p>
      </div>

      <form action="/api/auth/haslo" method="POST" className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nowe hasło</label>
          <input
            type="password" name="password" required minLength={8} autoFocus autoComplete="new-password"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-700 text-sm transition"
            placeholder="co najmniej 8 znaków"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Powtórz hasło</label>
          <input
            type="password" name="password2" required minLength={8} autoComplete="new-password"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-700 text-sm transition"
            placeholder="••••••••"
          />
        </div>

        {blad && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{blad}</p>}

        <button
          type="submit"
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition active:scale-95"
        >
          Zapisz hasło
        </button>
      </form>
    </div>
  )
}
