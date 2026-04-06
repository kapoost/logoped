// app/(admin)/cwiczenia/page.tsx
import { redirect } from 'next/navigation'
import { getSessionUser, createAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/types/database'
import type { ExerciseCategory, DifficultyLevel } from '@/types/database'
import AdminExerciseActions from './AdminExerciseActions'

export const metadata: Metadata = { title: 'Admin — Ćwiczenia' }
export const revalidate = 0

export default async function AdminCwiczeniaPage() {
  const session = await getSessionUser()
  if (!session || session.profile.role !== 'admin') redirect('/')

  const admin = createAdminClient()

  const { data: exercises } = await admin
    .from('exercises')
    .select('id, title, category, difficulty, emoji, is_public, created_by, duration_seconds, target_sounds')
    .order('category')
    .order('title')

  const publicEx  = exercises?.filter(e => e.created_by === null) ?? []
  const privateEx = exercises?.filter(e => e.created_by !== null) ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Baza ćwiczeń</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {publicEx.length} publicznych · {privateEx.length} prywatnych logopedów
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
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {publicEx.map(ex => (
                <tr key={ex.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-xl">{ex.emoji}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{ex.title}</p>
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
                  <td className="px-4 py-3 text-right">
                    <AdminExerciseActions exerciseId={ex.id} title={ex.title} />
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {privateEx.map(ex => (
                  <tr key={ex.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-xl">{ex.emoji}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{ex.title}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        ex.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {ex.is_public ? 'publiczne' : 'prywatne'}
                      </span>
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
