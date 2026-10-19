// app/admin/cwiczenia/[id]/page.tsx — podgląd ćwiczenia w panelu admina
import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { getSessionUser, createAdminClient } from '@/lib/supabase/server'
import { getExerciseUsage } from '@/lib/exercises/usage'
import type { ExerciseCategory, DifficultyLevel } from '@/types/database'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/types/database'
import Link from 'next/link'
import ExerciseLifecycleActions from '@/components/shared/ExerciseLifecycleActions'
import { plural } from '@/lib/plural'
import ExerciseImage from '@/components/shared/ExerciseImage'

export const metadata: Metadata = { title: 'Admin — Podgląd ćwiczenia' }
export const revalidate = 0

export default async function AdminPodgladCwiczeniaPage({ params }: { params: { id: string } }) {
  const session = await getSessionUser()
  if (!session || session.profile.role !== 'admin') redirect('/')

  const admin = createAdminClient()
  const { data: ex } = await admin.from('exercises').select('*').eq('id', params.id).single()
  if (!ex) notFound()

  const usage = await getExerciseUsage(params.id)
  const isArchived = !!ex.archived_at

  // Kto jest autorem — publiczne mają created_by = NULL
  const { data: author } = ex.created_by
    ? await admin.from('profiles').select('full_name').eq('id', ex.created_by).single()
    : { data: null }

  const steps = ex.instructions
    .split('\n').map((s: string) => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <Link href="/admin/cwiczenia" className="text-gray-400 hover:text-gray-600 transition text-sm">
        ← Ćwiczenia
      </Link>

      <div className="flex items-start gap-4">
        <span className="text-3xl w-14 h-14 bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0">
          <ExerciseImage src={ex.media_url} emoji={ex.emoji} title={ex.title} size={112} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{ex.title}</h1>
            {isArchived && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                zarchiwizowane
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            {CATEGORY_LABELS[ex.category as ExerciseCategory]}
            {' · '}
            {author ? `${author.full_name} (prywatne)` : 'baza publiczna'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <div className={`text-lg font-bold ${
            ex.difficulty === 'latwe'   ? 'text-green-700' :
            ex.difficulty === 'srednie' ? 'text-amber-700' : 'text-red-700'
          }`}>{DIFFICULTY_LABELS[ex.difficulty as DifficultyLevel]}</div>
          <div className="text-xs text-gray-500 mt-1">trudność</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <div className="text-lg font-bold text-gray-800">{ex.duration_seconds}s</div>
          <div className="text-xs text-gray-500 mt-1">czas</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <div className="text-lg font-bold text-gray-800">{usage.planCount}</div>
          <div className="text-xs text-gray-500 mt-1">
            {plural(usage.planCount, 'plan', 'plany', 'planów')}
            {usage.activePlanCount > 0 && ` (${usage.activePlanCount} akt.)`}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <div className="text-lg font-bold text-gray-800">{usage.patientCount}</div>
          <div className="text-xs text-gray-500 mt-1">
            {plural(usage.patientCount, 'pacjent', 'pacjentów', 'pacjentów')}
          </div>
        </div>
      </div>

      {ex.description && (
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <p className="text-sm text-gray-600">{ex.description}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Przebieg ćwiczenia</h2>
          <ol className="space-y-2.5">
            {steps.map((step: string, i: number) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
          {ex.target_sounds?.length ? (
            <p className="text-xs text-gray-400 mt-4">Głoski: {ex.target_sounds.join(', ')}</p>
          ) : null}
        </div>

        <div className="space-y-3">
          <Link
            href={`/admin/cwiczenia/${ex.id}/edytuj`}
            className="block w-full text-center bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition active:scale-95"
          >
            ✏️ Edytuj
          </Link>
          <ExerciseLifecycleActions
            exerciseId={ex.id}
            title={ex.title}
            isArchived={isArchived}
            canHardDelete={usage.canHardDelete}
            planCount={usage.planCount}
            scope="admin"
            listHref="/admin/cwiczenia"
          />
        </div>
      </div>
    </div>
  )
}
