<div align="center">

# 🦜 LogoPed

**Aplikacja logopedyczna dla dzieci i terapeutów**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-logoped.fly.dev-7c3aed?style=for-the-badge&logo=rocket)](https://logoped.fly.dev)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Fly.io](https://img.shields.io/badge/Fly.io-Warsaw-8B5CF6?style=for-the-badge)](https://fly.io)

*Duolingo dla logopedii — codzienne ćwiczenia, gamifikacja, śledzenie postępów*

</div>

---

## O projekcie

LogoPed to aplikacja webowa (PWA) wspierająca pracę logopedów i ich małych pacjentów. Dzieci ćwiczą codziennie z pomocą animowanej papugi 🦜, zdobywają punkty i odznaki — tak jak w grze. Logopedzi tworzą spersonalizowane plany ćwiczeń i śledzą postępy pacjentów w czasie rzeczywistym.

### Dla kogo?

| Użytkownik | Co robi w aplikacji |
|------------|---------------------|
| 🏥 **Admin** | Zarządza kontami logopedów, licencjami, bazą ćwiczeń |
| 👩‍⚕️ **Logopeda** | Tworzy plany ćwiczeń, przydziela pacjentom, śledzi postępy |
| 🧒 **Dziecko/Pacjent** | Wykonuje ćwiczenia, zdobywa nagrody, widzi papugę |
| 👨‍👩‍👧 **Rodzic** | Pomaga dziecku, widzi postępy i harmonogram |

---

## Funkcje

### Panel dziecka
- 🎯 **Ćwiczenia na dziś** — lista z dużymi ikonami, gwiazdki postępu
- 🎵 **Dźwięki** — ding przy każdym powtórzeniu, fanfara po sesji
- 🔄 **Powtarzanie** — opcja powtórzenia ukończonego ćwiczenia
- 🏆 **Gamifikacja** — punkty, poziomy, seria dni, odznaki
- 🦜 **Papuga Lolo** — maskotka z pełnym panelem statystyk

### Panel logopedy
- 📋 **Kreator planów** — drag & drop, notatki dla każdego ćwiczenia
- 📊 **Postępy pacjentów** — kalendarz, streak, alerty nieaktywności
- 📚 **Baza ćwiczeń** — 50+ publicznych ćwiczeń + własne
- ⏰ **Harmonogramy** — dni tygodnia, godzina przypomnienia

### Panel admina
- 👥 Zarządzanie logopedami i licencjami
- 📖 Zarządzanie publiczną bazą ćwiczeń
- 📈 Statystyki globalne systemu

---

## Stack technologiczny

```
Frontend        Next.js 14 (App Router) + Tailwind CSS + Framer Motion
Backend         Supabase (PostgreSQL + Auth + Storage + Realtime)
PWA             next-pwa + Web Push API (VAPID)
Hosting         Fly.io (region: Frankfurt)
Testy           Playwright E2E
CI/CD           GitHub Actions → flyctl deploy
Dźwięki         Web Audio API (bez zewnętrznych bibliotek)
```

---

## Demo

🔗 **https://logoped.fly.dev**

Kliknij przycisk **"🦜 Wejdź jako demo"** na stronie logowania — zobaczysz widok dziecka z przykładowymi ćwiczeniami, gamifikacją i papugą Lolo.

---

## Architektura

```
logoped/
├── app/
│   ├── admin/          # Panel admina (RLS: rola admin)
│   ├── logopeda/       # Panel logopedy (RLS: rola therapist)
│   ├── pacjent/        # Panel pacjenta (RLS: rola patient)
│   └── api/            # Route Handlers (auth, push, demo)
├── components/
│   ├── patient/        # ExerciseView, ExerciseList, TodayHeader, PatientNav
│   └── therapist/      # TherapistNav, PlanBuilder
├── lib/
│   ├── demoProgress.ts # localStorage postęp dla demo
│   ├── demoStats.ts    # localStorage fake stats dla demo
│   └── sounds.ts       # Web Audio API
└── supabase/
    └── migrations/     # 001_profiles.sql ... 007_licenses.sql
```

### Row-Level Security

Każda tabela ma włączone RLS. Pacjent widzi tylko swoje dane, logopeda widzi pacjentów których obsługuje, admin widzi wszystko.

---

## Lokalny development

```bash
# Klonuj repo
git clone https://github.com/kapoost/logoped.git
cd logoped

# Zainstaluj zależności
npm install

# Skonfiguruj środowisko
cp .env.example .env.local
# Uzupełnij klucze Supabase i VAPID

# Uruchom lokalnie
npm run dev
```

### Wymagania
- Node.js 20+
- Konto Supabase (free tier wystarczy)
- Konto Fly.io (free tier wystarczy)

---

## Testy

```bash
# Uruchom wszystkie testy E2E
TEST_BASE_URL=https://logoped.fly.dev npx playwright test

# Konkretny projekt
npx playwright test --project=patient
npx playwright test --project=integration
```

**Stan testów:** setup ✅ | public ✅ | integration ✅ | admin ✅ | therapist ✅ | patient ✅ | api ✅ | demo ✅

---

## Roadmapa

- [x] MVP — logopeda przydziela → dziecko ćwiczy → oboje widzą postępy
- [x] Gamifikacja — punkty, serie, poziomy, odznaki, papuga
- [x] PWA — offline, push notifications, instalacja na ekranie głównym
- [x] Demo konto — bez rejestracji
- [ ] Nagrania audio/wideo — pacjent nagrywa, logopeda weryfikuje
- [ ] App Store — Google Play (TWA) + Apple App Store (Capacitor)

---

## Licencja

Projekt prywatny. Wszelkie prawa zastrzeżone.

---

<div align="center">

Zbudowane z ❤️ dla małych logopedów i ich terapeutów

</div>
