/**
 * Mapowanie głosek na przekroje jamy ustnej.
 *
 * Rysunki pochodzą z phonetics-teaching-assets (CC0, UW) i zostały przerobione
 * pod paletę aplikacji — szczegóły w scripts/ilustracje/przekroje/ZRODLO.md.
 * Mapowanie jest tam samo opisane i zweryfikowane przez logopedę 19.10.2026;
 * tutaj jest tylko przełożone na kod.
 *
 * STATUS jest częścią danych, nie komentarzem. Logopeda zaakceptował 22 pozycje,
 * ale są to głównie pozycje spoza polskiego zasobu (języczkowe, gardłowe,
 * samogłoski, kląskanie). Żadna z pozycji potrzebnych tym ćwiczeniom nie ma
 * jeszcze akceptacji: część czeka po naniesieniu uwag, część nie była oceniana.
 * Dlatego widok pacjenta pokazuje wyłącznie pozycje zaakceptowane — patrz
 * components/shared/PrzekrojJamyUstnej.tsx.
 */

export type StatusPrzekroju = 'zaakceptowany' | 'czeka' | 'nieoceniony'

export interface Przekroj {
  /** Plik w public/przekroje/ */
  plik: string
  /** Krótka nazwa pozycji — nagłówek nad rysunkiem */
  nazwa: string
  /** Co widać; pisane dla logopedy, nie dla dziecka */
  opis: string
  status: StatusPrzekroju
  /** Znane ograniczenie konkretnego rysunku */
  zastrzezenie?: string
}

/**
 * Głoska → pozycja. Klucze małymi literami, tak jak w kolumnie target_sounds.
 * Kilka głosek dzieli jeden rysunek — to nie pomyłka, tylko fakt fonetyczny:
 * S i Z różnią się dźwięcznością, a nie układem języka.
 */
const PRZEKROJE: Record<string, Przekroj> = {
  s:  { plik: 'neutral.svg', nazwa: 'Szczelina zębowa (S, Z, C, DZ)',
        opis: 'Czubek języka nisko, za dolnymi siekaczami, język płasko. Wąska szczelina między zębami.',
        status: 'czeka' },
  sz: { plik: 'sz-apical.svg', nazwa: 'Wałek dziąsłowy, bezdźwięczne (SZ, CZ)',
        opis: 'Czubek języka uniesiony do wałka dziąsłowego, wargi lekko zaokrąglone.',
        status: 'czeka' },
  zh: { plik: 'zh-apical.svg', nazwa: 'Wałek dziąsłowy, dźwięczne (Ż, DŻ)',
        opis: 'Układ jak przy SZ, z dodaną fonacją — krtań wibruje.',
        status: 'czeka' },
  r:  { plik: 't.svg', nazwa: 'Czubek na wałku — wyjście do R',
        opis: 'Pozycja wyjściowa polskiego R: czubek języka przy wałku dziąsłowym.',
        status: 'czeka',
        zastrzezenie: 'Brakuje znacznika drgania — bez niego rysunek pokazuje zwarcie, nie głoskę drżącą.' },
  k:  { plik: 'k.svg', nazwa: 'Tylnojęzykowe (K, G, H)',
        opis: 'Tył języka unosi się do podniebienia miękkiego, przód leży spokojnie.',
        status: 'nieoceniony' },
  f:  { plik: 'f.svg', nazwa: 'Wargowo-zębowe bezdźwięczne (F)',
        opis: 'Górne siekacze opierają się na dolnej wardze, język bierny.',
        status: 'nieoceniony' },
  w:  { plik: 'v.svg', nazwa: 'Wargowo-zębowe dźwięczne (W)',
        opis: 'Układ jak przy F, z fonacją.',
        status: 'nieoceniony' },
  t:  { plik: 't.svg', nazwa: 'Zwarcie dziąsłowe (T, D, N)',
        opis: 'Czubek języka zwiera się z wałkiem dziąsłowym.',
        status: 'nieoceniony' },
  y:  { plik: 'y.svg', nazwa: 'Samogłoska Y',
        opis: 'Język uniesiony średnio wysoko, ku przodowi.',
        status: 'nieoceniony' },
}

/** Głoski dzielące rysunek z inną głoską — rozwiązywane przed szukaniem w mapie. */
const ALIASY: Record<string, string> = {
  z: 's', c: 's', dz: 's',   // ten sam układ co S
  cz: 'sz',                   // bezdźwięczne szumiące
  ż: 'zh', 'dż': 'zh',       // dźwięczne szumiące
  g: 'k', h: 'k',            // tylnojęzykowe
  d: 't', n: 't',            // zwarcie dziąsłowe
}

/**
 * Przekroje dla ćwiczenia, po jego target_sounds.
 *
 * Zwraca więcej niż jeden rysunek, gdy ćwiczenie dotyczy różnych układów —
 * przy „Sylaby z S–SZ" pokazanie tylko jednego przeczyłoby sensowi ćwiczenia,
 * bo ono polega właśnie na różnicy między nimi. Maksymalnie dwa, żeby nie
 * rozsypać układu; przy większej liczbie wygrywają pierwsze w target_sounds.
 *
 * Zwraca pustą tablicę, gdy ćwiczenie nie ma przypisanych głosek — tak jest
 * dziś dla 97 ze 127 ćwiczeń w bazie.
 */
export function przekrojeDlaGlosek(gloski: string[] | null | undefined): Przekroj[] {
  if (!gloski?.length) return []

  const wynik: Przekroj[] = []
  for (const surowa of gloski) {
    const g = surowa.trim().toLowerCase()
    const klucz = ALIASY[g] ?? g
    const p = PRZEKROJE[klucz]
    if (p && !wynik.some(w => w.plik === p.plik)) wynik.push(p)
    if (wynik.length === 2) break
  }
  return wynik
}
