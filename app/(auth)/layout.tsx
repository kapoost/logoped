// app/(auth)/layout.tsx
// Oprawa zależy od tego, kto wchodzi — patrz components/shared/AuthChrome.tsx.
import AuthChrome from '@/components/shared/AuthChrome'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthChrome>{children}</AuthChrome>
}
