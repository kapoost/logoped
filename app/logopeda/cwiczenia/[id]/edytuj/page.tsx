// app/logopeda/cwiczenia/[id]/edytuj/page.tsx
import { redirect, notFound } from 'next/navigation'
import { getSessionUser, createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import ExerciseForm from '../../nowe/ExerciseForm'

export const metadata: Metadata = { title: 'Edycja ćwiczenia' }
export const revalidate = 0

export default async function EdytujCwiczeniePage({ params }: { params: { id: string } }) {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = createClient()
  const { data: ex } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!ex) notFound()

  // Cudzego nie edytujemy — z podglądu można je sklonować
  if (ex.created_by !== session.user.id) redirect(`/logopeda/cwiczenia/${params.id}`)

  return (
    <div className="animate-fade-in pb-8">
      <div className="bg-green-800 text-white px-5 py-5">
        <Link href={`/logopeda/cwiczenia/${params.id}`} className="text-green-300 hover:text-white text-sm transition">
          ← Podgląd
        </Link>
        <h1 className="text-xl font-bold mt-2">Edytuj ćwiczenie</h1>
        <p className="text-green-300 text-sm mt-0.5">Twoje ćwiczenie — zmiany zobaczą pacjenci z planów, w których jest użyte.</p>
      </div>
      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <ExerciseForm therapistId={session.profile.id} exercise={ex} />
        </div>
      </div>
    </div>
  )
}
