import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = { title: 'Logowanie' }

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Cześć!</h2>
      <p className="text-gray-500 text-sm mb-6">Zaloguj się do swoich ćwiczeń</p>
      <LoginForm error={searchParams.error} />
    </div>
  )
}
