// app/(admin)/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { getSessionUser, createAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Admin — Dashboard' }
export const revalidate = 60

export default async function AdminDashboardPage() {
  const session = await getSessionUser()
  if (!session || session.profile.role !== 'admin') redirect('/')

  const admin = createAdminClient()

  const [
    { count: therapistCount },
    { count: patientCount },
    { count: exerciseCount },
    { count: completionCount },
    { data: recentTherapists },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'therapist'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
    admin.from('exercises').select('*', { count: 'exact', head: true }),
    admin.from('exercise_completions').select('*', { count: 'exact', head: true }),
    admin.from('profiles')
      .select('id, full_name, created_at')
      .eq('role', 'therapist')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'Logopedzi',     value: therapistCount ?? 0,  emoji: '🩺', href: '/admin/logopedzi' },
    { label: 'Pacjenci',      value: patientCount ?? 0,    emoji: '🧒', href: null },
    { label: 'Baza ćwiczeń',  value: exerciseCount ?? 0,   emoji: '📚', href: '/admin/cwiczenia' },
    { label: 'Wykonań łącznie', value: completionCount ?? 0, emoji: '✅', href: null },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Przegląd całego systemu LogoPed</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-3xl mb-2">{s.emoji}</div>
            <div className="text-3xl font-bold text-gray-900">{s.value.toLocaleString('pl-PL')}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            {s.href && (
              <Link href={s.href} className="text-xs text-green-700 font-medium mt-2 block hover:underline">
                Zarządzaj →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Ostatnio dodani logopedzi */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-800">Ostatnio zarejestrowani logopedzi</h2>
          <Link href="/admin/logopedzi" className="text-sm text-green-700 font-medium hover:underline">
            Wszyscy →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentTherapists?.map(t => (
            <div key={t.id} className="px-5 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center text-sm font-bold text-green-800">
                {t.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{t.full_name}</p>
                <p className="text-xs text-gray-400">
                  {new Date(t.created_at).toLocaleDateString('pl-PL')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Akcje */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/admin/logopedzi/dodaj"
          className="bg-green-700 text-white rounded-2xl p-5 hover:bg-green-800 transition"
        >
          <div className="text-2xl mb-2">🩺</div>
          <p className="font-bold">Dodaj logopedę</p>
          <p className="text-green-300 text-sm mt-0.5">Utwórz konto dla nowego logopedy</p>
        </Link>
        <Link
          href="/admin/cwiczenia/nowe"
          className="bg-gray-800 text-white rounded-2xl p-5 hover:bg-gray-900 transition"
        >
          <div className="text-2xl mb-2">📝</div>
          <p className="font-bold">Dodaj ćwiczenie</p>
          <p className="text-gray-400 text-sm mt-0.5">Rozbuduj publiczną bazę ćwiczeń</p>
        </Link>
      </div>
    </div>
  )
}
