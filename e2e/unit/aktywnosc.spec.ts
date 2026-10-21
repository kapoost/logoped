import { test, expect } from '@playwright/test'
import { policzAktywnosc, PROG_PRZERWY_DNI, OKNO_REGULARNOSCI_DNI, type DzienKalendarza }
  from '../../lib/aktywnosc'

// Czysta arytmetyka dat — nie potrzebuje przeglądarki ani serwera.
// Trafia tu, bo progi w lib/aktywnosc.ts są decyzją kliniczną i ktoś je
// kiedyś zmieni; wtedy te przypadki powiedzą, co dokładnie się przesunęło.

const DZIS = new Date('2026-10-21T12:00:00Z')
const d = (iso: string, done = 1): DzienKalendarza =>
  ({ session_date: iso, exercises_done: done, plan_exercise_total: 3, completion_rate: 1 })

test.describe('policzAktywnosc', () => {
  test('dni od ostatniego ćwiczenia liczone od daty, nie od godziny', () => {
    expect(policzAktywnosc([d('2026-10-21')], DZIS).dniOdOstatniego).toBe(0)
    expect(policzAktywnosc([d('2026-10-20')], DZIS).dniOdOstatniego).toBe(1)
  })

  test('próg przerwy jest domknięty od dołu', () => {
    const tuzPrzed = new Date(DZIS)
    tuzPrzed.setUTCDate(tuzPrzed.getUTCDate() - (PROG_PRZERWY_DNI - 1))
    const naProgu = new Date(DZIS)
    naProgu.setUTCDate(naProgu.getUTCDate() - PROG_PRZERWY_DNI)
    const iso = (x: Date) => x.toISOString().slice(0, 10)

    expect(policzAktywnosc([d(iso(tuzPrzed))], DZIS).przerwa).toBe(false)
    expect(policzAktywnosc([d(iso(naProgu))], DZIS).przerwa).toBe(true)
  })

  test('brak jakiejkolwiek sesji to też przerwa', () => {
    const a = policzAktywnosc([], DZIS)
    expect(a.dniOdOstatniego).toBeNull()
    expect(a.przerwa).toBe(true)
  })

  test('dzień bez wykonanych ćwiczeń nie liczy się jako sesja', () => {
    // Wiersz w kalendarzu istnieje, bo plan był zaplanowany, ale dziecko
    // nie zrobiło nic — to nie jest aktywność.
    const a = policzAktywnosc([d('2026-10-21', 0)], DZIS)
    expect(a.dniOdOstatniego).toBeNull()
    expect(a.przerwa).toBe(true)
  })

  test('regularność: pełne okno to 100%', () => {
    const dni = Array.from({ length: OKNO_REGULARNOSCI_DNI }, (_, i) => {
      const x = new Date(DZIS); x.setUTCDate(x.getUTCDate() - i)
      return d(x.toISOString().slice(0, 10))
    })
    expect(policzAktywnosc(dni, DZIS).regularnosc).toBe(100)
  })

  test('regularność: dzień spoza okna nie wpada do licznika', () => {
    const poza = new Date(DZIS)
    poza.setUTCDate(poza.getUTCDate() - OKNO_REGULARNOSCI_DNI)
    const a = policzAktywnosc([d(poza.toISOString().slice(0, 10))], DZIS)
    expect(a.regularnosc).toBe(0)
    expect(a.cwiczebnychDni).toBe(0)
  })

  test('regularność: ostatni dzień okna jeszcze się liczy', () => {
    const brzeg = new Date(DZIS)
    brzeg.setUTCDate(brzeg.getUTCDate() - (OKNO_REGULARNOSCI_DNI - 1))
    expect(policzAktywnosc([d(brzeg.toISOString().slice(0, 10))], DZIS).cwiczebnychDni).toBe(1)
  })
})
