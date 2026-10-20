import Image from 'next/image'
import { przekrojeDlaGlosek, type Przekroj } from '@/lib/przekroje'

interface Props {
  /** target_sounds ćwiczenia */
  gloski: string[] | null | undefined
  /**
   * Widok pacjenta pokazuje wyłącznie pozycje zaakceptowane przez logopedę.
   * Rysunek błędnego układu języka nie jest neutralny — dziecko ćwiczy to,
   * co widzi, więc niezweryfikowana pozycja szkodzi terapii zamiast pomagać.
   * Logopeda i admin widzą wszystko, z etykietą stanu oceny.
   */
  dlaPacjenta?: boolean
}

const ETYKIETA: Record<Przekroj['status'], { tekst: string; klasa: string } | null> = {
  zaakceptowany: null,
  czeka:         { tekst: 'czeka na akceptację', klasa: 'bg-amber-100 text-amber-800' },
  nieoceniony:   { tekst: 'nieoceniony',          klasa: 'bg-gray-100 text-gray-600' },
}

/**
 * Przekrój strzałkowy jamy ustnej obok ilustracji ćwiczenia.
 *
 * Ilustracja z bohaterem pokazuje rekwizyt i nastrój, ale układ języka dzieje
 * się wewnątrz jamy ustnej i na zewnętrznym rysunku go nie widać. Te dwa
 * rysunki nie zastępują się nawzajem — uzupełniają.
 *
 * Nic nie renderuje, gdy ćwiczenie nie ma przypisanych głosek albo gdy żadna
 * z pozycji nie przeszła bramki widoczności.
 */
export default function PrzekrojJamyUstnej({ gloski, dlaPacjenta = false }: Props) {
  const wszystkie = przekrojeDlaGlosek(gloski)
  const przekroje = dlaPacjenta
    ? wszystkie.filter(p => p.status === 'zaakceptowany')
    : wszystkie

  if (!przekroje.length) return null

  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-4">
      <h2 className="font-semibold text-gray-800 mb-1">
        {przekroje.length > 1 ? 'Układ języka — porównanie' : 'Układ języka'}
      </h2>
      <p className="text-sm text-gray-500 mb-3">
        {przekroje.length > 1
          ? 'Ćwiczenie polega na różnicy między tymi układami.'
          : 'Przekrój strzałkowy — widok z boku.'}
      </p>

      <div className={przekroje.length > 1 ? 'grid grid-cols-2 gap-3' : ''}>
        {przekroje.map(p => {
          const etykieta = ETYKIETA[p.status]
          return (
            <figure key={p.plik} className="m-0">
              <div className="bg-brand-50 rounded-xl overflow-hidden flex items-center justify-center p-2">
                <Image
                  src={`/przekroje/${p.plik}`}
                  alt={`Przekrój jamy ustnej: ${p.nazwa}`}
                  width={240}
                  height={300}
                  unoptimized
                  className="w-full h-auto max-h-56 object-contain"
                />
              </div>
              <figcaption className="mt-2">
                <p className="text-sm font-medium text-gray-800">{p.nazwa}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.opis}</p>
                {p.zastrzezenie && (
                  <p className="text-xs text-amber-700 mt-1">⚠ {p.zastrzezenie}</p>
                )}
                {etykieta && (
                  <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${etykieta.klasa}`}>
                    {etykieta.tekst}
                  </span>
                )}
              </figcaption>
            </figure>
          )
        })}
      </div>
    </section>
  )
}
