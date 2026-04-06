// components/patient/EmptyState.tsx
export default function EmptyState() {
  return (
    <div className="text-center py-16 px-6">
      <div className="text-6xl mb-4 animate-wiggle inline-block">🦜</div>
      <h2 className="text-lg font-bold text-gray-700 mb-2">Brak ćwiczeń na dziś</h2>
      <p className="text-sm text-gray-500 leading-relaxed">
        Twój logopeda jeszcze nie przypisał Ci planu ćwiczeń.
        <br />
        Papuga czeka na Ciebie — wróć tu niebawem!
      </p>
    </div>
  )
}
