import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = { title: 'Logowanie' }

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Witaj z powrotem!</h2>
      <p className="text-gray-500 text-sm mb-6">Zaloguj się do swojego konta</p>
      <LoginForm error={searchParams.error} />
      <p className="text-center text-sm text-gray-500 mt-6">
        Nie masz konta?{' '}
        <a href="/register" className="text-brand-600 font-medium hover:underline">
          Zarejestruj się
        </a>
      </p>
    </div>
  )
}
