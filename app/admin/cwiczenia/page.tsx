// app/admin/cwiczenia/page.tsx
import { redirect } from 'next/navigation'
import { getSessionUser, createAdminClient } from '@/lib/supabase/server'
import { getUsageMap } from '@/lib/exercises/usage'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/types/database'
import type { ExerciseCategory, DifficultyLevel } from '@/types/database'
import AdminExerciseActions from './AdminExerciseActions'
import { plany } from '@/lib/plural'
import ExerciseImage from '@/components/shared/ExerciseImage'

export const metadata: Metadata = { title: 'Admin — Ćwiczenia' }
export const revalidate = 0

export default async function AdminCwiczeniaPage() {
  const session = await getSessionUser()
  if (!session || session.profile.role !== 'admin') redirect('/')

  const admin = createAdminClient()

  const [{ data: exercises }, usage] = await Promise.all([
    admin
      .from('exercises')
      .select('id, title, category, difficulty, emoji, media_url, is_public, created_by, duration_seconds, target_sounds, archived_at')
      .order('category')
      .order('title'),
    getUsageMap(),
  ])

  const all       = exercises ?? []
  const active    = all.filter(e => !e.archived_at)
  const archived  = all.filter(e =>  e.archived_at)
  const publicEx  = active.filter(e => e.created_by === null)
  const privateEx = active.filter(e => e.created_by !== null)

  const u = (id: string) => usage[id] ?? { planCount: 0, activePlanCount: 0, patientCount: 0, canHardDelete: true }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Baza ćwiczeń</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {publicEx.length} publicznych · {privateEx.length} prywatnych logopedów
            {archived.length > 0 && ` · ${archived.length} w archiwum`}
          </p>
        </div>
        <Link
          href="/admin/cwiczenia/nowe"
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition"
        >
          + Dodaj ćwiczenie
        </Link>
      </div>

      {/* Publiczna baza */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
          Ćwiczenia publiczne ({publicEx.length})
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-10" />
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nazwa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trudność</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Użycie</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-64">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {publicEx.map(ex => (
                <tr key={ex.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-xl">
                    <span className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center">
                      <ExerciseImage src={ex.media_url} emoji={ex.emoji} title={ex.title} size={72} />
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/cwiczenia/${ex.id}`} className="font-medium text-gray-900 hover:text-green-800">
                      {ex.title}
                    </Link>
                    {ex.target_sounds?.length ? (
                      <p className="text-xs text-gray-400">{ex.target_sounds.join(', ')}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {CATEGORY_LABELS[ex.category as ExerciseCategory]}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      ex.difficulty === 'latwe'   ? 'bg-green-100 text-green-700' :
                      ex.difficulty === 'srednie' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                    }`}>
                      {DIFFICULTY_LABELS[ex.difficulty as DifficultyLevel]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {u(ex.id).planCount === 0
                      ? <span className="text-gray-300">nieużywane</span>
                      : plany(u(ex.id).planCount)}
                  </td>
                  <td className="px-4 py-3">
                    <AdminExerciseActions
                      exerciseId={ex.id}
                      title={ex.title}
                      isArchived={false}
                      canHardDelete={u(ex.id).canHardDelete}
                      planCount={u(ex.id).planCount}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Prywatne ćwiczenia logopedów */}
      {privateEx.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            Ćwiczenia logopedów ({privateEx.length})
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase w-10" />
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nazwa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Widoczność</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Użycie</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-64">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {privateEx.map(ex => (
                  <tr key={ex.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-xl">
                    <span className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center">
                      <ExerciseImage src={ex.media_url} emoji={ex.emoji} title={ex.title} size={72} />
                    </span>
                  </td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/cwiczenia/${ex.id}`} className="font-medium text-gray-900 hover:text-green-800">
                        {ex.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        ex.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {ex.is_public ? 'publiczne' : 'prywatne'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {u(ex.id).planCount === 0
                        ? <span className="text-gray-300">nieużywane</span>
                        : plany(u(ex.id).planCount)}
                    </td>
                    <td className="px-4 py-3">
                      <AdminExerciseActions
                        exerciseId={ex.id}
                        title={ex.title}
                        isArchived={false}
                        canHardDelete={u(ex.id).canHardDelete}
                        planCount={u(ex.id).planCount}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Archiwum */}
      {archived.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            Archiwum ({archived.length})
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Wycofane z bazy i z kreatora planów. Plany, w których już były, działają dalej.
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden opacity-80">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase w-10" />
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nazwa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Zarchiwizowano</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Użycie</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-64">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {archived.map(ex => (
                  <tr key={ex.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-xl grayscale">
                      <span className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center">
                        <ExerciseImage src={ex.media_url} emoji={ex.emoji} title={ex.title} size={72} />
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/cwiczenia/${ex.id}`} className="font-medium text-gray-500 hover:text-green-800">
                        {ex.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(ex.archived_at!).toLocaleDateString('pl-PL')}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {u(ex.id).planCount === 0
                        ? <span className="text-gray-300">nieużywane</span>
                        : plany(u(ex.id).planCount)}
                    </td>
                    <td className="px-4 py-3">
                      <AdminExerciseActions
                        exerciseId={ex.id}
                        title={ex.title}
                        isArchived={true}
                        canHardDelete={u(ex.id).canHardDelete}
                        planCount={u(ex.id).planCount}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
