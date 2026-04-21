// app/admin/logopedzi/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import { getSessionUser, createAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import TherapistEditForm from './TherapistEditForm'

export const metadata: Metadata = { title: 'Admin — Profil logopedy' }
export const revalidate = 0

export default async function TherapistDetailPage({ params }: { params: { id: string } }) {
  const session = await getSessionUser()
  if (!session || session.profile.role !== 'admin') redirect('/')

  const admin = createAdminClient()
  const { id } = params

  const [{ data: profile }, { data: userData }, { count: patientCount }, { data: plans }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', id).eq('role', 'therapist').single(),
    admin.auth.admin.getUserById(id),
    admin.from('therapist_patients').select('*', { count: 'exact', head: true }).eq('therapist_id', id),
    admin.from('exercise_plans')
      .select('id, name, is_active, created_at, patient:patient_id(full_name)')
      .eq('therapist_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (!profile) notFound()

  const user = userData?.user
  const daysLeft = profile.license_expires_at
    ? Math.round((new Date(profile.license_expires_at).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/admin/logopedzi" className="text-gray-400 hover:text-gray-600 transition text-sm">← Logopedzi</Link>
        <div className="flex items-center gap-3 ml-2">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-lg font-bold text-green-800">
            {profile.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{profile.full_name}</h1>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
          {profile.is_blocked && (
            <span className="ml-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">🚫 Zablokowany</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{patientCount ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">pacjentów</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{plans?.filter(p => p.is_active).length ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">aktywnych planów</div>
        </div>
        <div className={`rounded-2xl border p-4 text-center ${
          daysLeft !== null && daysLeft < 0 ? 'bg-red-50 border-red-100' :
          daysLeft !== null && daysLeft <= 7 ? 'bg-amber-50 border-amber-100' :
          'bg-green-50 border-green-100'
        }`}>
          <div className={`text-2xl font-bold ${
            daysLeft !== null && daysLeft < 0 ? 'text-red-700' :
            daysLeft !== null && daysLeft <= 7 ? 'text-amber-700' : 'text-green-700'
          }`}>
            {daysLeft === null ? '∞' : daysLeft < 0 ? 'Wygasła' : daysLeft === 0 ? 'Dziś' : `${daysLeft}d`}
          </div>
          <div className="text-xs text-gray-500 mt-1">licencja</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* EDIT FORM */}
        <TherapistEditForm profile={profile} />

        {/* SIDEBAR */}
        <div className="space-y-4">

          {/* OSTATNIE LOGOWANIE */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Informacje konta</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-800 text-right">{user?.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Zarejestrowany</dt>
                <dd className="text-gray-600">{new Date(profile.created_at).toLocaleDateString('pl-PL')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Ostatnie logowanie</dt>
                <dd className="text-gray-600">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('pl-PL') : 'Nigdy'}
                </dd>
              </div>
            </dl>
          </div>

          {/* OSTATNIE PLANY */}
          {plans && plans.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Ostatnie plany ćwiczeń</h3>
              <div className="space-y-2">
                {plans.slice(0, 5).map(plan => (
                  <div key={plan.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{plan.name}</div>
                      <div className="text-xs text-gray-400">
                        {(plan.patient as any)?.full_name ?? '—'}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {plan.is_active ? 'Aktywny' : 'Nieaktywny'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
