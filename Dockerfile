FROM node:20-alpine AS base

# Instalacja zależności
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Wyłącz telemetrię Next.js
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

# Next.js wkleja NEXT_PUBLIC_* do paczki przeglądarki w trakcie buildu, a nie
# przy starcie kontenera — sekrety Fly.io są tu niewidoczne. Przy `flyctl
# deploy` bez --build-arg te zmienne są puste, build przechodzi na zielono,
# a w przeglądarce cicho przestaje działać wszystko, co ich potrzebuje:
# rejestracja i lektor czytający polecenia. Taki obraz ma się nie zbudować.
# Klucz VAPID też tu jest: bez niego PushSetup.tsx dostaje undefined i
# subskrypcja powiadomień wysypuje się w przeglądarce — dokładnie ta sama
# cicha awaria, przed którą ten bezpiecznik ma chronić.
RUN for z in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_VAPID_PUBLIC_KEY; do \
      eval "v=\$$z"; \
      [ -n "$v" ] || { \
        echo "BŁĄD: brak $z w argumentach buildu."; \
        echo "Deployuj przez ./deploy.sh albo dodaj --build-arg do flyctl deploy."; \
        exit 1; }; \
    done

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Pliki standalone Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# sharp obok standalone: bez niego optymalizacja obrazków w trybie standalone
# rzuca "'sharp' is required to be installed in standalone mode" przy KAŻDYM
# żądaniu obrazka — tak było na produkcji od 5.11.2026. Kopiujemy ze stage'a
# deps, bo tam npm ci pobrał binaria pod musl (alpine); śledzenie zależności
# Next.js nie zawsze wciąga natywne paczki @img.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/sharp ./node_modules/sharp
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@img  ./node_modules/@img

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
