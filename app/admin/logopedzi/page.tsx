// app/admin/logopedzi/page.tsx
import { redirect } from 'next/navigation'
import { getSessionUser, createAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Admin — Logopedzi' }
export const revalidate = 0

const LIC: Record<string, { label: string; color: string; bg: string }> = {
  trial:     { label: 'Trial',     color: '#92400e', bg: '#fef3c7' },
  basic:     { label: 'Basic',     color: '#1e40af', bg: '#dbeafe' },
  pro:       { label: 'Pro',       color: '#5b21b6', bg: '#ede9fe' },
  unlimited: { label: 'Unlimited', color: '#065f46', bg: '#d1fae5' },
}

export default async function LogopedziPage() {
  const session = await getSessionUser()
  if (!session || session.profile.role !== 'admin') redirect('/')

  const admin = createAdminClient()

  const { data: therapists } = await admin
    .from('profiles')
    .select('id, full_name, created_at, avatar_url, license_type, license_expires_at, max_patients, is_blocked, organization')
    .eq('role', 'therapist')
    .order('created_at', { ascending: false })

  const enriched = await Promise.all(
    (therapists ?? []).map(async t => {
      const [{ count: pc }, { data: emailData }] = await Promise.all([
        admin.from('therapist_patients').select('*', { count: 'exact', head: true }).eq('therapist_id', t.id),
        admin.auth.admin.getUserById(t.id),
      ])
      const daysLeft = t.license_expires_at
        ? Math.round((new Date(t.license_expires_at).getTime() - Date.now()) / 86400000)
        : null
      return {
        ...t,
        email: emailData.user?.email ?? '',
        last_sign_in: emailData.user?.last_sign_in_at ?? null,
        patient_count: pc ?? 0,
        days_left: daysLeft,
        expired: daysLeft !== null && daysLeft < 0,
      }
    })
  )

  const total   = enriched.length
  const active  = enriched.filter(t => !t.is_blocked && !t.expired).length
  const soon    = enriched.filter(t => !t.expired && t.days_left !== null && t.days_left <= 7 && t.days_left >= 0).length
  const blocked = enriched.filter(t => t.is_blocked).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logopedzi</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} zarejestrowanych</p>
        </div>
        <Link href="/admin/logopedzi/dodaj"
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition">
          + Dodaj logopedę
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Wszyscy',         v: total,   c: '#374151', bg: '#f9fafb' },
          { label: 'Aktywni',         v: active,  c: '#065f46', bg: '#d1fae5' },
          { label: 'Wygasa ≤7 dni',   v: soon,    c: '#92400e', bg: '#fef3c7' },
          { label: 'Zablokowani',     v: blocked, c: '#991b1b', bg: '#fee2e2' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: s.bg }}>
            <div className="text-2xl font-bold" style={{ color: s.c }}>{s.v}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: s.c }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {!enriched.length ? (
          <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-3">🩺</div><p>Brak logopedów.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Logopeda','Licencja','Wygasa','Pacjenci','Ostatnie logowanie','Status',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {enriched.map(t => {
                  const lic = LIC[t.license_type ?? 'trial'] ?? LIC.trial
                  const pct = t.max_patients ? Math.min(100, Math.round(t.patient_count / t.max_patients * 100)) : 0
                  return (
                    <tr key={t.id} className={`hover:bg-gray-50 transition ${t.is_blocked ? 'opacity-55' : ''}`}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center text-sm font-bold text-green-800 flex-shrink-0">
                            {t.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{t.full_name}</div>
                            <div className="text-xs text-gray-400">{t.email}</div>
                            {t.organization && <div className="text-xs text-gray-400">{t.organization}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: lic.bg, color: lic.color }}>{lic.label}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {t.license_expires_at ? (
                          <div>
                            <div className={`text-xs font-medium ${t.expired ? 'text-red-600' : t.days_left !== null && t.days_left <= 7 ? 'text-amber-600' : 'text-gray-700'}`}>
                              {t.expired ? 'Wygasła' : t.days_left === 0 ? 'Dziś!' : `${t.days_left} dni`}
                            </div>
                            <div className="text-xs text-gray-400">{new Date(t.license_expires_at).toLocaleDateString('pl-PL')}</div>
                          </div>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-sm font-medium text-gray-700">{t.patient_count} / {t.max_patients ?? '∞'}</div>
                        {t.max_patients ? (
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full rounded-full" style={{
                              width: `${pct}%`,
                              background: pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e',
                            }}/>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400">
                        {t.last_sign_in ? new Date(t.last_sign_in).toLocaleDateString('pl-PL') : 'Nigdy'}
                      </td>
                      <td className="px-4 py-3.5">
                        {t.is_blocked
                          ? <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">🚫 Zablok.</span>
                          : t.expired
                            ? <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">⏰ Wygasła</span>
                            : <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">✓ Aktywny</span>
                        }
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link href={`/admin/logopedzi/${t.id}`}
                          className="text-xs font-medium text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition">
                          Zarządzaj →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
