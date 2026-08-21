// app/logopeda/cwiczenia/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import { getSessionUser, createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { ExerciseCategory, DifficultyLevel } from '@/types/database'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/types/database'
import Link from 'next/link'
import ExercisePreviewActions from './ExercisePreviewActions'
import ExerciseLifecycleActions from '@/components/shared/ExerciseLifecycleActions'
import { getExerciseUsage } from '@/lib/exercises/usage'
import { plural } from '@/lib/plural'

export const metadata: Metadata = { title: 'Podgląd ćwiczenia' }
export const revalidate = 0

export default async function PodgladCwiczeniaPage({ params }: { params: { id: string } }) {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = createClient()
  const { data: ex } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!ex) notFound()

  const isOwn      = ex.created_by === session.user.id
  const isArchived = !!ex.archived_at
  const usage      = isOwn ? await getExerciseUsage(params.id) : null
  const steps = ex.instructions
    .split('\n').map((s: string) => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)

  return (
    <div className="animate-fade-in pb-8">
      <div className="bg-green-800 text-white px-5 py-5">
        <Link href="/logopeda/cwiczenia" className="text-green-300 hover:text-white text-sm transition">
          ← Baza ćwiczeń
        </Link>
        <div className="flex items-start gap-3 mt-3">
          <span className="text-3xl w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0">
            {ex.emoji}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold">{ex.title}</h1>
            <p className="text-green-300 text-sm mt-0.5">
              {CATEGORY_LABELS[ex.category as ExerciseCategory]}
              {isOwn ? ' · Twoje ćwiczenie' : ex.created_by === null ? ' · z bazy publicznej' : ''}
              {isArchived ? ' · w archiwum' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Metryki */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center">
            <div className={`text-sm font-bold ${
              ex.difficulty === 'latwe'   ? 'text-green-700' :
              ex.difficulty === 'srednie' ? 'text-amber-700' : 'text-red-700'
            }`}>
              {DIFFICULTY_LABELS[ex.difficulty as DifficultyLevel]}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">trudność</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center">
            <div className="text-sm font-bold text-gray-800">{ex.duration_seconds}s</div>
            <div className="text-[11px] text-gray-400 mt-0.5">czas</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center">
            <div className="text-sm font-bold text-gray-800">
              {usage
                ? usage.planCount
                : ex.target_sounds?.length ? ex.target_sounds.join(', ') : '—'}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              {usage ? plural(usage.planCount, 'plan', 'plany', 'planów') : 'głoski'}
            </div>
          </div>
        </div>

        {ex.description && (
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
            <p className="text-sm text-gray-600">{ex.description}</p>
          </div>
        )}

        {/* Instrukcja — tak jak zobaczy ją dziecko */}
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4">
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
        </div>

        {isArchived && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
            <p className="text-sm text-amber-800 font-medium">To ćwiczenie jest w archiwum</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Nie pojawia się w bazie ani w kreatorze planów. Plany, w których już było, działają dalej.
            </p>
          </div>
        )}

        <ExercisePreviewActions exerciseId={ex.id} isOwn={isOwn} isArchived={isArchived} />

        {isOwn && usage && (
          <ExerciseLifecycleActions
            exerciseId={ex.id}
            title={ex.title}
            isArchived={isArchived}
            canHardDelete={usage.canHardDelete}
            planCount={usage.planCount}
            scope="logopeda"
            listHref="/logopeda/cwiczenia"
          />
        )}
      </div>
    </div>
  )
}
