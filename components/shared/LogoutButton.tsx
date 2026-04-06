// components/shared/LogoutButton.tsx
interface Props { className?: string; label?: string }

export default function LogoutButton({ className, label = 'Wyloguj się' }: Props) {
  return (
    <form action="/api/auth/logout" method="POST">
      <button type="submit"
        className={className ?? 'w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition active:scale-95'}>
        {label}
      </button>
    </form>
  )
}
