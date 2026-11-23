// app/api/health/route.ts
//
// Dwa różne pytania pod jednym adresem, bo odpowiadają na nie różni pytający:
//
//   GET /api/health          — czy proces żyje (liveness). Tym pyta Fly co 15 s
//                              z timeoutem 2 s. Nie dotyka Supabase: gdyby
//                              dotykał, wolna odpowiedź bazy przekraczałaby
//                              timeout i Fly restartowałby zdrowy kontener,
//                              zamieniając awarię bazy w awarię aplikacji.
//
//   GET /api/health?deep=1   — czy aplikacja ma z czego żyć (readiness).
//                              Odpytuje Supabase i zwraca 503, gdy baza albo
//                              auth nie odpowiada. Tym pyta monitoring.
//
// Powód rozdzielenia wzięty z awarii z 23.11.2026: projekt Supabase zniknął
// z DNS, logowanie padło dla wszystkich, a /api/health przez cały czas
// świeciło na zielono, bo sprawdzało wyłącznie to, czy Next odpowiada.

import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const TIMEOUT_MS = 3000

interface Wynik {
  ok: boolean
  ms: number
  status?: number
  blad?: string
}

async function sprawdz(url: string, naglowki: Record<string, string>): Promise<Wynik> {
  const start = Date.now()
  const przerwij = new AbortController()
  const budzik = setTimeout(() => przerwij.abort(), TIMEOUT_MS)
  try {
    const r = await fetch(url, { headers: naglowki, signal: przerwij.signal, cache: 'no-store' })
    return { ok: r.ok, ms: Date.now() - start, status: r.status }
  } catch (e) {
    // Tu ląduje ENOTFOUND (host zniknął z DNS), timeout i zerwane połączenie —
    // czyli dokładnie te przypadki, których nie widać po stronie Next.
    return { ok: false, ms: Date.now() - start, blad: e instanceof Error ? e.message : String(e) }
  } finally {
    clearTimeout(budzik)
  }
}

export async function GET(request: Request) {
  const ts = new Date().toISOString()
  const deep = new URL(request.url).searchParams.has('deep')

  if (!deep) {
    return NextResponse.json({ status: 'ok', ts }, { status: 200 })
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Pusty klucz oznacza build bez --build-arg. To sam w sobie jest awarią:
  // przeglądarka dostaje wtedy paczkę bez adresu Supabase.
  if (!base || !anon) {
    return NextResponse.json(
      { status: 'degraded', ts, blad: 'brak NEXT_PUBLIC_SUPABASE_URL / ANON_KEY w buildzie' },
      { status: 503 }
    )
  }

  const naglowki = { apikey: anon, Authorization: `Bearer ${anon}` }

  // Osobno baza i osobno auth — w listopadzie padło jedno i drugie, ale to
  // auth jako pierwsze przekłada się na "nikt się nie zaloguje".
  const [baza, auth] = await Promise.all([
    sprawdz(`${base}/rest/v1/exercises?select=id&limit=1`, naglowki),
    sprawdz(`${base}/auth/v1/health`, naglowki),
  ])

  const zdrowy = baza.ok && auth.ok
  return NextResponse.json(
    { status: zdrowy ? 'ok' : 'degraded', ts, baza, auth },
    { status: zdrowy ? 200 : 503 }
  )
}
