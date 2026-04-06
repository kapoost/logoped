// app/(logopeda)/pacjenci/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { getSessionUser, createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { LEVELS, BADGES } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import PatientCalendarMini from '@/components/therapist/PatientCalendarMini'

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase.from('profiles').select('full_name').eq('id', params.id).single()
  return { title: data?.full_name ?? 'Pacjent' }
}

export const revalidate = 0

export default async function PatientProfilePage({ params }: Props) {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = createClient()

  // Sprawdź że to pacjent tego logopedy
  const { data: relation } = await supabase
    .from('therapist_patients')
    .select('patient_id')
    .eq('therapist_id', session.profile.id)
    .eq('patient_id', params.id)
    .single()

  if (!relation && session.profile.role !== 'admin') notFound()

  // Pobierz wszystkie dane równolegle
  const [
    { data: profile },
    { data: stats },
    { data: achievements },
    { data: activePlan },
    { data: calendarData },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', params.id).single(),
    supabase.from('patient_stats').select('*').eq('patient_id', params.id).single(),
    supabase.from('achievements').select('badge_key, unlocked_at').eq('patient_id', params.id),
    supabase
      .from('exercise_plans')
      .select(`*, plan_exercises(*, exercises(*))`)
      .eq('patient_id', params.id)
      .eq('therapist_id', session.profile.id)
      .eq('is_active', true)
      .single(),
    supabase.rpc('get_patient_calendar', { p_patient_id: params.id, p_months: 2 }),
  ])

  if (!profile) notFound()

  const levelDef    = LEVELS.find(l => l.level === (stats?.level ?? 1)) ?? LEVELS[0]
  const unlockedSet = new Set(achievements?.map(a => a.badge_key) ?? [])
  const initials    = profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const planExercises = (activePlan as any)?.plan_exercises ?? []

  return (
    <div className="animate-fade-in">
      {/* Nagłówek pacjenta */}
      <div className="bg-green-800 text-white px-5 pt-5 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/logopeda/pacjenci" className="text-green-300 text-sm hover:text-white">← Pacjenci</Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile.full_name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-green-300 text-sm">{levelDef.emoji} {levelDef.title}</span>
              <span className="text-green-400 text-xs">·</span>
              <span className="text-green-300 text-sm">{stats?.points ?? 0} pkt</span>
              {stats?.last_session_date && (
                <>
                  <span className="text-green-400 text-xs">·</span>
                  <span className="text-green-300 text-sm">
                    ostatnio {formatDistanceToNow(new Date(stats.last_session_date), { locale: pl, addSuffix: true })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Statystyki kluczowe */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Seria',    value: stats?.current_streak ?? 0,  suffix: 'dni', emoji: '🔥' },
            { label: 'Sesje',    value: stats?.total_sessions ?? 0,   suffix: '',    emoji: '📅' },
            { label: 'Ćwiczenia', value: stats?.total_exercises ?? 0, suffix: '',    emoji: '💪' },
            { label: 'Rekord',   value: stats?.longest_streak ?? 0,   suffix: 'dni', emoji: '🏅' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
              <div className="text-lg">{s.emoji}</div>
              <div className="text-lg font-bold text-gray-900 leading-tight">
                {s.value}{s.suffix ? ` ${s.suffix}` : ''}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mini-kalendarz */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-bold text-gray-800 mb-3">Aktywność — ostatnie 2 miesiące</h2>
          <PatientCalendarMini calendarData={calendarData ?? []} />
        </div>

        {/* Aktywny plan */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h2 className="font-bold text-gray-800">
              {activePlan ? `📋 ${(activePlan as any).name}` : '📋 Brak aktywnego planu'}
            </h2>
            <div className="flex gap-2">
              {activePlan && (
                <Link
                  href={`/logopeda/plany/${(activePlan as any).id}`}
                  className="text-xs text-green-700 font-semibold hover:underline"
                >
                  Edytuj →
                </Link>
              )}
              <Link
                href={`/logopeda/plany/nowy?pacjent=${params.id}`}
                className="text-xs bg-green-700 text-white px-2.5 py-1 rounded-lg font-semibold"
              >
                + Nowy plan
              </Link>
            </div>
          </div>

          {planExercises.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {planExercises.map((pe: any, i: number) => (
                <div key={pe.id} className="px-4 py-3 flex items-center gap-3">
                  <span className="w-6 h-6 bg-gray-100 rounded-full text-xs flex items-center justify-center text-gray-500 font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-lg">{pe.exercises?.emoji ?? '👅'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{pe.exercises?.title}</p>
                    <p className="text-xs text-gray-400">{pe.repetitions} powt.{pe.notes ? ` · ${pe.notes}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              Brak ćwiczeń w planie. Dodaj je przez kreator.
            </div>
          )}
        </div>

        {/* Odznaki */}
        {unlockedSet.size > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="font-bold text-gray-800 mb-3">
              Odznaki ({unlockedSet.size}/{BADGES.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {BADGES.filter(b => unlockedSet.has(b.key)).map(b => (
                <div key={b.key} className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5">
                  <span>{b.emoji}</span>
                  <span className="text-xs font-semibold text-amber-800">{b.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
