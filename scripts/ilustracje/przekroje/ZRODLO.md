# Przekroje strzałkowe jamy ustnej

Źródło: https://github.com/drammock/phonetics-teaching-assets
Licencja: **CC0 1.0** (domena publiczna — bez atrybucji, użycie komercyjne dozwolone).
Autorzy oryginału: Richard Wright, Dan McCloy (University of Washington).

Pliki w tym katalogu są przerobione: przemalowane na paletę aplikacji i skadrowane
na jamę ustną. Skrypt restylizujący rozpoznaje elementy po geometrii, nie po
kolejności ścieżek — w pliku `s_laminal.svg` kolejność jest odwrotna niż w reszcie.

Mapowanie na ćwiczenia (do weryfikacji przez logopedę):

| plik         | pozycja                              | ćwiczenia |
|--------------|--------------------------------------|-----------|
| neutral      | spoczynek                            | punkt odniesienia |
| t            | czubek na wałku dziąsłowym           | Języczek na górce, Król języczek, Liczenie zębów |
| ɲ            | środek języka do podniebienia        | Kląskający konik, Ssanie cukierka, Zlizywanie chrupki |
| k            | tył języka do podniebienia miękkiego | Kotek K, Gagatek G, Mostki K, Język w głąb |
| θ            | między zębami — wzorzec do korekty   | ostrzeżenie przy połykaniu |
| s_laminal    | szczelina dziąsłowa                  | Głoska S, Głoska C, Syczenie i szumienie |

W repozytorium źródłowym jest 44 pozycji — powyżej wybrane sześć.

## Mapowanie po weryfikacji logopedy (19.10.2026)

Zmienione względem pierwszej wersji — wg `SPEC-pozycje.md`:

| grupa | plik | uzasadnienie |
|---|---|---|
| **pozycja spoczynkowa** | `n` | czubek na wałku + język wyściela podniebienie; `neutral` (język na dnie) był błędny |
| T, D, N | `t` | zwarcie dziąsłowe — bez zmian |
| **S, Z, C, DZ** | `neutral` | czubek nisko za dolnymi siekaczami, język płasko; `s_laminal` miał czubek przy wałku (wzorzec angielski) |
| SZ, Ż, CZ, DŻ | `ʃ_apical`, `ʒ_apical` | warianty apikalne — czubek przy wałku; laminalne odrzucone |
| **R** | `t` + znacznik drgania | `r_retroflex` to retrofleks angielski, nie polskie drżące |
| K, G, H | `k` | tył języka do podniebienia miękkiego — bez zmian |
| P, B, M | `p`, `b`, `m` | język bierny na dnie — bez zmian |
| F, W | `f`, `v` | bez zmian |
| Y | `ɪ` | bez zmian |

Czego przekrój strzałkowy nie pokaże i wymaga osobnego widoku czołowego:
rynienka na środku języka (S, SZ), przyleganie boków do zębów trzonowych,
układ warg („ryjek" przy szumiących, uśmiech przy S).

## Co zostało dodane do plików źródłowych

Pliki w tym katalogu to wersja po uwagach logopedy (19.10.2026), nie surowe CC0:

1. **Dno jamy ustnej** — maska SVG odcina dolną część różowej masy, bo w oryginale
   język, żuchwa i broda są jedną ciągłą ścieżką bez krawędzi między nimi.
   Linia dna jest wspólna dla wszystkich pozycji: pomiar konturu w dwóch różnych
   układach wykazał, że dolna krawędź nie rusza się (różnice rzędu 0,3 jednostki),
   więc wystarczy narysować ją raz.
2. **Wcięcie podjęzykowe** — druga maska, nakładana tylko tam, gdzie czubek jest
   uniesiony; przy języku leżącym na dnie żadnej przestrzeni pod nim nie ma.
3. **czolowy-s-rynienka.svg, czolowy-sz-rynienka.svg** — rysunki własne, nie z CC0.
   Przekrój czołowy jest jedynym sposobem pokazania rynienki na środku języka
   i przylegania boków do trzonowców; na przekroju strzałkowym tnie się dokładnie
   wzdłuż rynienki, więc jej nie widać.
