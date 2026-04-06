#!/usr/bin/env bash
# =============================================================
# deploy.sh — LogoPed full deployment script
# Uruchom: chmod +x deploy.sh && ./deploy.sh
# =============================================================
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
ask()   { echo -e "${YELLOW}[?]${NC} $1"; read -r REPLY; echo "$REPLY"; }

echo ""
echo "🦜 LogoPed — Deployment Setup"
echo "================================"
echo ""

# ── 1. Sprawdź wymagania ─────────────────────────────────────
info "Sprawdzam wymagania..."
command -v node  >/dev/null 2>&1 || error "Node.js nie jest zainstalowany (wymagany v20+)"
command -v npm   >/dev/null 2>&1 || error "npm nie jest zainstalowany"
command -v git   >/dev/null 2>&1 || error "git nie jest zainstalowany"

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
[ "$NODE_VER" -ge 20 ] || error "Wymagany Node.js v20+, masz v${NODE_VER}"
info "Node.js $(node -v) OK"

# ── 2. Zainstaluj zależności ─────────────────────────────────
info "Instaluję zależności npm..."
npm install --silent

# ── 3. Wygeneruj klucze VAPID jeśli ich nie ma ──────────────
if [ ! -f ".env.local" ]; then
  warn ".env.local nie istnieje — tworzę z szablonu"
  cp .env.local.example .env.local
fi

if ! grep -q "^VAPID_PUBLIC_KEY=B" .env.local 2>/dev/null; then
  info "Generuję klucze VAPID..."
  VAPID_OUTPUT=$(npx web-push generate-vapid-keys --json 2>/dev/null)
  VAPID_PUB=$(echo "$VAPID_OUTPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).publicKey))")
  VAPID_PRIV=$(echo "$VAPID_OUTPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).privateKey))")
  sed -i.bak "s|VAPID_PUBLIC_KEY=.*|VAPID_PUBLIC_KEY=${VAPID_PUB}|" .env.local
  sed -i.bak "s|VAPID_PRIVATE_KEY=.*|VAPID_PRIVATE_KEY=${VAPID_PRIV}|" .env.local
  sed -i.bak "s|NEXT_PUBLIC_VAPID_PUBLIC_KEY=.*|NEXT_PUBLIC_VAPID_PUBLIC_KEY=${VAPID_PUB}|" .env.local
  rm -f .env.local.bak
  info "Klucze VAPID wygenerowane i zapisane do .env.local"
fi

# ── 4. Sprawdź czy Supabase jest skonfigurowany ──────────────
echo ""
warn "Czy uzupełniłeś NEXT_PUBLIC_SUPABASE_URL i NEXT_PUBLIC_SUPABASE_ANON_KEY w .env.local? [t/n]"
read -r SUPABASE_OK
if [[ "$SUPABASE_OK" != "t" ]]; then
  warn "Otwórz .env.local i uzupełnij klucze Supabase, potem uruchom skrypt ponownie."
  warn "Klucze znajdziesz w: Project Settings > API w panelu Supabase"
  exit 0
fi

# ── 5. Weryfikacja zmiennych środowiskowych ──────────────────
info "Weryfikuję zmienne środowiskowe..."
source .env.local 2>/dev/null || true
[ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ] || error "Brakuje NEXT_PUBLIC_SUPABASE_URL"
[ -n "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ] || error "Brakuje NEXT_PUBLIC_SUPABASE_ANON_KEY"
[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ] || error "Brakuje SUPABASE_SERVICE_ROLE_KEY"
[ -n "${VAPID_PUBLIC_KEY:-}" ] || error "Brakuje VAPID_PUBLIC_KEY"
info "Zmienne środowiskowe OK"

# ── 6. Build produkcyjny (test) ──────────────────────────────
info "Próbny build Next.js..."
npm run build 2>&1 | tail -20

# ── 7. Fly.io ────────────────────────────────────────────────
echo ""
warn "Czy chcesz teraz wdrożyć na Fly.io? [t/n]"
read -r FLY_OK
if [[ "$FLY_OK" == "t" ]]; then
  command -v flyctl >/dev/null 2>&1 || {
    info "Instaluję flyctl..."
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
  }

  info "Logowanie do Fly.io..."
  flyctl auth whoami 2>/dev/null || flyctl auth login

  APP_NAME=$(grep "^app = " fly.toml | cut -d'"' -f2)
  info "Tworzę aplikację: ${APP_NAME}"
  flyctl apps create "$APP_NAME" --org personal 2>/dev/null || warn "Aplikacja już istnieje"

  info "Ustawiam sekrety na Fly.io..."
  flyctl secrets set \
    NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
    VAPID_PUBLIC_KEY="$VAPID_PUBLIC_KEY" \
    VAPID_PRIVATE_KEY="$VAPID_PRIVATE_KEY" \
    NEXT_PUBLIC_VAPID_PUBLIC_KEY="$VAPID_PUBLIC_KEY" \
    VAPID_SUBJECT="mailto:admin@logoped.pl" \
    NEXT_PUBLIC_APP_URL="https://${APP_NAME}.fly.dev" \
    CRON_SECRET="$(openssl rand -hex 32)" \
    --app "$APP_NAME"

  info "Deploy na Fly.io..."
  flyctl deploy --app "$APP_NAME" --wait-timeout 120

  APP_URL="https://${APP_NAME}.fly.dev"
  info "Aplikacja dostępna pod: ${APP_URL}"
fi

echo ""
echo "🎉 Gotowe!"
echo ""
echo "Następne kroki:"
echo "  1. Uruchom migracje Supabase (SQL Editor):"
echo "     supabase/migrations/001_profiles.sql"
echo "     supabase/migrations/002_exercises.sql"
echo "     supabase/migrations/003_plans.sql"
echo "     supabase/migrations/004_completions_and_stats.sql"
echo "     supabase/migrations/005_views.sql"
echo "     supabase/migrations/006_storage.sql"
echo "     supabase/migrations/seed.sql"
echo ""
echo "  2. Utwórz konto admin w Supabase SQL Editor:"
echo "     UPDATE public.profiles SET role='admin'"
echo "     WHERE id='<TWOJE_USER_ID>';"
echo ""
