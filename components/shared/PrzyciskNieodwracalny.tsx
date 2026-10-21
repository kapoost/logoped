'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  /** Co się stanie po potwierdzeniu. */
  onConfirm: () => void
  /** Etykieta w stanie spoczynku, np. „Usuń". */
  label: string
  /** Jedno zdanie o tym, co dokładnie zniknie — widoczne DOPIERO po pierwszym kliknięciu. */
  pytanie: string
  disabled?: boolean
  busy?: boolean
  className?: string
}

/**
 * Akcja nieodwracalna w dwóch krokach, zamiast natywnego confirm().
 *
 * confirm() jest modalem przeglądarki: wygląda obco w zainstalowanej PWA,
 * nie da się go opisać ani ostylować, a na telefonie przycisk potwierdzenia
 * ląduje dokładnie tam, gdzie przed chwilą był palec — czyli najłatwiej
 * potwierdzić coś, czego się nie chciało.
 *
 * Tutaj pierwsze kliknięcie tylko ODSŁANIA pytanie i rozdziela cele dotyku:
 * „Anuluj" stoi pierwszy, bo to bezpieczniejsze wyjście. Stan sam wygasa po
 * pięciu sekundach, żeby odsłonięte potwierdzenie nie czekało w nieskończoność
 * na przypadkowe trafienie.
 */
export default function PrzyciskNieodwracalny({
  onConfirm, label, pytanie, disabled, busy, className = '',
}: Props) {
  const [pyta, setPyta] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!pyta) return
    timer.current = setTimeout(() => setPyta(false), 5000)
    return () => clearTimeout(timer.current)
  }, [pyta])

  if (!pyta) {
    return (
      <button
        type="button"
        onClick={() => setPyta(true)}
        disabled={disabled || busy}
        className={className || 'text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 transition'}
      >
        {busy ? '…' : label}
      </button>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
      <span className="text-xs text-red-800">{pytanie}</span>
      <button
        type="button"
        onClick={() => setPyta(false)}
        className="text-xs font-bold text-gray-600 hover:text-gray-900 transition"
      >
        Anuluj
      </button>
      <button
        type="button"
        onClick={() => { setPyta(false); onConfirm() }}
        className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-lg transition"
      >
        Usuń
      </button>
    </span>
  )
}
