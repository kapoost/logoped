// app/admin/cwiczenia/[id]/edytuj/page.tsx
import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { getSessionUser, createAdminClient } from '@/lib/supabase/server'
import ExerciseForm from '@/app/logopeda/cwiczenia/nowe/ExerciseForm'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Admin — Edycja ćwiczenia' }
export const revalidate = 0

export default async function AdminEdytujCwiczeniePage({ params }: { params: { id: string } }) {
  const session = await getSessionUser()
  if (!session || session.profile.role !== 'admin') redirect('/')

  const admin = createAdminClient()
  const { data: exercise } = await admin
    .from('exercises')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!exercise) notFound()

  const isPrivate = exercise.created_by !== null

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href={`/admin/cwiczenia/${params.id}`} className="text-gray-400 hover:text-gray-600 transition text-sm">
          ← Podgląd
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edytuj ćwiczenie</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isPrivate
            ? 'Ćwiczenie prywatne logopedy — zmiany zobaczą jego pacjenci.'
            : 'Ćwiczenie z publicznej bazy — zmiany zobaczą wszyscy logopedzi.'}
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <ExerciseForm therapistId={session.profile.id} isAdmin={true} exercise={exercise} />
      </div>
    </div>
  )
}
