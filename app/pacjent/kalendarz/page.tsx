// app/(pacjent)/kalendarz/page.tsx
import { redirect } from 'next/navigation'
import { getSessionUser, createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import CalendarGrid from '@/components/patient/CalendarGrid'

export const metadata: Metadata = { title: 'Kalendarz' }
export const revalidate = 0

export default async function KalendarzPage() {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = createClient()

  // Użyj funkcji get_patient_calendar z 005_views.sql
  const { data: calendarData } = await supabase
    .rpc('get_patient_calendar', {
      p_patient_id: session.profile.id,
      p_months:     3,
    })

  // Zbierz wszystkie daty z wykonaniami
  const activeDates = new Map(
    (calendarData ?? []).map(d => [
      d.session_date,
      { done: Number(d.exercises_done), rate: Number(d.completion_rate) },
    ])
  )

  return (
    <div className="animate-fade-in">
      {/* Nagłówek */}
      <div className="bg-brand-600 text-white px-5 pt-5 pb-6">
        <h1 className="text-xl font-bold">Kalendarz ćwiczeń</h1>
        <p className="text-brand-200 text-sm mt-0.5">
          Zielone dni = ćwiczenia wykonane 🟢
        </p>
      </div>

      <div className="px-4 py-4">
        <CalendarGrid activeDates={activeDates} />

        {/* Legenda */}
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-green-500 rounded-full" />
            Wszystkie ćwiczenia
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-green-200 rounded-full" />
            Częściowo
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-gray-100 rounded-full" />
            Brak
          </div>
        </div>
      </div>
    </div>
  )
}
