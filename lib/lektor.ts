'use client'
// lib/lektor.ts
// Lektor czytający polecenia dziecku.
//
// Dwa źródła dźwięku, w tej kolejności:
//  1. gotowy MP3 głosem Lolo z bucketu exercise-media (generowany skryptem
//     scripts/lektor/generuj.py) — ten sam głos na każdym telefonie, działa
//     offline po zcache'owaniu przez service workera,
//  2. syntezator przeglądarki — zapas dla notatek logopedy (pisanych per
//     pacjent, więc nie da się ich wygenerować z góry) i dla ćwiczeń, do
//     których audio jeszcze nie powstało.
//
// Nazwa pliku zawiera skrót tekstu, więc po edycji polecenia stary plik
// przestaje pasować, leci 404 i zostaje syntezator — zamiast czytać dziecku
// nieaktualną treść.

import { useCallback, useEffect, useRef, useState } from 'react'

const BUCKET = 'exercise-media'
const KATALOG = 'lektor'

/** FNV-1a 32-bit → base36. Ta sama funkcja jest w skrypcie generującym. */
export function hashTekstu(tekst: string): string {
  let h = 0x811c9dc5
  const norm = tekst.trim().replace(/\s+/g, ' ')
  for (let i = 0; i < norm.length; i++) {
    h ^= norm.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(36).padStart(7, '0').slice(-7)
}

/** Publiczny URL nagrania dla jednego kroku ćwiczenia. */
export function urlLektora(exerciseId: string, indeks: number, tekst: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base || !exerciseId) return null
  return `${base}/storage/v1/object/public/${BUCKET}/${KATALOG}/${exerciseId}/${indeks}-${hashTekstu(tekst)}.mp3`
}

// ── Syntezator przeglądarki ──────────────────────────────────────────────

function glosPolski(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const glosy = window.speechSynthesis.getVoices()
  const pl = glosy.filter(g => g.lang?.toLowerCase().startsWith('pl'))
  if (!pl.length) return null
  // Lokalny głos działa bez sieci — na iOS to wbudowana "Zosia".
  return pl.find(g => g.localService) ?? pl[0]
}

/**
 * Lista głosów bywa pusta przy pierwszym wywołaniu (iOS, PWA w trybie
 * standalone) i zapełnia się dopiero po zdarzeniu voiceschanged.
 */
function czekajNaGlosy(): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve()
  if (window.speechSynthesis.getVoices().length) return Promise.resolve()
  return new Promise(resolve => {
    const koniec = () => { window.speechSynthesis.removeEventListener('voiceschanged', koniec); resolve() }
    window.speechSynthesis.addEventListener('voiceschanged', koniec)
    setTimeout(koniec, 1000)   // nie wisimy w nieskończoność
  })
}

// ── Hook ─────────────────────────────────────────────────────────────────

interface Opcje {
  /** Ćwiczenie, z którego bierzemy gotowe nagrania. Brak = tylko syntezator. */
  exerciseId?: string
}

export function useLektor({ exerciseId }: Opcje = {}) {
  const [mowi, setMowi]        = useState(false)
  const [wyciszony, setWycisz] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // iOS pozwala odtwarzać dźwięk dopiero po geście użytkownika. Pierwsze
  // udane odtworzenie zdejmuje blokadę i od tego momentu kolejne kroki mogą
  // czytać się same przy przewijaniu.
  const odblokowane = useRef(false)

  // Numer pokolenia unieważnia wszystko, co jeszcze leci. Bez tego pauza
  // wciśnięta w trakcie ładowania MP3 czytała krok, który dziecko właśnie
  // przerwało: audio.pause() odrzuca niezakończone play() błędem AbortError,
  // a ten wpadał do tej samej gałęzi co brak pliku i uruchamiał syntezator.
  // Ten sam problem przy przewinięciu karty — odzywał się krok poprzedni.
  const pokolenie = useRef(0)

  const stop = useCallback(() => {
    pokolenie.current++
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    setMowi(false)
  }, [])

  useEffect(() => stop, [stop])

  const syntezator = useCallback(async (tekst: string, aktualne: () => boolean) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { setMowi(false); return }

    // Czekanie na listę głosów trwa na iOS do sekundy. Dziecko zdąży w tym
    // czasie wcisnąć pauzę albo przewinąć kartę — wtedy mamy nic nie mówić.
    await czekajNaGlosy()
    if (!aktualne()) return

    const u = new SpeechSynthesisUtterance(tekst)
    const glos = glosPolski()
    if (glos) u.voice = glos
    u.lang  = 'pl-PL'
    u.rate  = 0.92          // dziecko nadąża
    u.pitch = 1.15          // bliżej głosu Lolo niż lektora wiadomości
    u.onend   = () => { if (aktualne()) setMowi(false) }
    u.onerror = () => { if (aktualne()) setMowi(false) }
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)

    // Syntezator też liczy się jako przełamanie blokady autoplay — inaczej
    // automatyczne czytanie kolejnych kart nie ruszyłoby nigdy tam, gdzie
    // nagrań jeszcze nie ma.
    odblokowane.current = true
  }, [])

  /**
   * @param tekst   co przeczytać
   * @param indeks  numer kroku — decyduje o nazwie pliku; null dla treści
   *                bez nagrania (notatka logopedy)
   */
  const mow = useCallback(async (tekst: string, indeks: number | null = null) => {
    if (!tekst?.trim() || wyciszony) return

    stop()                                   // podbija pokolenie
    const moje = pokolenie.current
    const aktualne = () => moje === pokolenie.current
    setMowi(true)

    const url = indeks === null ? null : urlLektora(exerciseId ?? '', indeks, tekst)
    if (!url) { await syntezator(tekst, aktualne); return }

    // Brak pliku zgłasza się dwiema drogami naraz — zdarzeniem error i
    // odrzuceniem play(). Bez tej bramki syntezator startuje dwa razy,
    // a drugie uruchomienie anuluje pierwsze w połowie zdania.
    let zapas = false
    const naZapas = () => {
      if (zapas || !aktualne()) return
      zapas = true
      audioRef.current = null
      syntezator(tekst, aktualne)
    }

    const audio = new Audio()
    // Bez trybu CORS odpowiedź jest nieprzejrzysta (status 0), więc 404 dla
    // jeszcze niewygenerowanego nagrania trafiał do cache'u service workera
    // jako poprawny i zostawał tam na 180 dni — nagranie wgrane później nigdy
    // by nie zagrało. Supabase Storage wysyła nagłówki CORS.
    audio.crossOrigin = 'anonymous'
    audio.src = url
    audioRef.current = audio
    audio.onended = () => { if (aktualne()) setMowi(false) }
    audio.onerror = naZapas

    try {
      await audio.play()
      if (!aktualne()) { audio.pause(); return }   // pauza/przewinięcie w trakcie ładowania
      odblokowane.current = true
    } catch {
      naZapas()   // odrzucone autoplay albo brak pliku
    }
  }, [exerciseId, stop, syntezator, wyciszony])

  const przelaczWyciszenie = useCallback(() => {
    // Efekty uboczne poza updaterem setState — React może wywołać updater
    // wielokrotnie (StrictMode), a stop() zatrzymuje odtwarzanie.
    const nowe = !wyciszony
    if (nowe) stop()
    setWycisz(nowe)
  }, [wyciszony, stop])

  return { mow, stop, mowi, wyciszony, przelaczWyciszenie, odblokowane }
}
