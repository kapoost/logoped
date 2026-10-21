/**
 * Wskaźniki aktywności pacjenta liczone z kalendarza ćwiczeń.
 *
 * Progi są tu, w jednym miejscu, bo są DECYZJĄ KLINICZNĄ, nie techniczną.
 * Próg przerwy jest potwierdzony. Okno regularności nadal jest założeniem
 * roboczym — nie było osobno zatwierdzone. Każda zmiana to jedna liczba.
 */

/** Po ilu dniach bez ćwiczeń pokazujemy ostrzeżenie. Potwierdzone 21.10.2026. */
export const PROG_PRZERWY_DNI = 4

/** Ile ostatnich dni bierzemy do wskaźnika regularności. Nadal robocze: 7. */
export const OKNO_REGULARNOSCI_DNI = 7

export interface DzienKalendarza {
  session_date: string
  exercises_done: number
  plan_exercise_total: number
  completion_rate: number
}

export interface Aktywnosc {
  /** Dni z ćwiczeniami w oknie / długość okna, 0–100. */
  regularnosc: number
  cwiczebnychDni: number
  oknoDni: number
  /** Dni od ostatniego ćwiczenia; null = nigdy nie ćwiczył. */
  dniOdOstatniego: number | null
  przerwa: boolean
  ostatniDzien: string | null
}

/**
 * Liczy wskaźniki względem `dzisiaj` (wstrzykiwane, żeby dało się to
 * sensownie przetestować i żeby serwer nie zależał od strefy przeglądarki).
 */
export function policzAktywnosc(
  dni: DzienKalendarza[],
  dzisiaj: Date = new Date(),
): Aktywnosc {
  const zCwiczeniami = dni
    .filter(d => d.exercises_done > 0)
    .map(d => d.session_date)
    .sort()

  const doba = 24 * 60 * 60 * 1000
  const dzis = Date.UTC(dzisiaj.getUTCFullYear(), dzisiaj.getUTCMonth(), dzisiaj.getUTCDate())

  const wOknie = zCwiczeniami.filter(d => {
    const t = Date.parse(d + 'T00:00:00Z')
    const roznica = Math.round((dzis - t) / doba)
    return roznica >= 0 && roznica < OKNO_REGULARNOSCI_DNI
  })

  const ostatni = zCwiczeniami.length ? zCwiczeniami[zCwiczeniami.length - 1] : null
  const dniOdOstatniego = ostatni
    ? Math.round((dzis - Date.parse(ostatni + 'T00:00:00Z')) / doba)
    : null

  return {
    regularnosc: Math.round((wOknie.length / OKNO_REGULARNOSCI_DNI) * 100),
    cwiczebnychDni: wOknie.length,
    oknoDni: OKNO_REGULARNOSCI_DNI,
    dniOdOstatniego,
    // Pacjent, który nigdy nie ćwiczył, też wymaga uwagi logopedy.
    przerwa: dniOdOstatniego === null || dniOdOstatniego >= PROG_PRZERWY_DNI,
    ostatniDzien: ostatni,
  }
}
