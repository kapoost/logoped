// app/(logopeda)/pacjenci/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser, createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { LEVELS } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'

export const metadata: Metadata = { title: 'Moi pacjenci' }
export const revalidate = 0

export default async function PacjenciPage() {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = createClient()

  const { data: patients } = await supabase
    .from('therapist_patient_overview')
    .select('*')
    .eq('therapist_id', session.profile.id)

  const active   = patients?.filter(p => {
    if (!p.last_session_date) return false
    const lastDate = new Date(p.last_session_date)
    const diff = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 3
  }) ?? []

  const inactive = patients?.filter(p => !active.includes(p)) ?? []

  return (
    <div className="animate-fade-in">
      {/* Nagłówek */}
      <div className="bg-green-800 text-white px-5 py-5">
        <h1 className="text-xl font-bold mb-1">Moi pacjenci</h1>
        <div className="flex gap-4 text-sm text-green-300">
          <span>👥 {patients?.length ?? 0} łącznie</span>
          <span>✅ {active.length} aktywnych</span>
          {inactive.length > 0 && (
            <span className="text-amber-300">⚠️ {inactive.length} nieaktywnych</span>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Alert — nieaktywni pacjenci */}
        {inactive.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              ⚠️ Pacjenci bez ćwiczeń od 3+ dni
            </p>
            {inactive.map(p => (
              <Link
                key={p.patient_id}
                href={`/logopeda/pacjenci/${p.patient_id}`}
                className="block text-sm text-amber-700 hover:text-amber-900 py-0.5"
              >
                → {p.full_name}{' '}
                <span className="text-amber-500 text-xs">
                  {p.last_session_date
                    ? `(ostatnio ${formatDistanceToNow(new Date(p.last_session_date), { locale: pl, addSuffix: true })})`
                    : '(brak aktywności)'}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Lista kart */}
        {!patients?.length ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">👥</div>
            <p className="font-semibold text-gray-600 mb-1">Brak pacjentów</p>
            <p className="text-sm text-gray-400">Dodaj pierwszego pacjenta, żeby zacząć</p>
          </div>
        ) : (
          <div className="space-y-3">
            {patients.map(p => {
              const levelDef = LEVELS.find(l => l.level === (p.level ?? 1)) ?? LEVELS[0]
              const streak   = p.current_streak ?? 0
              const week     = p.days_active_this_week ?? 0
              const lastDate = p.last_session_date ? new Date(p.last_session_date) : null
              const daysSince = lastDate
                ? Math.floor((Date.now() - lastDate.getTime()) / 86400000)
                : null

              const isAlert = daysSince === null || daysSince >= 3

              return (
                <Link
                  key={p.patient_id}
                  href={`/logopeda/pacjenci/${p.patient_id}`}
                  className="block bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition overflow-hidden"
                >
                  <div className="px-4 pt-4 pb-3 flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center font-bold text-green-800 text-sm flex-shrink-0">
                      {p.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 truncate">{p.full_name}</p>
                        {isAlert && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            ⚠️ Nieaktywny
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {levelDef.emoji} {levelDef.title} · {p.points ?? 0} pkt
                      </p>
                    </div>

                    {/* Seria */}
                    <div className="flex-shrink-0 text-center">
                      <div className={`text-lg ${streak >= 3 ? '' : 'opacity-40'}`}>
                        {streak >= 30 ? '🦁' : streak >= 7 ? '🏅' : streak >= 3 ? '🔥' : '💧'}
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{streak} dni</p>
                    </div>
                  </div>

                  {/* Pasek tygodnia */}
                  <div className="px-4 pb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                      <span>Ten tydzień</span>
                      <span className={week >= 5 ? 'text-green-600 font-medium' : ''}>{week}/7 dni</span>
                    </div>
                    <div className="flex gap-1">
                      {['Pn','Wt','Śr','Cz','Pt','So','Nd'].map((day, i) => (
                        <div key={day} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className={`w-full h-1.5 rounded-full ${
                              i < week ? 'bg-green-500' : 'bg-gray-100'
                            }`}
                          />
                          <span className="text-[9px] text-gray-300">{day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Przycisk dodania pacjenta */}
        <Link
          href="/logopeda/pacjenci/dodaj"
          className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-500 hover:border-green-300 hover:text-green-700 transition"
        >
          <span className="text-lg">➕</span>
          Dodaj pacjenta
        </Link>
      </div>
    </div>
  )
}
