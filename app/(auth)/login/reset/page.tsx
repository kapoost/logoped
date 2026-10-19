import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Nie pamiętam hasła' }
export const dynamic = 'force-dynamic'

export default function ResetPage({
  searchParams,
}: {
  searchParams: { sent?: string; error?: string }
}) {
  const wyslane = searchParams.sent === '1'

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Nie pamiętam hasła</h1>
        <p className="text-sm text-gray-500 mt-1">
          Podaj adres e-mail, na który masz konto logopedy. Wyślemy link do ustawienia nowego hasła.
        </p>
      </div>

      {wyslane ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 space-y-2">
          <p className="text-sm text-green-900 font-medium">Jeśli konto istnieje, link już leci.</p>
          <p className="text-xs text-green-800">
            Sprawdź skrzynkę, także folder ze spamem. Link jest ważny godzinę i działa jeden raz.
          </p>
        </div>
      ) : (
        <form action="/api/auth/reset" method="POST" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" name="email" required autoComplete="email" autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-700 text-sm transition"
              placeholder="jan.kowalski@example.com"
            />
          </div>

          {searchParams.error === 'limit' && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
              Za dużo prób. Odczekaj kilkanaście minut i spróbuj ponownie.
            </p>
          )}
          {searchParams.error === 'link' && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
              Link wygasł albo został już użyty. Poproś o nowy.
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition active:scale-95"
          >
            Wyślij link
          </button>
        </form>
      )}

      <p className="text-center text-xs text-gray-400 mt-4">
        Pamiętasz hasło?{' '}
        <Link href="/login/logopeda" className="text-brand-600 hover:underline font-medium">
          Wróć do logowania
        </Link>
      </p>
    </div>
  )
}
