// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 flex items-center justify-center p-4">
      {/* Dekoracyjne kółka tła */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-white/5 rounded-full" />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3 inline-block animate-wiggle">🦜</div>
          <h1 className="text-3xl font-bold text-white">LogoPed</h1>
          <p className="text-brand-200 text-sm mt-1">Ćwiczenia logopedyczne dla dzieci</p>
        </div>

        {/* Karta formularza */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
