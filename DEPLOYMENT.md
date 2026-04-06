# 🚀 LogoPed — Jak wdrożyć online

## Wymagania

- Node.js v20+
- Konto [Supabase](https://supabase.com) (bezpłatny plan wystarczy)
- Konto [Fly.io](https://fly.io) (bezpłatny plan wystarczy)
- Konto [GitHub](https://github.com) (opcjonalnie, dla CI/CD)

---

## Krok 1 — Supabase: utwórz projekt

1. Wejdź na [supabase.com](https://supabase.com) → **New project**
2. Nazwa: `logoped`, region: **Frankfurt (eu-central-1)**
3. Zanotuj **Project URL** i **anon key** z Settings > API

### Uruchom migracje

W panelu Supabase → **SQL Editor** → **New query**, wklej i uruchom pliki **po kolei**:

```
001_profiles.sql          ← profile użytkowników + RLS
002_exercises.sql         ← baza ćwiczeń
003_plans.sql             ← plany i harmonogramy
004_completions_and_stats.sql  ← wykonania + gamifikacja + triggery
005_views.sql             ← widoki pomocnicze
006_storage.sql           ← buckety plików
seed.sql                  ← 50+ ćwiczeń publicznych
```

### Konfiguracja Auth

Settings > Authentication:
- ✅ Email/Password — włączone
- ☐ Confirm email — **wyłączone** (MVP)
- Site URL: `https://TWOJA_APLIKACJA.fly.dev`
- Redirect URLs: `https://TWOJA_APLIKACJA.fly.dev/api/auth/callback`

---

## Krok 2 — Zmienne środowiskowe

```bash
cp .env.local.example .env.local
```

Uzupełnij `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Wygeneruj: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=BM...
VAPID_PRIVATE_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BM...    # to samo co VAPID_PUBLIC_KEY
VAPID_SUBJECT=mailto:admin@logoped.pl

NEXT_PUBLIC_APP_URL=https://logoped.fly.dev
CRON_SECRET=losowy-tajny-klucz-32-znaki
```

**Szybkie generowanie VAPID:**
```bash
npx web-push generate-vapid-keys
```

---

## Krok 3 — Fly.io: deployment

```bash
# Zainstaluj flyctl
curl -L https://fly.io/install.sh | sh

# Zaloguj się
flyctl auth login

# Zainicjuj aplikację (tylko raz)
flyctl launch --name logoped --region waw --no-deploy

# Ustaw wszystkie sekrety jedną komendą
flyctl secrets set \
  NEXT_PUBLIC_SUPABASE_URL="https://XXXX.supabase.co" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..." \
  SUPABASE_SERVICE_ROLE_KEY="eyJ..." \
  VAPID_PUBLIC_KEY="BM..." \
  VAPID_PRIVATE_KEY="..." \
  NEXT_PUBLIC_VAPID_PUBLIC_KEY="BM..." \
  VAPID_SUBJECT="mailto:admin@logoped.pl" \
  NEXT_PUBLIC_APP_URL="https://logoped.fly.dev" \
  CRON_SECRET="$(openssl rand -hex 32)"

# Deploy
flyctl deploy
```

Aplikacja będzie dostępna pod: `https://logoped.fly.dev`

---

## Krok 4 — Utwórz konto admina

1. Zarejestruj się normalnie przez aplikację
2. W Supabase SQL Editor:

```sql
-- Znajdź swoje user ID
SELECT id, email FROM auth.users;

-- Ustaw rolę admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'TWOJE_USER_ID';
```

---

## Krok 5 — GitHub Actions (CI/CD)

```bash
# Utwórz repo
git init
git add .
git commit -m "feat: initial LogoPed setup"
git remote add origin https://github.com/TWOJ_USER/logoped.git
git push -u origin main
```

W GitHub → Settings → Secrets → **New repository secret**:
```
FLY_API_TOKEN = <wynik: flyctl tokens create deploy>
```

Teraz każdy push na `main` → automatyczny deploy ✅

---

## Krok 6 — Push notifications cron

Skonfiguruj zewnętrzny cron (np. [cron-job.org](https://cron-job.org) — bezpłatny):

```
URL:    POST https://logoped.fly.dev/api/push/send
Header: Authorization: Bearer TWOJ_CRON_SECRET
Cron:   */5 * * * *   (co 5 minut)
```

---

## Weryfikacja po deployment

Sprawdź te URL-e:

| URL | Oczekiwany wynik |
|-----|-----------------|
| `https://logoped.fly.dev/api/health` | `{"status":"ok"}` |
| `https://logoped.fly.dev/login` | Ekran logowania |
| `https://logoped.fly.dev/admin` | Panel admina (po zalogowaniu) |

---

## Troubleshooting

**Build się nie udaje:**
```bash
npm run build 2>&1 | grep "Error"
```

**Supabase RLS blokuje zapytania:**
```sql
-- Sprawdź polityki na tabeli
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

**Fly.io logi:**
```bash
flyctl logs --app logoped
```

**Sprawdź czy migracje poszły:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
-- Powinno być: achievements, exercise_completions, exercise_plans,
--              exercises, patient_stats, plan_exercises, profiles,
--              push_subscriptions, schedules, therapist_patients
```
