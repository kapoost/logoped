#!/usr/bin/env python3
"""Buduje manifest promptów do ilustracji ćwiczeń — jeden wiersz na ćwiczenie.

Manifest jest niezależny od silnika: te same prompty można puścić lokalnie
(diffusers/MLX) albo przez API. Seed wyliczany z id ćwiczenia, więc ponowne
wygenerowanie daje ten sam obrazek, a poprawka promptu — nowy.

Scena (to, co widać na obrazku) pochodzi z sceny.json, pisanego ręcznie po
angielsku. Dla ćwiczeń, których tam jeszcze nie ma, budowany jest fallback
z pierwszego kroku instrukcji — po polsku i często identyczny dla kilku ćwiczeń,
więc taki wiersz dostaje `do_przegladu: true` i nie nadaje się do generowania.

Użycie:  python3 scripts/ilustracje/build_prompts.py > scripts/ilustracje/prompts.json
"""
import json, os, sys, urllib.request, hashlib

URL = os.environ['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/')
KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']
TUTAJ = os.path.dirname(os.path.abspath(__file__))

# ── Specyfikacja stylu ────────────────────────────────────────────────────
# Jeden styl dla całej bazy. Zmiana tutaj = przegenerowanie wszystkiego,
# dlatego trzymamy go w jednym miejscu, a nie w promptach per ćwiczenie.
STYL = (
    "flat 2D children's book illustration, soft rounded shapes, "
    "warm pastel palette, thick clean outlines, gentle top-left lighting, "
    "single centered subject, plain very light cream background, "
    "friendly and calm, square composition"
)

# Czego nigdy nie chcemy. Tekst osobno: podpisy renderujemy w HTML nad obrazkiem,
# bo modele dyfuzyjne psują polskie ogonki, a tytuł i opis mamy w bazie.
ANTY = (
    "text, letters, words, captions, watermark, signature, numbers, "
    "multiple panels, grid, collage, photorealistic, 3d render, "
    "scary, creepy, distorted anatomy, extra limbs, deformed mouth"
)

# Obsada — te same postacie wracają, żeby baza wyglądała na jeden świat,
# a dziecko rozpoznawało bohatera. Lolo to maskotka aplikacji.
OBSADA = {
    'oddechowe':     'a cheerful green parrot named Lolo',
    'warg':          'a round friendly piglet',
    'jezyka':        'a playful brown puppy',
    'artykulacyjne': 'a bright red parrot',
    'podniebienia':  'a sleepy brown bear cub',
    'sluchowe':      'a big-eared grey rabbit',
    'polykanie':     'a happy water droplet character with a cape',
    'zuchwa':        'a cheeky little monkey',
}

def fetch(path):
    req = urllib.request.Request(URL + path)
    req.add_header('apikey', KEY)
    req.add_header('Authorization', f'Bearer {KEY}')
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())

with open(os.path.join(TUTAJ, 'sceny.json'), encoding='utf-8') as f:
    SCENY = {k: v for k, v in json.load(f).items() if not k.startswith('_')}

rows = fetch('/rest/v1/exercises'
             '?select=id,title,description,instructions,category,emoji,media_url'
             '&created_by=is.null&archived_at=is.null&order=category,title&limit=500')

manifest, uzyte = [], set()
for e in rows:
    bohater = OBSADA.get(e['category'], 'a friendly cartoon animal')
    klucz = f"{e['category']}/{e['title']}"

    if klucz in SCENY:
        scena, do_przegladu = f"{bohater} {SCENY[klucz]}", False
        uzyte.add(klucz)
    else:
        # Fallback: opis celu i pierwszy krok instrukcji. Po polsku i mało
        # obrazowy — wiersz jest tu po to, żeby było widać, czego brakuje.
        pierwszy_krok = (e['instructions'] or '').split('\n')[0]
        pierwszy_krok = pierwszy_krok.split('. ', 1)[-1].rstrip('.')
        scena = f"{bohater} demonstrating a speech therapy exercise: {pierwszy_krok}"
        do_przegladu = True

    manifest.append({
        'id':        e['id'],
        'tytul':     e['title'],
        'kategoria': e['category'],
        'klucz':     klucz,
        'plik':      f"{e['category']}/{e['id']}.webp",
        'scena':     scena,
        'prompt':    f"{scena}. {STYL}",
        'negative':  ANTY,
        'seed':      int(hashlib.sha256(e['id'].encode()).hexdigest()[:8], 16),
        'ma_grafike': bool(e.get('media_url')),
        'do_przegladu': do_przegladu,
    })

gotowe = sum(1 for m in manifest if not m['do_przegladu'])
osierocone = sorted(set(SCENY) - uzyte)
print(f'[build] ćwiczeń: {len(manifest)} | ze sceną: {gotowe} | '
      f'do napisania: {len(manifest) - gotowe}', file=sys.stderr)
if osierocone:
    print(f'[build] UWAGA: {len(osierocone)} scen bez ćwiczenia w bazie '
          f'(zmieniony tytuł albo kategoria): {", ".join(osierocone)}', file=sys.stderr)

json.dump({'styl': STYL, 'anty': ANTY, 'obsada': OBSADA, 'cwiczenia': manifest},
          sys.stdout, ensure_ascii=False, indent=2)
