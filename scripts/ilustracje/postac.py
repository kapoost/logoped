#!/usr/bin/env python3
"""Generuje arkusze postaci — po jednym na bohatera z obsady.

Arkusz to trzy ujęcia tej samej postaci w jednym kadrze (przód, trzy czwarte,
profil). Służy za źródło tożsamości: dalsze obrazki powstają z niego jako
referencji, zamiast opisywać bohatera słowami przy każdym ćwiczeniu. Pilot
z 20.10.2026 pokazał, że sam opis nie wystarcza — cztery wywołania
"a cheerful green parrot named Lolo" dały cztery różne papugi.

Kandydaci lądują w postacie/kandydaci/. Zaakceptowany arkusz kopiujesz ręcznie
na postacie/<kategoria>.webp — i dopiero stamtąd bierze go generuj.py.

Wymaga FAL_KEY w środowisku.

Przykłady:
  python3 scripts/ilustracje/postac.py --kategoria oddechowe --warianty 3
  python3 scripts/ilustracje/postac.py --wszystkie --warianty 2
"""
import argparse, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from generuj import fal_generuj, CENA_ZA_MPX   # noqa: E402

TUTAJ     = os.path.dirname(os.path.abspath(__file__))
KANDYDACI = os.path.join(TUTAJ, 'postacie', 'kandydaci')

# ── Metryczki ─────────────────────────────────────────────────────────────
# Pełny opis wyglądu, osobno od krótkiej nazwy w OBSADA w build_prompts.py.
# Tu ma być wszystko, co ma się nie zmieniać: barwy, oko, dziób, znaki
# szczególne. Lolo spisany z obrazka "Bańki mydlane" — z czwórki z pilota
# ta papuga wyglądała najbardziej jak maskotka.
METRYCZKI = {
    'oddechowe': (
        "Lolo, a small cheerful parrot: leaf-green body with a lighter yellow-green belly, "
        "a pale cream cheek patch around the eye, one large round white eye with a big black "
        "pupil, a bright orange curved beak, a small two-feather crest on top of the head, "
        "a teal stripe across the wing, a short tail with yellow-green tips, light brown feet"
    ),
    'warg': (
        "Pyszczek, a round friendly piglet: soft dusty-pink body, a slightly darker round snout "
        "with two small nostrils, large round white eyes with black pupils, small folded ears, "
        "rosy cheeks, a short curly tail, pale cream belly"
    ),
    'jezyka': (
        "Reks, a playful puppy: warm chestnut-brown body, a cream muzzle and chest, floppy ears "
        "a shade darker than the body, large round white eyes with black pupils, a small black "
        "nose, a short upright tail"
    ),
    'artykulacyjne': (
        "Rubi, a bright red parrot: scarlet body, a cream cheek patch, one large round white eye "
        "with a big black pupil, a pale yellow curved beak, a small crest, a deep blue stripe "
        "across the wing, a short tail with blue tips, grey feet"
    ),
    'podniebienia': (
        "Misio, a sleepy bear cub: soft milk-brown body, a lighter oatmeal muzzle and belly, "
        "small round ears, half-closed gentle eyes, a small dark nose, stubby paws"
    ),
    'sluchowe': (
        "Uszatek, a big-eared rabbit: dove-grey body, a white belly and inner ears, very long "
        "upright ears, large round white eyes with black pupils, a small pink nose, round cheeks"
    ),
    'polykanie': (
        "Kropelka, a happy water droplet character: a smooth teardrop body in clear sky-blue "
        "with a soft white highlight, large round white eyes with black pupils, a small smiling "
        "mouth, short simple arms, and a short butter-yellow cape"
    ),
    'zuchwa': (
        "Fiki, a cheeky little monkey: golden-brown body, a cream face and belly, round ears on "
        "the sides of the head, large round white eyes with black pupils, raised eyebrows, "
        "a long curling tail"
    ),
}

UJECIA = (
    "character reference sheet: the exact same character shown three times in one row — "
    "front view, three-quarter view, and side profile — standing in a neutral relaxed pose, "
    "arms down, identical colours and markings in all three"
)

# Bez "gentle top-left lighting" i bez "single centered subject" — pierwsze kłóci
# się z płaskim stylem, drugie przy arkuszu nie ma sensu. Reszta jak w STYL.
STYL_ARKUSZA = (
    "flat 2D children's book illustration, soft rounded shapes, warm pastel palette, "
    "thick clean outlines, plain very light cream background, friendly and calm, "
    "no shading gradients"
)


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--kategoria', help='bohater tej kategorii')
    p.add_argument('--wszystkie', action='store_true', help='cała obsada')
    p.add_argument('--warianty', type=int, default=3, help='ilu kandydatów na bohatera')
    p.add_argument('--model', default='fal-ai/flux-2')
    p.add_argument('--kroki', type=int, default=32)
    a = p.parse_args()

    klucz = os.environ.get('FAL_KEY')
    if not klucz:
        sys.exit('Brak FAL_KEY w środowisku.')

    if a.wszystkie:
        kategorie = list(METRYCZKI)
    elif a.kategoria:
        if a.kategoria not in METRYCZKI:
            sys.exit(f'Nie znam kategorii {a.kategoria}. Mam: {", ".join(METRYCZKI)}')
        kategorie = [a.kategoria]
    else:
        sys.exit('Podaj --kategoria albo --wszystkie.')

    # Arkusz jest poziomy, bo mieści trzy ujęcia obok siebie.
    szer, wys = 1536, 768
    mpx = szer * wys / 1_000_000
    ile = len(kategorie) * a.warianty
    print(f'Arkuszy do wygenerowania: {ile} | {szer}×{wys} | '
          f'szacowany koszt ≈ ${ile * mpx * CENA_ZA_MPX:.2f}')

    os.makedirs(KANDYDACI, exist_ok=True)
    for kat in kategorie:
        for n in range(1, a.warianty + 1):
            wpis = {
                'prompt': f'{UJECIA}. {METRYCZKI[kat]}. {STYL_ARKUSZA}',
                # Wariant zmienia tylko seed — prompt zostaje ten sam, żeby
                # różnice brały się z modelu, a nie z innego opisu.
                'seed': 1000 + n,
            }
            sciezka = os.path.join(KANDYDACI, f'{kat}-{n}.webp')
            try:
                bajty = fal_generuj(wpis, model=a.model, rozmiar=(szer, wys),
                                    klucz=klucz, kroki=a.kroki)
                with open(sciezka, 'wb') as f:
                    f.write(bajty)
                print(f'  ✓ {kat}-{n}.webp ({len(bajty) // 1024} kB)')
            except Exception as e:
                print(f'  ✗ {kat}-{n}: {e}', file=sys.stderr)

    print(f'\nKandydaci w {KANDYDACI}')
    print('Zaakceptowany arkusz skopiuj na postacie/<kategoria>.webp')


if __name__ == '__main__':
    main()
