#!/usr/bin/env python3
"""Nagrywa polecenia ćwiczeń głosem lektora przez fal.ai (ElevenLabs).

Jeden plik na jeden krok ćwiczenia. Domyślnie NIC nie trafia do bucketu —
nagrania lądują w scripts/lektor/wygenerowane/<exercise_id>/<n>-<hash>.mp3
do odsłuchania. Dopiero `--wgraj` wysyła je do bucketu exercise-media pod
lektor/, skąd bierze je aplikacja.

Nazwa pliku zawiera skrót treści kroku (ta sama funkcja co w lib/lektor.ts).
Dzięki temu nie ma kolumny w bazie i nie ma stanu do pilnowania: zmieniona
instrukcja daje inny skrót, stary plik przestaje pasować, aplikacja dostaje
404 i czyta syntezatorem — zamiast odtwarzać dziecku nieaktualne polecenie.

Notatek logopedy ten skrypt nie dotyka. Są pisane per pacjent, więc nie da
się ich wygenerować z góry — w aplikacji czyta je syntezator przeglądarki.

Wymaga FAL_KEY oraz NEXT_PUBLIC_SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY
(czytane też z .env.local).

Przykłady:
  python3 scripts/lektor/generuj.py --probka            # jedno zdanie w kilku głosach
  python3 scripts/lektor/generuj.py --limit 3           # trzy ćwiczenia do odsłuchu
  python3 scripts/lektor/generuj.py --kategoria artykulacyjne --wgraj
"""
import argparse, concurrent.futures as cf, json, os, re, sys, time
import urllib.error, urllib.parse, urllib.request

TUTAJ   = os.path.dirname(os.path.abspath(__file__))
KORZEN  = os.path.dirname(os.path.dirname(TUTAJ))
WYJSCIE = os.path.join(TUTAJ, 'wygenerowane')
BUCKET  = 'exercise-media'
KATALOG = 'lektor'

# $0.05 za 1000 znaków (fal, turbo-v2.5, cennik z 05.11.2026)
CENA_ZA_1000_ZNAKOW = 0.05
DOMYSLNY_MODEL = 'fal-ai/elevenlabs/tts/turbo-v2.5'
DOMYSLNY_GLOS  = 'Matilda'

# Głosy do odsłuchu w trybie --probka. Wszystkie są wielojęzyczne, więc
# polski wychodzi im poprawnie; różnią się ciepłem i tempem.
GLOSY_PROBNE = ['Matilda', 'Alice', 'Lily', 'Charlotte', 'Jessica']

ZDANIE_PROBNE = ('Czubek języka schowaj za dolnymi zębami i wydaj długi syk: ssssss. '
                 'Świetnie ci idzie!')


def http(url, *, naglowki, dane=None, metoda=None, timeout=180, surowe=False):
    req = urllib.request.Request(url, data=dane, method=metoda)
    for k, v in naglowki.items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            tresc = r.read()
            return tresc if surowe else json.loads(tresc.decode() or '{}')
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'{metoda or "GET"} {url.split("?")[0]} → {e.code}: '
                           f'{e.read().decode()[:400]}') from None


# ── Skrót treści ──────────────────────────────────────────────────────────
def hash_tekstu(tekst):
    """FNV-1a 32-bit → base36, siedem znaków.

    Musi dawać ten sam wynik co hashTekstu() w lib/lektor.ts, inaczej
    aplikacja szuka pliku pod inną nazwą. Stąd iteracja po jednostkach
    UTF-16 — JS liczy charCodeAt, nie punkty kodowe.
    """
    norm = re.sub(r'\s+', ' ', tekst.strip())
    h = 0x811c9dc5
    for i in range(0, len(norm.encode('utf-16-le')), 2):
        jednostka = int.from_bytes(norm.encode('utf-16-le')[i:i + 2], 'little')
        h ^= jednostka
        h = (h * 0x01000193) & 0xFFFFFFFF
    cyfry = '0123456789abcdefghijklmnopqrstuvwxyz'
    s = ''
    n = h
    while n:
        s = cyfry[n % 36] + s
        n //= 36
    return (s or '0').rjust(7, '0')[-7:]


def kroki_z_instrukcji(instrukcje):
    """Musi dzielić identycznie jak KrokiCwiczenia.tsx, bo numer kroku jest
    częścią nazwy pliku. Najpierw zdejmujemy prefiks "N.", dopiero potem
    odrzucamy puste — odwrotna kolejność zostawiłaby linię będącą samym
    numerem jako pusty krok i przesunęła indeksy wszystkich następnych."""
    kroki = (re.sub(r'^\d+\.\s*', '', w).strip() for w in (instrukcje or '').split('\n'))
    return [k for k in kroki if k]


# ── fal ───────────────────────────────────────────────────────────────────
def fal_mow(tekst, *, model, glos, klucz, tempo):
    naglowki = {'Authorization': f'Key {klucz}', 'Content-Type': 'application/json'}
    wejscie = {
        'text': tekst,
        'voice': glos,
        'language_code': 'pl',       # wymuszone — bez tego model zgaduje po tekście
        'speed': tempo,
        'stability': 0.45,           # trochę życia w głosie, ale bez przesady
        'similarity_boost': 0.8,
        'style': 0.25,
    }
    zgloszenie = http(f'https://queue.fal.run/{model}', naglowki=naglowki,
                      dane=json.dumps(wejscie).encode(), metoda='POST')

    koniec = time.monotonic() + 180
    while time.monotonic() < koniec:
        stan = http(zgloszenie['status_url'], naglowki=naglowki)
        if stan.get('status') == 'COMPLETED':
            break
        if stan.get('status') not in ('IN_QUEUE', 'IN_PROGRESS'):
            raise RuntimeError(f'nieoczekiwany status: {stan}')
        time.sleep(1.5)
    else:
        raise RuntimeError('fal nie odpowiedział w 180 s')

    wynik = http(zgloszenie['response_url'], naglowki=naglowki)
    url = (wynik.get('audio') or {}).get('url')
    if not url:
        raise RuntimeError(f'brak audio w odpowiedzi: {str(wynik)[:300]}')
    return http(url, naglowki={}, surowe=True)


# ── Supabase ──────────────────────────────────────────────────────────────
def srodowisko():
    """Zmienne z otoczenia, a czego brakuje — z .env.local."""
    plik = os.path.join(KORZEN, '.env.local')
    if os.path.exists(plik):
        with open(plik, encoding='utf-8') as f:
            for linia in f:
                linia = linia.strip()
                if not linia or linia.startswith('#') or '=' not in linia:
                    continue
                k, v = linia.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"\''))
    return (os.environ.get('FAL_KEY'),
            os.environ.get('NEXT_PUBLIC_SUPABASE_URL'),
            os.environ.get('SUPABASE_SERVICE_ROLE_KEY'))


def cwiczenia(url, klucz, *, kategoria=None, ids=None):
    naglowki = {'apikey': klucz, 'Authorization': f'Bearer {klucz}'}
    zapytanie = 'select=id,title,instructions,category&archived_at=is.null&order=category'
    if kategoria:
        zapytanie += f'&category=eq.{urllib.parse.quote(kategoria)}'
    if ids:
        zapytanie += f'&id=in.({",".join(ids)})'
    dane = http(f'{url}/rest/v1/exercises?{zapytanie}', naglowki=naglowki)
    return dane if isinstance(dane, list) else []


def wgraj(sciezka_w_buckecie, bajty, *, url, klucz):
    naglowki = {'apikey': klucz, 'Authorization': f'Bearer {klucz}',
                'Content-Type': 'audio/mpeg', 'x-upsert': 'true',
                'Cache-Control': 'public, max-age=31536000, immutable'}
    http(f'{url}/storage/v1/object/{BUCKET}/{sciezka_w_buckecie}',
         naglowki=naglowki, dane=bajty, metoda='POST')
    return f'{url}/storage/v1/object/public/{BUCKET}/{sciezka_w_buckecie}'


# ── Przebieg ──────────────────────────────────────────────────────────────
def zadania(lista, *, nadpisz):
    """Płaska lista (ćwiczenie, numer kroku, tekst, ścieżka) do nagrania."""
    out = []
    for cw in lista:
        for i, tekst in enumerate(kroki_z_instrukcji(cw.get('instructions'))):
            nazwa = f'{i}-{hash_tekstu(tekst)}.mp3'
            sciezka = os.path.join(WYJSCIE, cw['id'], nazwa)
            if os.path.exists(sciezka) and not nadpisz:
                continue
            out.append({'cwiczenie': cw, 'krok': i, 'tekst': tekst,
                        'plik': sciezka, 'w_buckecie': f'{KATALOG}/{cw["id"]}/{nazwa}'})
    return out


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--kategoria', help='tylko ta kategoria')
    p.add_argument('--id', action='append', default=[], help='konkretne ćwiczenie (można wielokrotnie)')
    p.add_argument('--limit', type=int, help='najwyżej tyle ćwiczeń')
    p.add_argument('--glos', default=DOMYSLNY_GLOS)
    p.add_argument('--tempo', type=float, default=0.95, help='0.7–1.2; wolniej = dziecko nadąża')
    p.add_argument('--model', default=DOMYSLNY_MODEL)
    p.add_argument('--probka', action='store_true',
                   help='nagraj jedno zdanie w kilku głosach i wyjdź (do wyboru lektora)')
    p.add_argument('--wgraj', action='store_true', help='wyślij nagrania do bucketu')
    p.add_argument('--tylko-wgraj', action='store_true',
                   help='nie nagrywaj nic nowego — wyślij to, co leży w wygenerowane/')
    p.add_argument('--nadpisz', action='store_true', help='nagraj też to, co ma już plik')
    p.add_argument('--rownolegle', type=int, default=4)
    p.add_argument('--tak', action='store_true', help='nie pytaj o potwierdzenie kosztu')
    a = p.parse_args()

    fal_key, sb_url, sb_key = srodowisko()
    if not fal_key:
        sys.exit('Brak FAL_KEY w środowisku.')

    # ── próbka głosów ────────────────────────────────────────────────────
    if a.probka:
        katalog = os.path.join(WYJSCIE, '_probki')
        os.makedirs(katalog, exist_ok=True)
        koszt = len(ZDANIE_PROBNE) * len(GLOSY_PROBNE) / 1000 * CENA_ZA_1000_ZNAKOW
        print(f'Próbka: {len(GLOSY_PROBNE)} głosów × {len(ZDANIE_PROBNE)} znaków ≈ ${koszt:.3f}')
        for glos in GLOSY_PROBNE:
            try:
                bajty = fal_mow(ZDANIE_PROBNE, model=a.model, glos=glos,
                                klucz=fal_key, tempo=a.tempo)
                sciezka = os.path.join(katalog, f'{glos}.mp3')
                with open(sciezka, 'wb') as f:
                    f.write(bajty)
                print(f'  ✓ {glos:12} → {sciezka}')
            except Exception as e:
                print(f'  ✗ {glos:12} {e}')
        return

    if not sb_url or not sb_key:
        sys.exit('Brak NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.')

    lista = cwiczenia(sb_url, sb_key, kategoria=a.kategoria, ids=a.id or None)
    if a.limit:
        lista = lista[:a.limit]
    if not lista:
        sys.exit('Nic nie pasuje do filtrów.')

    # ── tylko wysyłka tego, co już nagrane ───────────────────────────────
    if a.tylko_wgraj:
        wyslane = 0
        for cw in lista:
            for i, tekst in enumerate(kroki_z_instrukcji(cw.get('instructions'))):
                nazwa = f'{i}-{hash_tekstu(tekst)}.mp3'
                sciezka = os.path.join(WYJSCIE, cw['id'], nazwa)
                if not os.path.exists(sciezka):
                    continue
                with open(sciezka, 'rb') as f:
                    wgraj(f'{KATALOG}/{cw["id"]}/{nazwa}', f.read(), url=sb_url, klucz=sb_key)
                wyslane += 1
        print(f'Wysłano {wyslane} nagrań.')
        return

    praca = zadania(lista, nadpisz=a.nadpisz)
    if not praca:
        print('Wszystko już nagrane. --nadpisz, żeby nagrać ponownie.')
        return

    znakow = sum(len(z['tekst']) for z in praca)
    koszt = znakow / 1000 * CENA_ZA_1000_ZNAKOW
    print(f'{len(praca)} kroków z {len(lista)} ćwiczeń · {znakow} znaków · '
          f'głos {a.glos} · ≈ ${koszt:.2f}')
    if not a.tak:
        if input('Nagrywam? [t/N] ').strip().lower() not in ('t', 'tak', 'y'):
            return

    def nagraj(z):
        bajty = fal_mow(z['tekst'], model=a.model, glos=a.glos,
                        klucz=fal_key, tempo=a.tempo)
        os.makedirs(os.path.dirname(z['plik']), exist_ok=True)
        with open(z['plik'], 'wb') as f:
            f.write(bajty)
        if a.wgraj:
            wgraj(z['w_buckecie'], bajty, url=sb_url, klucz=sb_key)
        return z

    udane, bledy = 0, []
    with cf.ThreadPoolExecutor(max_workers=a.rownolegle) as pula:
        for przyszlosc in cf.as_completed([pula.submit(nagraj, z) for z in praca]):
            try:
                z = przyszlosc.result()
                udane += 1
                print(f'  ✓ {z["cwiczenie"]["title"][:34]:34} krok {z["krok"] + 1}')
            except Exception as e:
                bledy.append(str(e))
                print(f'  ✗ {e}')

    print(f'\nNagrane: {udane}/{len(praca)}'
          + (f' · błędów: {len(bledy)}' if bledy else '')
          + ('' if a.wgraj else f'\nPliki w {WYJSCIE} — odsłuchaj, potem --tylko-wgraj.'))


if __name__ == '__main__':
    main()
