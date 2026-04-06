'use client'
// components/patient/CalendarGrid.tsx

import { useState } from 'react'
import { clsx } from 'clsx'

interface DayData { done: number; rate: number }

interface Props {
  activeDates: Map<string, DayData>
}

export default function CalendarGrid({ activeDates }: Props) {
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(0)  // 0 = bieżący, -1 = poprzedni, -2

  const months = [-2, -1, 0].map(offset => {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1)
    return { offset, date: d }
  })

  const { date: monthDate } = months.find(m => m.offset === selectedMonth)!

  return (
    <div className="space-y-4">
      {/* Przełącznik miesięcy */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {months.map(m => {
          const label = m.date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
          return (
            <button
              key={m.offset}
              onClick={() => setSelectedMonth(m.offset)}
              className={clsx(
                'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
                selectedMonth === m.offset
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {m.date.toLocaleDateString('pl-PL', { month: 'short' })}
            </button>
          )
        })}
      </div>

      {/* Siatka kalendarza */}
      <MonthCalendar
        year={monthDate.getFullYear()}
        month={monthDate.getMonth()}
        activeDates={activeDates}
        today={today}
      />
    </div>
  )
}

function MonthCalendar({
  year, month, activeDates, today,
}: {
  year: number
  month: number
  activeDates: Map<string, DayData>
  today: Date
}) {
  const DAYS = ['Pn','Wt','Śr','Cz','Pt','So','Nd']

  // Pierwszy dzień miesiąca (0=nd, dostosuj na 0=pn)
  const firstDay  = new Date(year, month, 1)
  const startIdx  = (firstDay.getDay() + 6) % 7  // 0=pon
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Komórki siatki
  const cells: (number | null)[] = [
    ...Array(startIdx).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // Dopełnij do pełnych tygodni
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = firstDay.toLocaleDateString('pl-PL', {
    month: 'long', year: 'numeric',
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <h3 className="text-sm font-bold text-gray-700 capitalize mb-3">{monthLabel}</h3>

      {/* Nagłówki dni */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Dni */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const data    = activeDates.get(dateStr)
          const isToday = dateStr === today.toISOString().split('T')[0]
          const isFuture = new Date(dateStr) > today

          let bg = 'bg-gray-100 text-gray-400'
          if (data) {
            bg = data.rate >= 100
              ? 'bg-green-500 text-white shadow-sm'
              : data.rate >= 50
              ? 'bg-green-200 text-green-800'
              : 'bg-green-100 text-green-700'
          }
          if (isFuture) bg = 'bg-gray-50 text-gray-300'

          return (
            <div
              key={i}
              title={data ? `${data.done} ćwiczeń (${data.rate}%)` : undefined}
              className={clsx(
                'aspect-square rounded-xl flex items-center justify-center text-xs font-semibold transition-all',
                bg,
                isToday && 'ring-2 ring-brand-600 ring-offset-1',
              )}
            >
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}
