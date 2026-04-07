// app/(auth)/register/page.tsx
import type { Metadata } from 'next'
import RegisterForm from './RegisterForm'

export const metadata: Metadata = { title: 'Rejestracja' }
export const dynamic = 'force-dynamic'  // nie generuj statycznie — używa Supabase client

export default function RegisterPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Utwórz konto</h2>
      <p className="text-gray-500 text-sm mb-6">Dołącz do LogoPed</p>
      <RegisterForm />
      <p className="text-center text-sm text-gray-500 mt-6">
        Masz już konto?{' '}
        <a href="/login" className="text-brand-600 font-medium hover:underline">
          Zaloguj się
        </a>
      </p>
    </div>
  )
}
