// app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser()
  if (!session) redirect('/login')
  if (session.profile.role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white px-6 py-4 flex items-center gap-4">
        <span className="text-xl">🦜</span>
        <span className="font-bold text-lg">LogoPed Admin</span>
        <nav className="flex gap-4 ml-6 text-sm">
          <Link href="/admin"           className="text-gray-300 hover:text-white transition">Dashboard</Link>
          <Link href="/admin/logopedzi" className="text-gray-300 hover:text-white transition">Logopedzi</Link>
          <Link href="/admin/cwiczenia" className="text-gray-300 hover:text-white transition">Ćwiczenia</Link>
        </nav>
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-400">
          <span>{session.profile.full_name}</span>
          <form action="/api/auth/logout" method="POST">
            <button type="submit"
              className="text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 px-3 py-1 rounded transition">
              Wyloguj
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
