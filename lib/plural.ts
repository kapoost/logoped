// lib/plural.ts
// Polska liczba mnoga ma trzy formy, nie dwie:
//   1 plan · 2–4 plany · 5+ planów
// z wyjątkiem nastek (12, 13, 14 → planów) i końcówek x2–x4 (22 → plany).

export function plural(n: number, one: string, few: string, many: string): string {
  const abs  = Math.abs(n)
  const last = abs % 10
  const tens = abs % 100

  if (abs === 1) return one
  if (last >= 2 && last <= 4 && (tens < 12 || tens > 14)) return few
  return many
}

/** "3 plany", "5 planów", "1 plan" */
export function plany(n: number): string {
  return `${n} ${plural(n, 'plan', 'plany', 'planów')}`
}

/** "3 pacjentów" w dopełniaczu — używane w nawiasach po liczbie planów */
export function pacjenci(n: number): string {
  return `${n} ${plural(n, 'pacjent', 'pacjentów', 'pacjentów')}`
}
