'use client'
// components/patient/IlustracjaAnimowana.tsx
// Ilustracja ćwiczenia, która pokazuje RUCH zamiast zastygłej pozy.
//
// Druga klatka leży obok pierwszej pod tą samą nazwą z sufiksem -b. Komponent
// sprawdza ją sam i przy braku pokazuje nieruchomą klatkę A — nie ma kolumny
// w bazie i nie ma stanu do pilnowania, tak samo jak przy nagraniach lektora.
//
// Tylko ekran ćwiczenia. Na liście sześć migających kafelków byłoby jarmarkiem,
// a nie podpowiedzią.

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface Props {
  /** media_url z bazy — klatka A */
  src:   string | null | undefined
  emoji: string
  title: string
  size:  number
  priority?: boolean
}

/** media/x.webp → media/x-b.webp */
function adresKlatkiB(src: string): string | null {
  return /\.webp$/i.test(src) ? src.replace(/\.webp$/i, '-b.webp') : null
}

const CZAS_KLATKI_MS = 1500

export default function IlustracjaAnimowana({ src, emoji, title, size, priority = false }: Props) {
  const [maKlatkeB, setMaKlatkeB] = useState(false)
  const [pokazB, setPokazB]       = useState(false)

  const urlB = src ? adresKlatkiB(src) : null

  // Sprawdzenie, czy druga klatka w ogóle istnieje. Obrazek bez niej po prostu
  // stoi — dokładnie tak jak przed wprowadzeniem animacji.
  useEffect(() => {
    if (!urlB) return
    let aktualne = true
    const probny = new window.Image()
    probny.onload  = () => { if (aktualne) setMaKlatkeB(true) }
    probny.onerror = () => { /* brak klatki B to nie błąd */ }
    probny.src = urlB
    return () => { aktualne = false }
  }, [urlB])

  // Dziecko z nadwrażliwością sensoryczną ma prawo do nieruchomego obrazka.
  useEffect(() => {
    if (!maKlatkeB) return
    const bezRuchu = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (bezRuchu.matches) return

    const tyk = setInterval(() => setPokazB(p => !p), CZAS_KLATKI_MS)
    return () => clearInterval(tyk)
  }, [maKlatkeB])

  if (!src) return <>{emoji}</>

  return (
    <div className="relative w-full h-full">
      <Image
        src={src}
        alt={`Ilustracja: ${title}`}
        width={size}
        height={size}
        priority={priority}
        className="absolute inset-0 w-full h-full object-cover rounded-[inherit]"
      />
      {maKlatkeB && urlB && (
        <Image
          src={urlB}
          alt=""
          aria-hidden
          width={size}
          height={size}
          className={`absolute inset-0 w-full h-full object-cover rounded-[inherit] transition-opacity duration-700 ${
            pokazB ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}
