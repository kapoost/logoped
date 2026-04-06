// app/logopeda/cwiczenia/nowe/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/supabase/server'
import NewExerciseForm from './NewExerciseForm'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Nowe ćwiczenie' }

export default async function NoweCwiczeniePage() {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  return (
    <div className="animate-fade-in">
      <div className="bg-green-800 text-white px-5 pt-5 pb-8">
        <Link href="/logopeda/cwiczenia" className="text-green-300 text-sm hover:text-white inline-block mb-3">
          ← Ćwiczenia
        </Link>
        <h1 className="text-xl font-bold">Nowe ćwiczenie</h1>
        <p className="text-green-300 text-sm mt-1">
          Dodaj własne ćwiczenie do swojej biblioteki
        </p>
      </div>
      <div className="px-4 -mt-4 pb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <NewExerciseForm therapistId={session.profile.id} />
        </div>
      </div>
    </div>
  )
}
