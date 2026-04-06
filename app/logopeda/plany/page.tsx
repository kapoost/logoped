// app/(logopeda)/plany/page.tsx
import { redirect } from 'next/navigation'
import { getSessionUser, createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'

export const metadata: Metadata = { title: 'Plany ćwiczeń' }
export const revalidate = 0

export default async function PlanyPage() {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = createClient()

  const { data: plans } = await supabase
    .from('exercise_plans')
    .select(`
      id, name, is_active, start_date, created_at,
      profiles!patient_id ( full_name ),
      plan_exercises ( id )
    `)
    .eq('therapist_id', session.profile.id)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false })

  const active   = plans?.filter(p => p.is_active)   ?? []
  const inactive = plans?.filter(p => !p.is_active)  ?? []

  return (
    <div className="animate-fade-in">
      <div className="bg-green-800 text-white px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Plany ćwiczeń</h1>
            <p className="text-green-300 text-sm mt-0.5">
              {active.length} aktywnych · {inactive.length} nieaktywnych
            </p>
          </div>
          <Link
            href="/logopeda/plany/nowy"
            className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-3 py-2 rounded-xl transition"
          >
            + Nowy plan
          </Link>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        {active.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Aktywne</h2>
            <div className="space-y-2">
              {active.map(plan => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          </section>
        )}

        {inactive.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Nieaktywne</h2>
            <div className="space-y-2 opacity-60">
              {inactive.map(plan => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          </section>
        )}

        {!plans?.length && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-semibold text-gray-600 mb-1">Brak planów</p>
            <p className="text-sm text-gray-400 mb-4">Utwórz pierwszy plan dla pacjenta</p>
            <Link
              href="/logopeda/plany/nowy"
              className="bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
            >
              Utwórz plan
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function PlanCard({ plan }: { plan: any }) {
  const patientName     = plan.profiles?.full_name ?? 'Pacjent'
  const exerciseCount   = plan.plan_exercises?.length ?? 0

  return (
    <Link
      href={`/logopeda/plany/${plan.id}`}
      className="block bg-white border border-gray-100 rounded-2xl px-4 py-3 hover:border-green-200 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">{plan.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">👤 {patientName}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span className="text-xs text-gray-400">{exerciseCount} ćw.</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {plan.is_active ? 'Aktywny' : 'Nieaktywny'}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1.5">
        Od {new Date(plan.start_date).toLocaleDateString('pl-PL')}
        {' · '}
        utworzony {formatDistanceToNow(new Date(plan.created_at), { locale: pl, addSuffix: true })}
      </p>
    </Link>
  )
}
