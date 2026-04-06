# 🦜 LogoPed

Aplikacja logopedyczna dla dzieci i terapeutów. PWA (Progressive Web App) działająca na iOS i Android bez potrzeby publikacji w App Store.

## Stack

| Warstwa | Technologia |
|---------|-------------|
| Frontend | Next.js 14 (App Router) |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage) |
| Hosting | Fly.io (region: Warsaw) |
| Styling | Tailwind CSS v3 |
| Animacje | Framer Motion |
| Push | Web Push API (VAPID) |

## Szybki start

### 1. Sklonuj i zainstaluj zależności

```bash
git clone https://github.com/TWOJ_USER/logoped.git
cd logoped
npm install
```

### 2. Skonfiguruj Supabase

1. Utwórz projekt na [supabase.com](https://supabase.com) (region: eu-central-1)
2. W SQL Editor uruchom migracje **w kolejności**:
   ```
   supabase/migrations/001_profiles.sql
   supabase/migrations/002_exercises.sql
   supabase/migrations/003_plans.sql
   supabase/migrations/004_completions_and_stats.sql
   supabase/migrations/005_views.sql
   supabase/migrations/seed.sql
   ```
3. W Storage utwórz buckety:
   ```sql
   INSERT INTO storage.buckets (id, name, public) VALUES
     ('exercise-media', 'exercise-media', true),
     ('recordings', 'recordings', false),
     ('avatars', 'avatars', false);
   ```
4. W Authentication:
   - Włącz Email/Password
   - **Wyłącz** "Confirm email" (dla MVP)
   - Ustaw Site URL: `http://localhost:3000`

### 3. Skonfiguruj zmienne środowiskowe

```bash
cp .env.local.example .env.local
```

Uzupełnij `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://TWOJ_PROJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Generuj: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=BM...
VAPID_PRIVATE_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BM...
VAPID_SUBJECT=mailto:admin@logoped.pl

NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=twoj-tajny-klucz-crona
```

### 4. Utwórz konto admina

W Supabase SQL Editor:
```sql
-- Najpierw zarejestruj się przez aplikację jako zwykły użytkownik,
-- potem zmień rolę na admin:
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'TWOJE_USER_ID';
```

### 5. Uruchom lokalnie

```bash
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000)

---

## Struktura ról

| Rola | Dashboard | Funkcje |
|------|-----------|---------|
| `admin` | `/admin` | Zarządza logopedami i publiczną bazą ćwiczeń |
| `therapist` | `/logopeda` | Zarządza pacjentami, tworzy plany ćwiczeń |
| `patient` | `/pacjent/cwiczenia` | Wykonuje ćwiczenia, zbiera punkty i odznaki |

## Deployment na Fly.io

```bash
# Zainstaluj flyctl
curl -L https://fly.io/install.sh | sh

# Zaloguj się
flyctl auth login

# Uruchom (pierwszy raz)
flyctl launch --name logoped --region waw

# Ustaw zmienne środowiskowe
flyctl secrets set \
  NEXT_PUBLIC_SUPABASE_URL="..." \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="..." \
  SUPABASE_SERVICE_ROLE_KEY="..." \
  VAPID_PUBLIC_KEY="..." \
  VAPID_PRIVATE_KEY="..." \
  NEXT_PUBLIC_VAPID_PUBLIC_KEY="..." \
  VAPID_SUBJECT="mailto:admin@logoped.pl" \
  CRON_SECRET="..." \
  NEXT_PUBLIC_APP_URL="https://logoped.fly.dev"

# Deploy
flyctl deploy
```

### CI/CD

Push na branch `main` → automatyczny deploy przez GitHub Actions.
Wymagany sekret w repo: `FLY_API_TOKEN` (z `flyctl tokens create deploy`).

### Push notifications cron

Skonfiguruj cron na Fly.io lub zewnętrzny serwis (np. cron-job.org):

```bash
# Co minutę sprawdzaj harmonogramy i wysyłaj przypomnienia
curl -X POST https://logoped.fly.dev/api/push/send \
  -H "Authorization: Bearer TWOJ_CRON_SECRET"
```

---

## Gamifikacja

| Akcja | Punkty |
|-------|--------|
| Jedno ćwiczenie | +20 |
| Cała sesja (wszystkie ćwiczenia) | +50 bonus |
| 3 dni z rzędu | +100 |
| 7 dni z rzędu | +200 |
| 30 dni z rzędu | +500 |

**Poziomy:** Maluszek 🐣 → Uczniaczek 📚 → Gadałka 🗣️ → Mistrz Słowa 🏅 → Mistrz Mowy 🏆

---

## Roadmapa

- [x] Migracje Supabase + seed 50 ćwiczeń
- [x] Auth (logowanie, rejestracja, role)
- [x] Panel pacjenta (ćwiczenia, kalendarz, nagrody, papuga)
- [x] Panel logopedy (pacjenci, plany, baza ćwiczeń)
- [x] Panel admina (logopedzi, ćwiczenia)
- [x] Gamifikacja (punkty, serie, odznaki — triggery PostgreSQL)
- [x] PWA manifest + push notifications
- [x] Dockerfile + Fly.io + GitHub Actions
- [ ] Nagrywanie audio/wideo (v2)
- [ ] Weryfikacja nagrań przez logopedę (v2)
- [ ] Google Play Store (TWA wrapper)
- [ ] App Store (Capacitor wrapper)
