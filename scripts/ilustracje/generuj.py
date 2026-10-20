#!/usr/bin/env python3
"""Generuje ilustracje ćwiczeń przez fal.ai i opcjonalnie wgrywa je do Supabase.

Domyślnie NIC nie dotyka bazy ani bucketu — obrazki lądują w
scripts/ilustracje/wygenerowane/<kategoria>/<id>.webp do obejrzenia.
Dopiero `--wgraj` wysyła zaakceptowane pliki do bucketu exercise-media
i ustawia media_url. Taki podział, bo każdy obrazek ogląda logopeda,
a odkręcanie 127 wpisów w bazie jest droższe niż ponowna generacja.

Generowane są tylko ćwiczenia z gotową sceną (`do_przegladu: false`).
Pozycje bez ręcznie napisanej sceny są pomijane — ich prompt jest po polsku
i opisuje cel zamiast tego, co widać.

Wymaga FAL_KEY w środowisku (plus zmienne Supabase przy --wgraj).

Przykłady:
  python3 scripts/ilustracje/generuj.py --kategoria oddechowe --limit 4
  python3 scripts/ilustracje/generuj.py --kategoria oddechowe
  python3 scripts/ilustracje/generuj.py --kategoria oddechowe --wgraj
"""
import argparse, base64, concurrent.futures as cf, json, os, sys, time, urllib.error, urllib.request

TUTAJ    = os.path.dirname(os.path.abspath(__file__))
MANIFEST = os.path.join(TUTAJ, 'prompts.json')
WYJSCIE  = os.path.join(TUTAJ, 'wygenerowane')
POSTACIE = os.path.join(TUTAJ, 'postacie')
BUCKET   = 'exercise-media'

# $0.012 za megapiksel (FLUX.2 [dev], cennik fal z 20.10.2026). 1024² ≈ 1 Mpx.
CENA_ZA_MPX = 0.012
DOMYSLNY_MODEL = 'fal-ai/flux-2'


def http(url, *, naglowki, dane=None, metoda=None, timeout=120, surowe=False):
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


# ── fal ───────────────────────────────────────────────────────────────────
def fal_generuj(wpis, *, model, rozmiar, klucz, kroki, referencje=None):
    """Kolejkuje zadanie i czeka na wynik. Zwraca bajty obrazka.

    `rozmiar` to bok kwadratu albo para (szerokość, wysokość).
    `referencje` to lista URL-i albo data URI — podane, przełączają wywołanie
    na wariant edycyjny modelu, który bierze tożsamość postaci z pikseli.

    Pole `negative` z manifestu NIE jest wysyłane: schemat FLUX.2 na fal nie ma
    negative_prompt (sprawdzone 20.10.2026 — jedenaście pól, tego wśród nich
    nie ma). Zostaje w manifeście, bo opisuje intencję i przyda się, gdyby
    silnik się zmienił, ale dziś czystość wyniku zawdzięczamy samemu modelowi.
    """
    szer, wys = rozmiar if isinstance(rozmiar, (tuple, list)) else (rozmiar, rozmiar)
    naglowki = {'Authorization': f'Key {klucz}', 'Content-Type': 'application/json'}
    wejscie = {
        'prompt': wpis['prompt'],
        'image_size': {'width': szer, 'height': wys},
        'num_images': 1,
        'seed': wpis['seed'],
        'output_format': 'webp',
        'num_inference_steps': kroki,
        # Prompt jest już precyzyjny i ten sam styl ma obowiązywać wszędzie;
        # rozszerzanie przez model rozjechałoby spójność między obrazkami.
        'enable_prompt_expansion': False,
    }
    if referencje:
        wejscie['image_urls'] = referencje[:4]   # model bierze najwyżej cztery

    zgloszenie = http(f'https://queue.fal.run/{model}', naglowki=naglowki,
                      dane=json.dumps(wejscie).encode(), metoda='POST')

    status_url, wynik_url = zgloszenie['status_url'], zgloszenie['response_url']
    koniec = time.monotonic() + 300
    while time.monotonic() < koniec:
        stan = http(status_url, naglowki=naglowki)
        if stan.get('status') == 'COMPLETED':
            break
        if stan.get('status') not in ('IN_QUEUE', 'IN_PROGRESS'):
            raise RuntimeError(f'nieoczekiwany status: {stan}')
        time.sleep(2)
    else:
        raise RuntimeError('fal nie odpowiedział w 300 s')

    wynik = http(wynik_url, naglowki=naglowki)
    obrazki = wynik.get('images') or []
    if not obrazki:
        raise RuntimeError(f'brak obrazka w odpowiedzi: {str(wynik)[:300]}')
    if any(wynik.get('has_nsfw_concepts') or []):
        raise RuntimeError('obrazek oznaczony przez filtr treści — pomijam')
    return http(obrazki[0]['url'], naglowki={}, surowe=True)


def referencja(kategoria):
    """Zwraca data URI zaakceptowanego arkusza postaci albo None.

    Arkusz leży w postacie/<kategoria>.webp i trafia tam ręcznie, po obejrzeniu
    kandydatów z postac.py. Jego brak nie jest błędem — wtedy tożsamość niesie
    sam opis w promptcie, tak jak w pilocie z 20.10.2026.
    """
    sciezka = os.path.join(POSTACIE, f'{kategoria}.webp')
    if not os.path.exists(sciezka):
        return None
    with open(sciezka, 'rb') as f:
        return 'data:image/webp;base64,' + base64.b64encode(f.read()).decode()


def prompt_z_referencja(wpis, obsada, styl):
    """Prompt dla wariantu edycyjnego: scena plus nakaz trzymania się wzoru.

    Opis wyglądu celowo wypada — tożsamość ma iść z pikseli arkusza, a nie
    z przymiotników, bo to właśnie przymiotniki dały cztery różne papugi.
    """
    bohater = obsada.get(wpis['kategoria'], 'the character')
    return (f"{bohater} {wpis['ruch']}. "
            f"Keep the character exactly as in the reference sheet — same colours, "
            f"same markings, same proportions, same face. Draw one single character "
            f"in a new pose, not a reference sheet. {styl}")


# ── Supabase ──────────────────────────────────────────────────────────────
def wgraj(wpis, bajty, *, url, klucz):
    naglowki = {'apikey': klucz, 'Authorization': f'Bearer {klucz}',
                'Content-Type': 'image/webp', 'x-upsert': 'true',
                'Cache-Control': 'public, max-age=31536000, immutable'}
    http(f'{url}/storage/v1/object/{BUCKET}/{wpis["plik"]}',
         naglowki=naglowki, dane=bajty, metoda='POST')

    publiczny = f'{url}/storage/v1/object/public/{BUCKET}/{wpis["plik"]}'
    http(f'{url}/rest/v1/exercises?id=eq.{wpis["id"]}',
         naglowki={'apikey': klucz, 'Authorization': f'Bearer {klucz}',
                   'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
         dane=json.dumps({'media_url': publiczny}).encode(), metoda='PATCH')
    return publiczny


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--kategoria', help='tylko ta kategoria')
    p.add_argument('--id', action='append', default=[], help='konkretne ćwiczenie (można wielokrotnie)')
    p.add_argument('--limit', type=int, help='najwyżej tyle obrazków')
    p.add_argument('--wgraj', action='store_true', help='wyślij do bucketu i ustaw media_url')
    p.add_argument('--tylko-wgraj', action='store_true',
                   help='nie generuj nic nowego — wyślij pliki, które już leżą w wygenerowane/')
    p.add_argument('--nadpisz', action='store_true', help='generuj też to, co ma już grafikę lub plik')
    p.add_argument('--model', default=DOMYSLNY_MODEL)
    p.add_argument('--bez-referencji', action='store_true',
                   help='ignoruj arkusze postaci, tożsamość z samego promptu')
    p.add_argument('--rozmiar', type=int, default=1024)
    p.add_argument('--kroki', type=int, default=28)
    p.add_argument('--rownolegle', type=int, default=4)
    p.add_argument('--tak', action='store_true', help='nie pytaj o potwierdzenie kosztu')
    a = p.parse_args()

    if a.tylko_wgraj:
        a.wgraj = True

    klucz_fal = os.environ.get('FAL_KEY')
    if not klucz_fal and not a.tylko_wgraj:
        sys.exit('Brak FAL_KEY w środowisku. Dopisz go do .env.local i puść:\n'
                 '  set -a && . ./.env.local && set +a && python3 scripts/ilustracje/generuj.py ...')

    url_sb = klucz_sb = None
    if a.wgraj:
        try:
            url_sb = os.environ['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/')
            klucz_sb = os.environ['SUPABASE_SERVICE_ROLE_KEY']
        except KeyError as e:
            sys.exit(f'--wgraj wymaga {e.args[0]} w środowisku.')

    with open(MANIFEST, encoding='utf-8') as f:
        manifest = json.load(f)
    wszystkie, obsada, styl = manifest['cwiczenia'], manifest['obsada'], manifest['styl']

    bez_sceny = [w for w in wszystkie if w['do_przegladu']]
    kolejka = [w for w in wszystkie if not w['do_przegladu']]
    if a.kategoria:
        kolejka = [w for w in kolejka if w['kategoria'] == a.kategoria]
    if a.id:
        kolejka = [w for w in kolejka if w['id'] in a.id]
    if a.tylko_wgraj:
        kolejka = [w for w in kolejka if os.path.exists(os.path.join(WYJSCIE, w['plik']))]
    elif not a.nadpisz:
        kolejka = [w for w in kolejka
                   if not w['ma_grafike']
                   and not os.path.exists(os.path.join(WYJSCIE, w['plik']))]
    if a.limit:
        kolejka = kolejka[:a.limit]

    if bez_sceny:
        print(f'Pomijam {len(bez_sceny)} ćwiczeń bez ręcznie napisanej sceny '
              f'(uzupełnij sceny.json i przebuduj manifest).', file=sys.stderr)
    if not kolejka:
        sys.exit('Nic do zrobienia.')

    mpx = (a.rozmiar / 1024) ** 2
    if a.tylko_wgraj:
        print(f'Do wgrania: {len(kolejka)} gotowych plików | bez wywołań fal, koszt $0,00')
    else:
        koszt = len(kolejka) * mpx * CENA_ZA_MPX
        print(f'Do wygenerowania: {len(kolejka)} | model {a.model} | '
              f'{a.rozmiar}×{a.rozmiar} | szacowany koszt ≈ ${koszt:.2f}')
    if not a.bez_referencji:
        z_arkuszem = sorted({w['kategoria'] for w in kolejka if referencja(w['kategoria'])})
        print(f'Arkusz postaci: ' + (', '.join(z_arkuszem) if z_arkuszem
              else 'brak — tożsamość z samego promptu'))
    print(f'Zapis: {WYJSCIE}' + ('  + bucket i media_url' if a.wgraj else '  (baza nietknięta)'))
    if not a.tak and input('Lecimy? [t/N] ').strip().lower() not in ('t', 'tak', 'y'):
        sys.exit('Przerwane.')

    def zrob(w):
        sciezka = os.path.join(WYJSCIE, w['plik'])

        if a.tylko_wgraj:
            with open(sciezka, 'rb') as f:
                bajty = f.read()
            wgraj(w, bajty, url=url_sb, klucz=klucz_sb)
            return len(bajty)

        ref = None if a.bez_referencji else referencja(w['kategoria'])
        if ref:
            # Wariant edycyjny bierze tożsamość z arkusza; prompt opisuje sam ruch.
            zadanie = dict(w, prompt=prompt_z_referencja(w, obsada, styl))
            model = a.model if a.model != DOMYSLNY_MODEL else DOMYSLNY_MODEL + '/edit'
        else:
            zadanie, model = w, a.model
        bajty = fal_generuj(zadanie, model=model, rozmiar=a.rozmiar,
                            klucz=klucz_fal, kroki=a.kroki,
                            referencje=[ref] if ref else None)
        os.makedirs(os.path.dirname(sciezka), exist_ok=True)
        with open(sciezka, 'wb') as f:
            f.write(bajty)
        if a.wgraj:
            wgraj(w, bajty, url=url_sb, klucz=klucz_sb)
        return len(bajty)

    udane, bledy = 0, []
    with cf.ThreadPoolExecutor(max_workers=a.rownolegle) as pula:
        zadania = {pula.submit(zrob, w): w for w in kolejka}
        for i, fut in enumerate(cf.as_completed(zadania), 1):
            w = zadania[fut]
            try:
                rozmiar_pliku = fut.result()
                udane += 1
                print(f'[{i}/{len(kolejka)}] ✓ {w["klucz"]} ({rozmiar_pliku // 1024} kB)')
            except Exception as e:
                bledy.append((w['klucz'], str(e)))
                print(f'[{i}/{len(kolejka)}] ✗ {w["klucz"]}: {e}', file=sys.stderr)

    koszt_koncowy = 0.0 if a.tylko_wgraj else udane * mpx * CENA_ZA_MPX
    print(f'\nGotowe: {udane}/{len(kolejka)} | koszt ≈ ${koszt_koncowy:.2f}')
    if bledy:
        print(f'Nieudane ({len(bledy)}):', file=sys.stderr)
        for k, e in bledy:
            print(f'  {k}: {e[:160]}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
