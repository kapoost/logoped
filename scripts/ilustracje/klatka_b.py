#!/usr/bin/env python3
"""Generuje drugą klatkę ćwiczenia — przeciwne położenie tego samego ruchu.

Aplikacja przenika między klatką A (media_url) a B, więc dziecko widzi RUCH,
a nie zastygłą pozę. Kosztuje jak obrazek (~$0.012), nie jak film.

Używa modelu instrukcyjnego (nano-banana-pro/edit), a NIE tego od klatek A.
Powód zmierzony: flux-2 z referencjami trzyma styl, ale nie tożsamość przy
zmianie pozy — Reks wyszedł raz jako bezkształtna bryła, raz jako inny pies,
Lolo jako brązowa kaczka. Przy klatkach A ten dryf był niewidoczny, bo każda
ilustracja to inna scena. Przy przenikaniu dwóch klatek TEGO SAMEGO ćwiczenia
jest widoczny maksymalnie: wygląda jak zamiana psa w innego psa.

Model instrukcyjny dostaje klatkę A i polecenie w formie "zachowaj wszystko,
zmień WYŁĄCZNIE to jedno". Sprawdzone: postać zostaje co do kreski, rusza się
sam język.

Plik B leży obok A pod tą samą nazwą z sufiksem -b. Aplikacja sprawdza go
sama i przy 404 pokazuje nieruchomą klatkę A — nie ma kolumny w bazie i nie
ma stanu do pilnowania.

Domyślnie NIC nie trafia do bucketu. Klatki lądują w wygenerowane/<kat>/
<id>-b.webp do obejrzenia; dopiero --wgraj je wysyła. Tak samo jak przy
klatkach A i z tego samego powodu: niezweryfikowany układ ust uczy dziecko
błędu, więc każdą klatkę ogląda logopeda.

Wymaga FAL_KEY (oraz zmiennych Supabase przy --wgraj).

Przykłady:
  python3 scripts/ilustracje/klatka_b.py --lista
  python3 scripts/ilustracje/klatka_b.py --id a69dd8b0-7692-4a62-b72e-45f52a79e23c
  python3 scripts/ilustracje/klatka_b.py --wszystkie --wgraj
"""
import argparse, base64, json, os, sys, time

TUTAJ = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TUTAJ)
from generuj import http, BUCKET  # noqa: E402

MODEL_EDYCYJNY = 'fal-ai/nano-banana-pro/edit'

MANIFEST_KLATEK = os.path.join(TUTAJ, 'klatki.json')
MANIFEST_PROMPT = os.path.join(TUTAJ, 'prompts.json')
WYJSCIE         = os.path.join(TUTAJ, 'wygenerowane')


def srodowisko():
    plik = os.path.join(os.path.dirname(os.path.dirname(TUTAJ)), '.env.local')
    if os.path.exists(plik):
        with open(plik, encoding='utf-8') as f:
            for linia in f:
                linia = linia.strip()
                if linia and not linia.startswith('#') and '=' in linia:
                    k, v = linia.split('=', 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"\''))
    return (os.environ.get('FAL_KEY'),
            os.environ.get('NEXT_PUBLIC_SUPABASE_URL'),
            os.environ.get('SUPABASE_SERVICE_ROLE_KEY'))


def klatka_a(wpis):
    """Ścieżka do klatki A na dysku — ona jest referencją dla B."""
    return os.path.join(WYJSCIE, wpis['plik'])


def data_uri(sciezka):
    with open(sciezka, 'rb') as f:
        return 'data:image/webp;base64,' + base64.b64encode(f.read()).decode()


def fal_edytuj(prompt, referencja_uri, *, model, klucz, rozdzielczosc='1K'):
    """Jedno wywołanie modelu instrukcyjnego. Zwraca bajty obrazka."""
    naglowki = {'Authorization': f'Key {klucz}', 'Content-Type': 'application/json'}
    wejscie = {
        'prompt': prompt,
        'image_urls': [referencja_uri],
        'num_images': 1,
        'output_format': 'webp',
        'aspect_ratio': '1:1',
        'resolution': rozdzielczosc,
    }
    zgloszenie = http(f'https://queue.fal.run/{model}', naglowki=naglowki,
                      dane=json.dumps(wejscie).encode(), metoda='POST')

    koniec = time.monotonic() + 300
    while time.monotonic() < koniec:
        stan = http(zgloszenie['status_url'], naglowki=naglowki)
        if stan.get('status') == 'COMPLETED':
            break
        if stan.get('status') not in ('IN_QUEUE', 'IN_PROGRESS'):
            raise RuntimeError(f'nieoczekiwany status: {stan}')
        time.sleep(2)
    else:
        raise RuntimeError('fal nie odpowiedział w 300 s')

    wynik = http(zgloszenie['response_url'], naglowki=naglowki)
    obrazki = wynik.get('images') or []
    if not obrazki:
        raise RuntimeError(f'brak obrazka w odpowiedzi: {str(wynik)[:300]}')
    return http(obrazki[0]['url'], naglowki={}, surowe=True)


def prompt_b(faza_b):
    """Polecenie edycji. Kształt zdania ma znaczenie — zmierzone.

    "Zachowaj wszystko" przed "zmień wyłącznie to jedno" i na końcu jeszcze
    raz "reszta ma zostać identyczna". Bez tej klamry model dorysowuje sobie
    swobody: przy pierwszym podejściu wydłużył język zamiast przenieść go na
    drugą stronę. Kierunek trzeba podawać wprost (LEFT/RIGHT), bo "mirroring
    the pose" model odczytuje jako "podobnie, ale inaczej".
    """
    return ("Keep this exact illustration unchanged — same character, same colours, same "
            "markings, same outlines, same body pose, same framing, same background, same "
            f"art style. {faza_b} "
            "Everything else must stay pixel-identical.")


def wgraj_klatke(sciezka_w_buckecie, bajty, *, url, klucz):
    """Sam plik — bez dotykania media_url, bo to nadal wskazuje klatkę A."""
    naglowki = {'apikey': klucz, 'Authorization': f'Bearer {klucz}',
                'Content-Type': 'image/webp', 'x-upsert': 'true',
                'Cache-Control': 'public, max-age=31536000, immutable'}
    http(f'{url}/storage/v1/object/{BUCKET}/{sciezka_w_buckecie}',
         naglowki=naglowki, dane=bajty, metoda='POST')
    return f'{url}/storage/v1/object/public/{BUCKET}/{sciezka_w_buckecie}'


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--id', action='append', default=[], help='konkretne ćwiczenie')
    p.add_argument('--wszystkie', action='store_true', help='wszystko z klatki.json')
    p.add_argument('--lista', action='store_true', help='pokaż, co jest w manifeście, i wyjdź')
    p.add_argument('--wgraj', action='store_true', help='wyślij do bucketu')
    p.add_argument('--nadpisz', action='store_true', help='generuj też to, co ma już plik')
    p.add_argument('--model', default=MODEL_EDYCYJNY)
    p.add_argument('--rozdzielczosc', default='1K', choices=['1K', '2K'])
    p.add_argument('--tak', action='store_true', help='nie pytaj o koszt')
    a = p.parse_args()

    klatki  = json.load(open(MANIFEST_KLATEK, encoding='utf-8'))['cwiczenia']
    manifest = json.load(open(MANIFEST_PROMPT, encoding='utf-8'))
    wpisy   = {w['id']: w for w in manifest['cwiczenia']}

    if a.lista:
        for i, k in klatki.items():
            w = wpisy.get(i)
            jest = os.path.exists(klatka_a(w)) if w else False
            print(f"  {k['tytul']:24} klatka A {'jest' if jest else 'BRAK'}  {i}")
            print(f"      faza B: {k['faza_b'][:88]}")
        return

    wybrane = a.id or (list(klatki) if a.wszystkie else [])
    if not wybrane:
        sys.exit('Podaj --id albo --wszystkie (albo --lista, żeby zobaczyć manifest).')

    fal_key, sb_url, sb_key = srodowisko()
    if not fal_key:
        sys.exit('Brak FAL_KEY.')
    if a.wgraj and not (sb_url and sb_key):
        sys.exit('Brak zmiennych Supabase, a podano --wgraj.')

    zadania = []
    for i in wybrane:
        k = klatki.get(i)
        w = wpisy.get(i)
        if not k or not w:
            print(f'  ✗ {i} — brak w manifeście'); continue
        zrodlo = klatka_a(w)
        if not os.path.exists(zrodlo):
            print(f"  ✗ {k['tytul']} — brak klatki A w {zrodlo}"); continue
        plik_b = zrodlo.replace('.webp', '-b.webp')
        if os.path.exists(plik_b) and not a.nadpisz:
            print(f"  · {k['tytul']} — klatka B już jest, pomijam"); continue
        zadania.append({'id': i, 'tytul': k['tytul'], 'faza_b': k['faza_b'],
                        'wpis': w, 'zrodlo': zrodlo, 'plik_b': plik_b,
                        'w_buckecie': w['plik'].replace('.webp', '-b.webp')})

    if not zadania:
        print('Nic do zrobienia.'); return

    # Cennika nano-banana-pro fal nie podaje w dokumentacji — licznik
    # zużycia jest w panelu fal.ai, warto zerknąć po pierwszej partii.
    print(f'{len(zadania)} klatek B · model {a.model}')
    if not a.tak and input('Generuję? [t/N] ').strip().lower() not in ('t', 'tak', 'y'):
        return

    for z in zadania:
        try:
            bajty = fal_edytuj(prompt_b(z['faza_b']), data_uri(z['zrodlo']),
                               model=a.model, klucz=fal_key,
                               rozdzielczosc=a.rozdzielczosc)
            with open(z['plik_b'], 'wb') as f:
                f.write(bajty)
            gdzie = z['plik_b']
            if a.wgraj:
                gdzie = wgraj_klatke(z['w_buckecie'], bajty, url=sb_url, klucz=sb_key)
            print(f"  ✓ {z['tytul']:24} → {gdzie}")
        except Exception as e:
            print(f"  ✗ {z['tytul']:24} {e}")

    if not a.wgraj:
        print(f'\nObejrzyj klatki w {WYJSCIE}, potem --wgraj.')


if __name__ == '__main__':
    main()
