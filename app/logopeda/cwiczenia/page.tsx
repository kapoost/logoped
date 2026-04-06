// app/(logopeda)/cwiczenia/page.tsx
import { redirect } from 'next/navigation'
import { getSessionUser, createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { ExerciseCategory, DifficultyLevel } from '@/types/database'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/types/database'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Baza ćwiczeń' }
export const revalidate = 60

interface Props {
  searchParams: {
    kategoria?: ExerciseCategory
    trudnosc?:  DifficultyLevel
    gloska?:    string
    q?:         string
  }
}

export default async function CwiczeniaPage({ searchParams: sp }: Props) {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = createClient()

  let query = supabase
    .from('exercises')
    .select('id, title, description, category, difficulty, target_sounds, emoji, duration_seconds, created_by, is_public')
    .order('category')
    .order('title')

  if (sp.kategoria) query = query.eq('category', sp.kategoria)
  if (sp.trudnosc)  query = query.eq('difficulty', sp.trudnosc)
  if (sp.gloska)    query = query.contains('target_sounds', [sp.gloska])
  if (sp.q)         query = query.ilike('title', `%${sp.q}%`)

  const { data: exercises } = await query.limit(100)

  // Grupuj wg kategorii
  const byCategory = (exercises ?? []).reduce((acc, ex) => {
    acc[ex.category] = acc[ex.category] ?? []
    acc[ex.category].push(ex)
    return acc
  }, {} as Record<string, typeof exercises>)

  return (
    <div className="animate-fade-in">
      <div className="bg-green-800 text-white px-5 py-5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">Baza ćwiczeń</h1>
            <p className="text-green-300 text-sm mt-0.5">{exercises?.length ?? 0} ćwiczeń</p>
          </div>
          <Link
            href="/logopeda/cwiczenia/nowe"
            className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-3 py-2 rounded-xl transition"
          >
            + Dodaj własne
          </Link>
        </div>
      </div>

      {/* Filtry */}
      <div className="px-4 py-3 bg-white border-b border-gray-100 space-y-2">
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={sp.q}
            placeholder="Szukaj ćwiczenia…"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-700 text-white text-sm rounded-xl font-medium"
          >
            Szukaj
          </button>
        </form>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(Object.entries(CATEGORY_LABELS) as [ExerciseCategory, string][]).map(([key, label]) => (
            <Link
              key={key}
              href={`?kategoria=${sp.kategoria === key ? '' : key}`}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition ${
                sp.kategoria === key
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="px-4 py-4 space-y-6">
        {Object.entries(byCategory).map(([category, exs]) => (
          <section key={category}>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
              {CATEGORY_LABELS[category as ExerciseCategory]}
            </h2>
            <div className="space-y-2">
              {exs!.map(ex => (
                <div
                  key={ex.id}
                  className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3"
                >
                  <span className="text-2xl w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    {ex.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{ex.title}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                        ex.difficulty === 'latwe'   ? 'bg-green-100 text-green-700' :
                        ex.difficulty === 'srednie' ? 'bg-amber-100 text-amber-700' :
                                                      'bg-red-100 text-red-700'
                      }`}>
                        {DIFFICULTY_LABELS[ex.difficulty as DifficultyLevel]}
                      </span>
                      {ex.target_sounds && ex.target_sounds.length > 0 && (
                        <span className="text-[10px] text-gray-400">
                          {ex.target_sounds.join(', ')}
                        </span>
                      )}
                      {!ex.is_public && (
                        <span className="text-[10px] text-brand-500">prywatne</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-300 flex-shrink-0">
                    {ex.duration_seconds}s
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}

        {!exercises?.length && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500">Brak wyników dla tych filtrów.</p>
          </div>
        )}
      </div>
    </div>
  )
}
