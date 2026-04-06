# LogoPed — Migracje Supabase

## Kolejność uruchamiania

```
supabase/migrations/
├── 001_profiles.sql           # Profile użytkowników + RLS + trigger auto-tworzenia profilu
├── 002_exercises.sql          # Baza ćwiczeń + typy enum + RLS
├── 003_plans.sql              # Plany ćwiczeń + harmonogramy + RLS
├── 004_completions_and_stats.sql  # Wykonania + gamifikacja + triggery punktów/odznak
├── 005_views.sql              # Widoki i funkcje pomocnicze dla frontendu
└── seed.sql                   # 50+ ćwiczeń publicznych (uruchom po migracjach)
```

## Sposób uruchomienia

### Opcja A — Supabase CLI (zalecane)

```bash
# Zainstaluj CLI
npm install -g supabase

# Zaloguj się
supabase login

# Zainicjuj projekt (jeśli nowy)
supabase init

# Linkuj z projektem na supabase.com
supabase link --project-ref <TWÓJ_PROJECT_REF>

# Uruchom migracje
supabase db push

# Seed danych (ćwiczenia)
supabase db execute --file supabase/migrations/seed.sql
```

### Opcja B — SQL Editor w panelu Supabase

1. Otwórz projekt na supabase.com
2. Przejdź do **SQL Editor**
3. Wklej i uruchom pliki w kolejności: 001 → 002 → 003 → 004 → 005 → seed

## Zmienne środowiskowe (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://TWÓJ_PROJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # tylko server-side!
VAPID_PUBLIC_KEY=BM...             # npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BM... # to samo co VAPID_PUBLIC_KEY
```

## Konfiguracja Auth w panelu Supabase

1. **Authentication → Providers → Email** — włącz, wyłącz "Confirm email" dla MVP
2. **Authentication → URL Configuration**:
   - Site URL: `https://logoped.fly.dev`
   - Redirect URLs: `https://logoped.fly.dev/auth/callback`

## Buckets w Supabase Storage

```sql
-- Uruchom w SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('exercise-media', 'exercise-media', true),   -- obrazki/gify ćwiczeń (publiczne)
  ('recordings',     'recordings',     false),  -- nagrania pacjentów (prywatne, v2)
  ('avatars',        'avatars',        false);  -- avatary użytkowników (prywatne)
```

## Struktura ról

| Rola       | Opis                                              |
|------------|---------------------------------------------------|
| `admin`    | Zarządza całym systemem i bazą ćwiczeń            |
| `therapist`| Zarządza swoimi pacjentami, tworzy plany          |
| `patient`  | Wykonuje ćwiczenia, zbiera punkty                 |

Rola ustawiana jest w `raw_user_meta_data` przy rejestracji:

```typescript
// Przykład rejestracji logopedy
await supabase.auth.signUp({
  email: 'logopeda@example.com',
  password: '...',
  options: {
    data: {
      role: 'therapist',
      full_name: 'Anna Kowalska',
    }
  }
})
```

## Trigger — automatyczne tworzenie profilu

Po każdej rejestracji w `auth.users` trigger `trg_on_auth_user_created`
automatycznie tworzy rekord w `public.profiles` z rolą z `raw_user_meta_data`.

## Gamifikacja — system punktów

| Akcja                         | Punkty    |
|-------------------------------|-----------|
| Ukończenie jednego ćwiczenia  | +20       |
| Ukończenie całej sesji        | +50 bonus |
| Seria 3 dni z rzędu           | +100      |
| Seria 7 dni z rzędu           | +200      |
| Seria 30 dni z rzędu          | +500      |

Poziomy: **Maluszek** (0) → **Uczniaczek** (500) → **Gadałka** (1500)
→ **Mistrz Słowa** (4000) → **Mistrz Mowy** (10000)
