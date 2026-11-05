'use client'
// components/patient/KrokiCwiczenia.tsx
// Polecenie ćwiczenia — jedna karta naraz, czytana na głos.
//
// Wcześniej wszystkie kroki stały jedna pod drugą w kontenerze z własnym
// przewijaniem. Nagłówek z ilustracją zajmował na sztywno 388 px, więc na
// iPhonie SE (553 px widoku) na polecenie zostawało 57 px i dziecko nie
// widziało ani jednego kroku — ani znaku, że jest coś niżej. Stąd karty:
// wysokość przestaje decydować o tym, ile treści dociera do dziecka.
//
// Krok to nie powtórzenie. "Głoska S" ma sześć kroków opisujących JEDNO
// wykonanie i pięć powtórzeń — dlatego pager chodzi niezależnie od licznika
// na dole.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PrzekrojJamyUstnej from '@/components/shared/PrzekrojJamyUstnej'
import { przekrojeDlaGlosek } from '@/lib/przekroje'
import { useLektor } from '@/lib/lektor'

type Karta =
  | { typ: 'notatka';  tekst: string }
  | { typ: 'krok';     tekst: string; numer: number; razem: number; indeks: number }
  | { typ: 'przekroj'; gloski: string[] | null }

interface Props {
  exerciseId:     string
  instructions:   string
  therapistNotes: string | null
  targetSounds:   string[] | null
}

export default function KrokiCwiczenia({ exerciseId, instructions, therapistNotes, targetSounds }: Props) {
  const karty = useMemo<Karta[]>(() => {
    const kroki = instructions
      .split('\n').map(s => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)

    const lista: Karta[] = []
    if (therapistNotes?.trim()) lista.push({ typ: 'notatka', tekst: therapistNotes.trim() })
    kroki.forEach((tekst, i) =>
      lista.push({ typ: 'krok', tekst, numer: i + 1, razem: kroki.length, indeks: i }))
    // Karta z przekrojem tylko wtedy, gdy jest co pokazać. Sam komponent
    // zwraca null dla głosek bez zaakceptowanej pozycji, a karta i tak by
    // została — dziecko dostawałoby pustą białą planszę na końcu.
    const maPrzekroj = przekrojeDlaGlosek(targetSounds).some(p => p.status === 'zaakceptowany')
    if (maPrzekroj) lista.push({ typ: 'przekroj', gloski: targetSounds })
    return lista
  }, [instructions, therapistNotes, targetSounds])

  const [i, setI] = useState(0)
  const [kierunek, setKierunek] = useState(1)
  const karta = karty[i]
  const { mow, stop, mowi, wyciszony, przelaczWyciszenie, odblokowane } = useLektor({ exerciseId })

  const czytaj = useCallback((k: Karta | undefined) => {
    if (!k) return
    if (k.typ === 'krok')    mow(k.tekst, k.indeks)
    if (k.typ === 'notatka') mow(k.tekst, null)   // notatka jest pisana per pacjent — tylko syntezator
  }, [mow])

  // Kolejne karty czytają się same, ale dopiero gdy dziecko raz dotknęło
  // głośnika: iOS odrzuca dźwięk bez gestu, a cicha odmowa wygląda jak awaria.
  useEffect(() => {
    if (odblokowane.current && !wyciszony) czytaj(karta)
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i])

  if (!karty.length) return null

  function idz(delta: number) {
    const next = i + delta
    if (next < 0 || next >= karty.length) return
    setKierunek(delta)
    setI(next)
  }

  const etykieta =
    karta.typ === 'krok'     ? `Krok ${karta.numer} z ${karta.razem}`
    : karta.typ === 'notatka' ? 'Od pani logopedy'
    : 'Układ języka'

  const doCzytania = karta.typ !== 'przekroj'

  return (
    <div className="flex-1 min-h-[9.5rem] px-4 flex flex-col gap-2">

      {/* Kropki + etykieta */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5" data-testid="kropki-krokow">
          {karty.map((_, n) => (
            <button
              key={n}
              onClick={() => { setKierunek(n > i ? 1 : -1); setI(n) }}
              aria-label={`Krok ${n + 1}`}
              className={`h-2 rounded-full transition-all ${
                n === i ? 'w-6 bg-brand-600' : 'w-2 bg-brand-200'
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{etykieta}</span>
      </div>

      {/* Karta */}
      <div className="flex-1 min-h-[5.5rem] relative">
        {/* Bez mode="popLayout": w parze z drag karty wychodzące nie kończyły
            animacji i zostawały w DOM — po pięciu krokach wisiało pięć
            niewidocznych plansz. Wyjście jedzie tweenem, bo ten kończy się
            deterministycznie i AnimatePresence je sprząta. */}
        <AnimatePresence initial={false} custom={kierunek}>
          <motion.div
            key={i}
            custom={kierunek}
            initial={{ x: kierunek * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 34 } }}
            exit={{ x: kierunek * -60, opacity: 0, transition: { duration: 0.18 } }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) idz(1)
              else if (info.offset.x > 60) idz(-1)
            }}
            className={`absolute inset-0 rounded-2xl overflow-y-auto flex flex-col justify-center px-5 py-4 ${
              karta.typ === 'notatka'
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-white shadow-sm'
            }`}
            data-testid="karta-kroku"
          >
            {karta.typ === 'przekroj' ? (
              <PrzekrojJamyUstnej gloski={karta.gloski} dlaPacjenta />
            ) : (
              <div className="flex items-start gap-3">
                {karta.typ === 'notatka' && <span className="text-2xl flex-shrink-0">💬</span>}
                <p className={`font-bold leading-snug text-[clamp(1rem,4.6vw,1.375rem)] ${
                  karta.typ === 'notatka' ? 'text-amber-900' : 'text-gray-800'
                }`}>
                  {karta.tekst}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sterowanie: wstecz · głośnik · dalej */}
      <div className="flex items-center justify-between gap-3 flex-shrink-0">
        <button
          onClick={() => idz(-1)}
          disabled={i === 0}
          aria-label="Poprzedni krok"
          className="w-12 h-12 rounded-2xl bg-white border border-gray-200 text-xl text-gray-500 disabled:opacity-30 active:scale-95 transition flex items-center justify-center"
        >
          ←
        </button>

        {doCzytania ? (
          <button
            onClick={() => (mowi ? stop() : czytaj(karta))}
            data-testid="glosnik"
            className={`flex-1 h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition ${
              mowi ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700'
            }`}
          >
            <span className="text-lg">{mowi ? '⏸' : '🔊'}</span>
            {mowi ? 'Lolo czyta…' : 'Posłuchaj'}
          </button>
        ) : (
          <div className="flex-1" />
        )}

        <button
          onClick={() => idz(1)}
          disabled={i === karty.length - 1}
          aria-label="Następny krok"
          className="w-12 h-12 rounded-2xl bg-white border border-gray-200 text-xl text-gray-500 disabled:opacity-30 active:scale-95 transition flex items-center justify-center"
        >
          →
        </button>
      </div>

      {/* Wyciszenie — dla rodzica w autobusie i dla dziecka, które woli ciszę */}
      <button
        onClick={przelaczWyciszenie}
        className="text-[11px] text-gray-400 self-center flex-shrink-0 -mt-0.5"
      >
        {wyciszony ? '🔇 Lektor wyciszony — włącz' : '🔈 Wycisz lektora'}
      </button>
    </div>
  )
}
