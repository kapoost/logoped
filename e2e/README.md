# Testy

## Lokalnie

```bash
TEST_BASE_URL=http://localhost:3000 npx playwright test --project=patient
```

Playwright **sam podnosi serwer** (`webServer` w `playwright.config.ts`), gdy
`TEST_BASE_URL` wskazuje na localhost. Nie uruchamiaj serwera ręcznie obok —
`next dev` przebudowuje `.next` i wyrwie katalog spod każdego innego procesu,
który z niego czyta.

Konto demo (`demo@logoped.app`) jest zaseedowane i logowanie przez „Wejdź jako
demo" działa lokalnie, więc większość ścieżek pacjenta da się sprawdzić bez
wdrażania czegokolwiek.

### Pułapka: `npm run start` nie działa w tym projekcie

`next.config.js` ma `output: 'standalone'` (pod obraz Dockera na Fly), a
`next start` tego nie obsługuje. Serwer **wystartuje i powie „Ready"**, po czym
każde żądanie skończy się błędem 500 z `Cannot find module
.next/server/pages/_error.js`. Ostrzeżenie o tym leci w logu, ale łatwo je
przeoczyć i wziąć ten stan za zepsutą aplikację albo zepsute logowanie.

Do ręcznego obejrzenia buildu produkcyjnego:

```bash
rm -rf .next && npm run build      # standalone nie powstaje w buildzie przyrostowym
cp -R .next/static .next/standalone/.next/static
cp -R public       .next/standalone/public
node .next/standalone/server.js
```

## Przeciw produkcji

```bash
npx playwright test --project=patient     # TEST_BASE_URL z .env.test
```

`--project=setup` nadpisuje `e2e/.auth/*.json`. Po przebiegu lokalnym te pliki
zawierają ciasteczka localhosta, więc przed testami przeciw produkcji trzeba
puścić `setup` jeszcze raz — inaczej logowanie „przejdzie", ale testy zobaczą
niezalogowaną aplikację.

## Projekty

| projekt | co sprawdza | wymaga |
|---|---|---|
| `unit` | czysta logika (`lib/aktywnosc.ts`) | nic |
| `public` | strony bez logowania | serwer |
| `demo` | ścieżka „Wejdź jako demo" | serwer + konto demo |
| `setup` | loguje i zapisuje sesje | serwer + `.env.test` |
| `patient` / `therapist` / `admin` | ścieżki ról | `setup` |
