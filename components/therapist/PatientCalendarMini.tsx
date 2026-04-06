// components/therapist/PatientCalendarMini.tsx
// Kompaktowa mapa cieplna aktywności pacjenta — widok logopedy

interface DayData {
  session_date: string
  exercises_done: number
  completion_rate: number
}

export default function PatientCalendarMini({ calendarData }: { calendarData: DayData[] }) {
  const dataMap = new Map(calendarData.map(d => [d.session_date, d]))

  // Generuj ostatnie 56 dni (8 tygodni)
  const today  = new Date()
  const days   = Array.from({ length: 56 }, (_, i) => {
    const d       = new Date(today)
    d.setDate(d.getDate() - (55 - i))
    return d.toISOString().split('T')[0]
  })

  // Podziel na tygodnie
  const weeks: string[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div>
      {/* Nagłówki dni tygodnia */}
      <div className="flex gap-1 mb-1">
        {['Pn','Wt','Śr','Cz','Pt','So','Nd'].map(d => (
          <div key={d} className="w-7 text-center text-[9px] text-gray-400">{d}</div>
        ))}
      </div>

      {/* Siatka tygodni */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex gap-1">
            {week.map(dateStr => {
              const data    = dataMap.get(dateStr)
              const isToday = dateStr === today.toISOString().split('T')[0]
              const rate    = data?.completion_rate ?? 0

              let bg = 'bg-gray-100'
              if (data) {
                bg = rate >= 100 ? 'bg-green-500'
                   : rate >= 50  ? 'bg-green-300'
                   :               'bg-green-200'
              }

              return (
                <div
                  key={dateStr}
                  title={data
                    ? `${dateStr}: ${data.exercises_done} ćwiczeń (${rate}%)`
                    : dateStr}
                  className={`w-7 h-7 rounded-md transition-all ${bg} ${
                    isToday ? 'ring-2 ring-green-700 ring-offset-1' : ''
                  }`}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400">
        <span>Mniej</span>
        {['bg-gray-100','bg-green-200','bg-green-300','bg-green-500'].map(c => (
          <div key={c} className={`w-4 h-4 rounded ${c}`} />
        ))}
        <span>Więcej</span>
      </div>
    </div>
  )
}
