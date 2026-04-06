// app/admin/cwiczenia/nowe/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/supabase/server'
import NewExerciseForm from '@/app/logopeda/cwiczenia/nowe/NewExerciseForm'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Admin — Nowe ćwiczenie' }

export default async function AdminNoweCwiczeniePage() {
  const session = await getSessionUser()
  if (!session || session.profile.role !== 'admin') redirect('/')

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/admin/cwiczenia" className="text-gray-400 hover:text-gray-600 transition text-sm">
          ← Ćwiczenia
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dodaj publiczne ćwiczenie</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ćwiczenie trafi do publicznej bazy dostępnej dla wszystkich logopedów.
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <NewExerciseForm therapistId={session.profile.id} isAdmin={true} />
      </div>
    </div>
  )
}
