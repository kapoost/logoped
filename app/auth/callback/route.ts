import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Lądowanie po kliknięciu linku z maila. Supabase dokleja `code`, który wymieniamy
 * na sesję zapisaną w cookies — dopiero wtedy da się ustawić nowe hasło.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code       = searchParams.get('code')
  const tokenHash  = searchParams.get('token_hash')
  const typ        = searchParams.get('type')
  const next       = searchParams.get('next') ?? '/haslo/nowe'

  const host  = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  const base  = host ? `${proto}://${host}` : origin

  const supabase = createClient()

  // Dwie drogi, bo zależą od szablonu maila w Supabase:
  //  - `code`       (PKCE) działa tylko w tej samej przeglądarce, w której poproszono o reset,
  //                 bo weryfikator siedzi w jej cookies;
  //  - `token_hash` działa wszędzie — także gdy ktoś otworzy link na telefonie.
  let blad: unknown = null
  if (code) {
    blad = (await supabase.auth.exchangeCodeForSession(code)).error
  } else if (tokenHash && typ) {
    blad = (await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: typ as 'recovery' | 'email' | 'invite',
    })).error
  } else {
    blad = new Error('brak kodu i token_hash')
  }

  if (blad) {
    return NextResponse.redirect(`${base}/login/reset?error=link`, { status: 303 })
  }

  return NextResponse.redirect(`${base}${next}`, { status: 303 })
}
