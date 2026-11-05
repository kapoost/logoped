// lib/login.ts
// Jedno miejsce na zamianę loginu pacjenta na wewnętrzny email Supabase.
// Używane przy tworzeniu konta, rejestracji i logowaniu — musi być spójne,
// inaczej dziecko nie zaloguje się na konto założone przez logopedę.

export const LOGIN_DOMAIN = 'logoped.app'

/** Dozwolone znaki w loginie po normalizacji */
const ALLOWED = /^[a-z0-9][a-z0-9._-]{1,}$/

/**
 * "Jaś Kowalski" → "jas.kowalski", "Żaneta" → "zaneta", "Łucja" → "lucja".
 * Email w auth.users musi być poprawny formalnie — polskie znaki i spacje
 * Supabase odrzuca ("Unable to validate email address: invalid format").
 */
export function normalizeLogin(raw: string): string {
  return (raw ?? '')
    .trim()
    .replace(/[ŁłØø]/g, c => (c === 'Ł' || c === 'ł' ? 'l' : 'o'))  // nie rozkładają się w NFD
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // zdejmij diakrytyki (ą -> a, ś -> s, ü -> u)
    .toLowerCase()
    .replace(/\s+/g, '.')                 // spacje → kropka
    .replace(/[^a-z0-9._-]/g, '')         // resztę wyrzuć
    .replace(/[._-]{2,}/g, '.')           // bez powtórzonych separatorów
    .replace(/^[._-]+|[._-]+$/g, '')      // bez separatora na brzegach
}

/** Login (lub pełny email) → email do Supabase Auth */
export function loginToEmail(login: string): string {
  const raw = (login ?? '').trim()
  if (raw.includes('@')) return raw.toLowerCase()
  return `${normalizeLogin(raw)}@${LOGIN_DOMAIN}`
}

/**
 * Walidacja loginu dla formularzy. Zwraca komunikat po polsku albo null.
 * Sprawdzamy wynik normalizacji — to on trafia do bazy.
 */
export function validateLogin(raw: string): string | null {
  const value = (raw ?? '').trim()
  if (!value) return 'Podaj login.'

  if (value.includes('@')) {
    return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)
      ? null
      : 'To nie jest poprawny adres email.'
  }

  const normalized = normalizeLogin(value)
  if (normalized.length < 3) {
    return 'Login musi mieć co najmniej 3 znaki (litery bez polskich znaków, cyfry, kropka, myślnik).'
  }
  if (!ALLOWED.test(normalized)) {
    return 'Login może zawierać tylko litery, cyfry, kropkę, podkreślnik i myślnik.'
  }
  return null
}
