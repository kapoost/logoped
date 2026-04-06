// app/admin/logopedzi/dodaj/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import AddTherapistForm from './AddTherapistForm'

export const metadata: Metadata = { title: 'Dodaj logopedę' }

export default function DodajLogopedePage() {
  return (
    <div className="max-w-md space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/admin/logopedzi" className="text-gray-400 hover:text-gray-600 transition text-sm">
          ← Logopedzi
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dodaj logopedę</h1>
        <p className="text-gray-500 text-sm mt-1">Utwórz konto dla nowego specjalisty</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <AddTherapistForm />
      </div>
    </div>
  )
}
