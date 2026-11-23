import type { Metadata } from 'next'
import TherapistLoginForm from './TherapistLoginForm'

export const metadata: Metadata = { title: 'Logowanie — Panel logopedy' }

export default async function TherapistLoginPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Panel logopedy</h2>
      <p className="text-gray-500 text-sm mb-6">Zaloguj się do panelu terapeuty</p>
      <TherapistLoginForm error={searchParams.error} />
    </div>
  )
}
