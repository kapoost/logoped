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
import argparse, concurrent.futures as cf, json, os, sys, time, urllib.error, urllib.request

TUTAJ    = os.path.dirname(os.path.abspath(__file__))
MANIFEST = os.path.join(TUTAJ, 'prompts.json')
WYJSCIE  = os.path.join(TUTAJ, 'wygenerowane')
BUCKET   = 'exercise-media'

# $0.012 za megapiksel (FLUX.2 [dev], cennik fal z 20.10.2026). 1024² ≈ 1 Mpx.
CENA_ZA_MPX = 0.012


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
def fal_generuj(wpis, *, model, rozmiar, klucz, kroki):
    """Kolejkuje zadanie i czeka na wynik. Zwraca bajty obrazka."""
    naglowki = {'Authorization': f'Key {klucz}', 'Content-Type': 'application/json'}
    wejscie = {
        'prompt': wpis['prompt'],
        'image_size': {'width': rozmiar, 'height': rozmiar},
        'num_images': 1,
        'seed': wpis['seed'],
        'output_format': 'webp',
        'num_inference_steps': kroki,
        # Prompt jest już precyzyjny i ten sam styl ma obowiązywać wszędzie;
        # rozszerzanie przez model rozjechałoby spójność między obrazkami.
        'enable_prompt_expansion': False,
    }
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
    p.add_argument('--nadpisz', action='store_true', help='generuj też to, co ma już grafikę lub plik')
    p.add_argument('--model', default='fal-ai/flux-2')
    p.add_argument('--rozmiar', type=int, default=1024)
    p.add_argument('--kroki', type=int, default=28)
    p.add_argument('--rownolegle', type=int, default=4)
    p.add_argument('--tak', action='store_true', help='nie pytaj o potwierdzenie kosztu')
    a = p.parse_args()

    klucz_fal = os.environ.get('FAL_KEY')
    if not klucz_fal:
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
        wszystkie = json.load(f)['cwiczenia']

    bez_sceny = [w for w in wszystkie if w['do_przegladu']]
    kolejka = [w for w in wszystkie if not w['do_przegladu']]
    if a.kategoria:
        kolejka = [w for w in kolejka if w['kategoria'] == a.kategoria]
    if a.id:
        kolejka = [w for w in kolejka if w['id'] in a.id]
    if not a.nadpisz:
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
    koszt = len(kolejka) * mpx * CENA_ZA_MPX
    print(f'Do wygenerowania: {len(kolejka)} | model {a.model} | '
          f'{a.rozmiar}×{a.rozmiar} | szacowany koszt ≈ ${koszt:.2f}')
    print(f'Zapis: {WYJSCIE}' + ('  + bucket i media_url' if a.wgraj else '  (baza nietknięta)'))
    if not a.tak and input('Lecimy? [t/N] ').strip().lower() not in ('t', 'tak', 'y'):
        sys.exit('Przerwane.')

    def zrob(w):
        bajty = fal_generuj(w, model=a.model, rozmiar=a.rozmiar,
                            klucz=klucz_fal, kroki=a.kroki)
        sciezka = os.path.join(WYJSCIE, w['plik'])
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

    print(f'\nGotowe: {udane}/{len(kolejka)} | koszt ≈ ${udane * mpx * CENA_ZA_MPX:.2f}')
    if bledy:
        print(f'Nieudane ({len(bledy)}):', file=sys.stderr)
        for k, e in bledy:
            print(f'  {k}: {e[:160]}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
