-- 012_seed_cwiczenia_logopedyczne.sql
-- Baza ćwiczeń z materiałów logopedy (6 obszarów, zestawy z sierpnia 2026).
-- Wymaga migracji 011 (kategorie `polykanie` i `zuchwa`) uruchomionej WCZEŚNIEJ,
-- w osobnej transakcji — Postgres nie pozwala użyć nowej wartości enuma
-- w tej samej transakcji, w której została dodana.
--
-- Dublety: przy kolizji z istniejącym ćwiczeniem publicznym wygrywa wersja z materiałów,
-- ale nadpisujemy wiersz zamiast wstawiać nowy — plan_exercises.exercise_id ma
-- ON DELETE RESTRICT i wiszą na nim istniejące plany pacjentów.
--
-- Skrypt jest idempotentny: INSERT-y są strzeżone przez NOT EXISTS, UPDATE-y działają
-- po tytule. Nadpisania mają fallback na INSERT, więc na świeżej bazie (bez seed.sql)
-- wchodzi komplet 92 ćwiczeń, a nie tylko te 78 nowych.
--
-- Bez jawnego BEGIN/COMMIT — `supabase db push` i SQL Editor same owijają skrypt
-- w transakcję, a zagnieżdżony COMMIT zamykał ją przedwcześnie.
-- ══════════════════════════════════════════════════════════════
-- KONTROLA PRZED NADPISANIEM
-- Jeśli któryś tytuł zniknął z bazy (ktoś zmienił nazwę, ćwiczenie usunięto),
-- chcemy o tym wiedzieć, zanim UPDATE cicho zrobi 0 wierszy.
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  brakujace TEXT;
BEGIN
  SELECT string_agg(t.tytul || ' [' || t.kat || ']', ', ')
  INTO brakujace
  FROM (VALUES
    ('Wąchanie kwiatka', 'oddechowe'),
    ('Zgaś świeczkę', 'oddechowe'),
    ('Bańki mydlane', 'oddechowe'),
    ('Dmuchanie balonka', 'oddechowe'),
    ('Całuski', 'warg'),
    ('Ryjek / trąbka', 'warg'),
    ('Uśmiech ↔ ryjek', 'warg'),
    ('Dmuchanie policzków', 'warg'),
    ('Klaskanie językiem', 'jezyka'),
    ('Liczenie zębów językiem', 'jezyka'),
    ('Ziewanie', 'podniebienia'),
    ('Chrapanie', 'podniebienia'),
    ('Płukanie gardła', 'podniebienia'),
    ('AAAA — głośne i długie', 'podniebienia')
  ) AS t(tytul, kat)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises e
    WHERE e.title = t.tytul
      AND e.category::text = t.kat
      AND e.created_by IS NULL
  );

  IF brakujace IS NOT NULL THEN
    RAISE NOTICE 'Nie znaleziono do nadpisania — wejdą jako nowe wiersze: %', brakujace;
  ELSE
    RAISE NOTICE 'Wszystkie 14 ćwiczenia do nadpisania odnalezione.';
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- NADPISANIA (14) — wersja z materiałów zastępuje dotychczasową
-- ══════════════════════════════════════════════════════════════
UPDATE public.exercises SET
  title            = 'Wąchanie kwiatków',
  description      = 'Nauka spokojnego wdechu nosem.',
  instructions     = '1. Weź do ręki kwiatek.
2. Powoli wciągnij powietrze nosem.
3. Spokojnie wypuść powietrze ustami.',
  difficulty       = 'latwe'::public.difficulty_level,
  target_sounds    = NULL,
  duration_seconds = 45,
  emoji            = '🌸',
  updated_at       = NOW()
WHERE title = 'Wąchanie kwiatka'
  AND category = 'oddechowe'::public.exercise_category
  AND created_by IS NULL;

-- Fallback: na świeżej bazie nie ma czego nadpisywać (seed.sql leci dopiero po
-- migracjach), więc ćwiczenie musi wejść jako nowe.
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Wąchanie kwiatków', 'Nauka spokojnego wdechu nosem.', '1. Weź do ręki kwiatek.
2. Powoli wciągnij powietrze nosem.
3. Spokojnie wypuść powietrze ustami.',
       'oddechowe'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🌸', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Wąchanie kwiatków' AND category = 'oddechowe'::public.exercise_category
    AND created_by IS NULL
);
UPDATE public.exercises SET
  title            = 'Gaszenie świeczki',
  description      = 'Wydłużanie i kontrolowanie wydechu.',
  instructions     = '1. Nabierz powietrze nosem.
2. Dmuchaj równym strumieniem na świeczkę.
3. Staraj się nie robić gwałtownych wydechów.',
  difficulty       = 'latwe'::public.difficulty_level,
  target_sounds    = NULL,
  duration_seconds = 45,
  emoji            = '🕯️',
  updated_at       = NOW()
WHERE title = 'Zgaś świeczkę'
  AND category = 'oddechowe'::public.exercise_category
  AND created_by IS NULL;

-- Fallback: na świeżej bazie nie ma czego nadpisywać (seed.sql leci dopiero po
-- migracjach), więc ćwiczenie musi wejść jako nowe.
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Gaszenie świeczki', 'Wydłużanie i kontrolowanie wydechu.', '1. Nabierz powietrze nosem.
2. Dmuchaj równym strumieniem na świeczkę.
3. Staraj się nie robić gwałtownych wydechów.',
       'oddechowe'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🕯️', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Gaszenie świeczki' AND category = 'oddechowe'::public.exercise_category
    AND created_by IS NULL
);
UPDATE public.exercises SET
  title            = 'Bańki mydlane',
  description      = 'Regulacja siły wydechu.',
  instructions     = '1. Nabierz powietrze nosem.
2. Powoli dmuchaj przez obręcz.
3. Twórz jak największe bańki.',
  difficulty       = 'latwe'::public.difficulty_level,
  target_sounds    = NULL,
  duration_seconds = 60,
  emoji            = '🫧',
  updated_at       = NOW()
WHERE title = 'Bańki mydlane'
  AND category = 'oddechowe'::public.exercise_category
  AND created_by IS NULL;

-- Fallback: na świeżej bazie nie ma czego nadpisywać (seed.sql leci dopiero po
-- migracjach), więc ćwiczenie musi wejść jako nowe.
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Bańki mydlane', 'Regulacja siły wydechu.', '1. Nabierz powietrze nosem.
2. Powoli dmuchaj przez obręcz.
3. Twórz jak największe bańki.',
       'oddechowe'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 60, '🫧', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Bańki mydlane' AND category = 'oddechowe'::public.exercise_category
    AND created_by IS NULL
);
UPDATE public.exercises SET
  title            = 'Nadmuchiwanie balonu',
  description      = 'Wzmacnianie mięśni oddechowych.',
  instructions     = '1. Wykonaj głęboki wdech nosem.
2. Nadmuchuj balon spokojnie i równomiernie.',
  difficulty       = 'srednie'::public.difficulty_level,
  target_sounds    = NULL,
  duration_seconds = 60,
  emoji            = '🎈',
  updated_at       = NOW()
WHERE title = 'Dmuchanie balonka'
  AND category = 'oddechowe'::public.exercise_category
  AND created_by IS NULL;

-- Fallback: na świeżej bazie nie ma czego nadpisywać (seed.sql leci dopiero po
-- migracjach), więc ćwiczenie musi wejść jako nowe.
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Nadmuchiwanie balonu', 'Wzmacnianie mięśni oddechowych.', '1. Wykonaj głęboki wdech nosem.
2. Nadmuchuj balon spokojnie i równomiernie.',
       'oddechowe'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 60, '🎈', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Nadmuchiwanie balonu' AND category = 'oddechowe'::public.exercise_category
    AND created_by IS NULL
);
UPDATE public.exercises SET
  title            = 'Cmokanie',
  description      = 'Wzmacnianie mięśnia okrężnego warg.',
  instructions     = '1. Wysuń i zaokrąglij wargi.
2. Zetknij szczęki.
3. Cmokaj głośno kilka razy.',
  difficulty       = 'latwe'::public.difficulty_level,
  target_sounds    = NULL,
  duration_seconds = 30,
  emoji            = '🐶',
  updated_at       = NOW()
WHERE title = 'Całuski'
  AND category = 'warg'::public.exercise_category
  AND created_by IS NULL;

-- Fallback: na świeżej bazie nie ma czego nadpisywać (seed.sql leci dopiero po
-- migracjach), więc ćwiczenie musi wejść jako nowe.
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Cmokanie', 'Wzmacnianie mięśnia okrężnego warg.', '1. Wysuń i zaokrąglij wargi.
2. Zetknij szczęki.
3. Cmokaj głośno kilka razy.',
       'warg'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 30, '🐶', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Cmokanie' AND category = 'warg'::public.exercise_category
    AND created_by IS NULL
);
UPDATE public.exercises SET
  title            = 'Ryjek świnki',
  description      = 'Nauka wysuwania i zaokrąglania warg.',
  instructions     = '1. Wysuń zaokrąglone wargi do przodu.
2. Utrzymaj pozycję ryjka przez kilka sekund.',
  difficulty       = 'latwe'::public.difficulty_level,
  target_sounds    = NULL,
  duration_seconds = 30,
  emoji            = '🐷',
  updated_at       = NOW()
WHERE title = 'Ryjek / trąbka'
  AND category = 'warg'::public.exercise_category
  AND created_by IS NULL;

-- Fallback: na świeżej bazie nie ma czego nadpisywać (seed.sql leci dopiero po
-- migracjach), więc ćwiczenie musi wejść jako nowe.
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Ryjek świnki', 'Nauka wysuwania i zaokrąglania warg.', '1. Wysuń zaokrąglone wargi do przodu.
2. Utrzymaj pozycję ryjka przez kilka sekund.',
       'warg'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 30, '🐷', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Ryjek świnki' AND category = 'warg'::public.exercise_category
    AND created_by IS NULL
);
UPDATE public.exercises SET
  title            = 'Ryjek i uśmiech',
  description      = 'Naprzemienna praca mięśni warg.',
  instructions     = '1. Ułóż wargi w ryjek.
2. Rozsuń je do szerokiego uśmiechu.
3. Powtarzaj naprzemiennie.',
  difficulty       = 'latwe'::public.difficulty_level,
  target_sounds    = NULL,
  duration_seconds = 30,
  emoji            = '🐰',
  updated_at       = NOW()
WHERE title = 'Uśmiech ↔ ryjek'
  AND category = 'warg'::public.exercise_category
  AND created_by IS NULL;

-- Fallback: na świeżej bazie nie ma czego nadpisywać (seed.sql leci dopiero po
-- migracjach), więc ćwiczenie musi wejść jako nowe.
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Ryjek i uśmiech', 'Naprzemienna praca mięśni warg.', '1. Ułóż wargi w ryjek.
2. Rozsuń je do szerokiego uśmiechu.
3. Powtarzaj naprzemiennie.',
       'warg'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 30, '🐰', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Ryjek i uśmiech' AND category = 'warg'::public.exercise_category
    AND created_by IS NULL
);
UPDATE public.exercises SET
  title            = 'Balonikowe policzki',
  description      = 'Kontrola powietrza w jamie ustnej.',
  instructions     = '1. Nadmuchaj policzki.
2. Utrzymaj powietrze przez chwilę.
3. Powoli je wypuść.',
  difficulty       = 'latwe'::public.difficulty_level,
  target_sounds    = NULL,
  duration_seconds = 30,
  emoji            = '🐿️',
  updated_at       = NOW()
WHERE title = 'Dmuchanie policzków'
  AND category = 'warg'::public.exercise_category
  AND created_by IS NULL;

-- Fallback: na świeżej bazie nie ma czego nadpisywać (seed.sql leci dopiero po
-- migracjach), więc ćwiczenie musi wejść jako nowe.
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Balonikowe policzki', 'Kontrola powietrza w jamie ustnej.', '1. Nadmuchaj policzki.
2. Utrzymaj powietrze przez chwilę.
3. Powoli je wypuść.',
       'warg'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 30, '🐿️', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Balonikowe policzki' AND category = 'warg'::public.exercise_category
    AND created_by IS NULL
);
UPDATE public.exercises SET
  title            = 'Kląskający konik',
  description      = 'Pionizacja języka.',
  instructions     = '1. Przyklej język do podniebienia.
2. Odklej go z głośnym kląśnięciem.
3. Naśladuj konika uderzającego kopytami o bruk.',
  difficulty       = 'latwe'::public.difficulty_level,
  target_sounds    = NULL,
  duration_seconds = 45,
  emoji            = '🐴',
  updated_at       = NOW()
WHERE title = 'Klaskanie językiem'
  AND category = 'jezyka'::public.exercise_category
  AND created_by IS NULL;

-- Fallback: na świeżej bazie nie ma czego nadpisywać (seed.sql leci dopiero po
-- migracjach), więc ćwiczenie musi wejść jako nowe.
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Kląskający konik', 'Pionizacja języka.', '1. Przyklej język do podniebienia.
2. Odklej go z głośnym kląśnięciem.
3. Naśladuj konika uderzającego kopytami o bruk.',
       'jezyka'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🐴', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Kląskający konik' AND category = 'jezyka'::public.exercise_category
    AND created_by IS NULL
);
UPDATE public.exercises SET
  title            = 'Liczenie zębów',
  description      = 'Precyzja ruchów czubka języka.',
  instructions     = '1. Otwórz szeroko usta.
2. Dotykaj czubkiem języka górnych zębów od wewnętrznej strony.
3. Policz zęby po kolei.',
  difficulty       = 'srednie'::public.difficulty_level,
  target_sounds    = NULL,
  duration_seconds = 60,
  emoji            = '🦷',
  updated_at       = NOW()
WHERE title = 'Liczenie zębów językiem'
  AND category = 'jezyka'::public.exercise_category
  AND created_by IS NULL;

-- Fallback: na świeżej bazie nie ma czego nadpisywać (seed.sql leci dopiero po
-- migracjach), więc ćwiczenie musi wejść jako nowe.
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Liczenie zębów', 'Precyzja ruchów czubka języka.', '1. Otwórz szeroko usta.
2. Dotykaj czubkiem języka górnych zębów od wewnętrznej strony.
3. Policz zęby po kolei.',
       'jezyka'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 60, '🦷', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Liczenie zębów' AND category = 'jezyka'::public.exercise_category
    AND created_by IS NULL
);
UPDATE public.exercises SET
  title            = 'Ziewający miś',
  description      = 'Unoszenie podniebienia miękkiego.',
  instructions     = '1. Opuść żuchwę.
2. Ziewaj szeroko i spokojnie.',
  difficulty       = 'latwe'::public.difficulty_level,
  target_sounds    = NULL,
  duration_seconds = 30,
  emoji            = '🐻',
  updated_at       = NOW()
WHERE title = 'Ziewanie'
  AND category = 'podniebienia'::public.exercise_category
  AND created_by IS NULL;

-- Fallback: na świeżej bazie nie ma czego nadpisywać (seed.sql leci dopiero po
-- migracjach), więc ćwiczenie musi wejść jako nowe.
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Ziewający miś', 'Unoszenie podniebienia miękkiego.', '1. Opuść żuchwę.
2. Ziewaj szeroko i spokojnie.',
       'podniebienia'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 30, '🐻', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Ziewający miś' AND category = 'podniebienia'::public.exercise_category
    AND created_by IS NULL
);
UPDATE public.exercises SET
  title            = 'Dziadek chrapie',
  description      = 'Aktywizacja podniebienia miękkiego.',
  instructions     = '1. Naśladuj chrapanie na wdechu.
2. Naśladuj chrapanie na wydechu.',
  difficulty       = 'latwe'::public.difficulty_level,
  target_sounds    = NULL,
  duration_seconds = 30,
  emoji            = '😴',
  updated_at       = NOW()
WHERE title = 'Chrapanie'
  AND category = 'podniebienia'::public.exercise_category
  AND created_by IS NULL;

-- Fallback: na świeżej bazie nie ma czego nadpisywać (seed.sql leci dopiero po
-- migracjach), więc ćwiczenie musi wejść jako nowe.
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Dziadek chrapie', 'Aktywizacja podniebienia miękkiego.', '1. Naśladuj chrapanie na wdechu.
2. Naśladuj chrapanie na wydechu.',
       'podniebienia'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 30, '😴', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Dziadek chrapie' AND category = 'podniebienia'::public.exercise_category
    AND created_by IS NULL
);
UPDATE public.exercises SET
  title            = 'Gołąbek grucha',
  description      = 'Praca podniebienia miękkiego.',
  instructions     = '1. Nabierz do ust ciepłą wodę.
2. Płucz gardło albo naśladuj płukanie bez wody.',
  difficulty       = 'srednie'::public.difficulty_level,
  target_sounds    = NULL,
  duration_seconds = 45,
  emoji            = '🕊️',
  updated_at       = NOW()
WHERE title = 'Płukanie gardła'
  AND category = 'podniebienia'::public.exercise_category
  AND created_by IS NULL;

-- Fallback: na świeżej bazie nie ma czego nadpisywać (seed.sql leci dopiero po
-- migracjach), więc ćwiczenie musi wejść jako nowe.
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Gołąbek grucha', 'Praca podniebienia miękkiego.', '1. Nabierz do ust ciepłą wodę.
2. Płucz gardło albo naśladuj płukanie bez wody.',
       'podniebienia'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 45, '🕊️', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Gołąbek grucha' AND category = 'podniebienia'::public.exercise_category
    AND created_by IS NULL
);
UPDATE public.exercises SET
  title            = 'Echo w jaskini',
  description      = 'Przedłużona fonacja samogłosek.',
  instructions     = '1. Zrób wdech nosem.
2. Przeciągaj samogłoski: aaa, ooo, uuu.',
  difficulty       = 'latwe'::public.difficulty_level,
  target_sounds    = NULL,
  duration_seconds = 45,
  emoji            = '🏔️',
  updated_at       = NOW()
WHERE title = 'AAAA — głośne i długie'
  AND category = 'podniebienia'::public.exercise_category
  AND created_by IS NULL;

-- Fallback: na świeżej bazie nie ma czego nadpisywać (seed.sql leci dopiero po
-- migracjach), więc ćwiczenie musi wejść jako nowe.
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Echo w jaskini', 'Przedłużona fonacja samogłosek.', '1. Zrób wdech nosem.
2. Przeciągaj samogłoski: aaa, ooo, uuu.',
       'podniebienia'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🏔️', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Echo w jaskini' AND category = 'podniebienia'::public.exercise_category
    AND created_by IS NULL
);

-- ══════════════════════════════════════════════════════════════
-- NOWE ĆWICZENIA (78)
-- ══════════════════════════════════════════════════════════════

-- ── oddechowe ──
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Piórko w powietrzu', 'Ćwiczenie siły i kierunku wydechu.', '1. Połóż piórko na dłoni.
2. Delikatnie dmuchaj, aby utrzymać je w ruchu.',
       'oddechowe'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🪶', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Piórko w powietrzu' AND category = 'oddechowe'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Wyścigi papierowych kulek', 'Kontrola wydechu.', '1. Przygotuj kulkę z papieru.
2. Dmuchaj przez słomkę.
3. Doprowadź kulkę do mety.',
       'oddechowe'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 60, '🏁', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Wyścigi papierowych kulek' AND category = 'oddechowe'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Wiatraczek', 'Wydłużanie wydechu.', '1. Nabierz powietrza nosem.
2. Utrzymuj obrót wiatraczka jak najdłużej.',
       'oddechowe'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🌬️', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Wiatraczek' AND category = 'oddechowe'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Statek na wodzie', 'Ćwiczenie kierunkowego wydechu.', '1. Umieść papierowy statek na wodzie.
2. Dmuchaj tak, aby dopłynął do celu.',
       'oddechowe'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 60, '⛵', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Statek na wodzie' AND category = 'oddechowe'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Syczenie i szumienie', 'Nauka przedłużonego wydechu.', '1. Zrób wdech nosem.
2. Wydech z głoskami: SSSSS, SZSZSZ, FFFFF.',
       'oddechowe'::public.exercise_category, 'latwe'::public.difficulty_level,
       ARRAY['s', 'sz', 'f'], 45, '🐍', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Syczenie i szumienie' AND category = 'oddechowe'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Lokomotywa', 'Koordynacja oddechu i fonacji.', '1. Nabierz powietrze nosem.
2. Na wydechu mów: cz-cz-cz, tu-tu, szszsz.',
       'oddechowe'::public.exercise_category, 'srednie'::public.difficulty_level,
       ARRAY['cz', 'sz'], 60, '🚂', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Lokomotywa' AND category = 'oddechowe'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Huśtanie misia', 'Trening oddechu przeponowego.', '1. Połóż się na plecach.
2. Połóż misia na brzuchu.
3. Wdech nosem unosi misia, wydech ustami opuszcza.',
       'oddechowe'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 90, '🧸', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Huśtanie misia' AND category = 'oddechowe'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Skłony', 'Koordynacja oddechu i ruchu.', '1. Stań prosto.
2. Zrób wdech w pozycji stojącej.
3. Wydech podczas skłonu.',
       'oddechowe'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 60, '🙆', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Skłony' AND category = 'oddechowe'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Głoskowa zabawa', 'Połączenie oddychania z głosem.', '1. Zrób wdech nosem.
2. Na wydechu przeciągaj: UUU, EEE, III, AAA, OOO.',
       'oddechowe'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🎵', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Głoskowa zabawa' AND category = 'oddechowe'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Gwizdanie', 'Wydłużanie fazy wydechowej.', '1. Zrób głęboki wdech nosem.
2. Jak najdłużej gwiżdż na jednym wydechu.',
       'oddechowe'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 45, '😗', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Gwizdanie' AND category = 'oddechowe'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Zimne rączki', 'Trening wydechu.', '1. Chuchaj na dłonie.
2. Wykonuj krótkie i długie wydechy.',
       'oddechowe'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🧤', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Zimne rączki' AND category = 'oddechowe'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Siła słomki', 'Trening fazy wdechowej.', '1. Zasysaj przez słomkę lekkie elementy.
2. Przenoś je bez używania rąk.',
       'oddechowe'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 60, '🥤', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Siła słomki' AND category = 'oddechowe'::public.exercise_category
    AND created_by IS NULL
);

-- ── warg ──
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Wesołe odgłosy', 'Ruchomość warg w zabawie dźwiękowej.', '1. Naśladuj krowę: mu, mu.
2. Naśladuj kukułkę: ku, ku, i sowę: hu, hu.
3. Naśladuj psa: hau, hau, rybkę: plum, plum.
4. Naśladuj pukanie: puk, puk, i chodzenie: tupu, tupu.',
       'warg'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 60, '🐮', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Wesołe odgłosy' AND category = 'warg'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Otwórz i zamknij', 'Kontrola ruchu warg.', '1. Wysuń wargi do przodu.
2. Otwieraj i zamykaj je w tej pozycji.',
       'warg'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 30, '🦊', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Otwórz i zamknij' AND category = 'warg'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Silne wargi', 'Wzmacnianie siły zwarcia warg.', '1. Włóż między wargi duży płaski guzik na sznurku.
2. Przytrzymuj go wargami, gdy ktoś delikatnie próbuje go wyciągnąć.
3. Nie pomagaj sobie zębami.',
       'warg'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 45, '🐻', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Silne wargi' AND category = 'warg'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Mocny zacisk', 'Wzmacnianie zwarcia warg.', '1. Silnie zaciśnij wargi.
2. Utrzymaj zacisk przez kilka sekund.',
       'warg'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 30, '🦫', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Mocny zacisk' AND category = 'warg'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Warga na wardze', 'Niezależna praca wargi górnej i dolnej.', '1. Nałóż górną wargę na dolną.
2. Następnie dolną na górną.',
       'warg'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 30, '🐱', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Warga na wardze' AND category = 'warg'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Ssanie warg', 'Wzmacnianie mięśni warg.', '1. Delikatnie zassij obie wargi do jamy ustnej.
2. Utrzymaj tę pozycję przez kilka sekund.',
       'warg'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 30, '🐹', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Ssanie warg' AND category = 'warg'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Ołówek między wargami', 'Utrzymanie napięcia warg.', '1. Włóż ołówek lub kredkę między wargi.
2. Utrzymaj go bez używania zębów.',
       'warg'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 45, '🦒', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Ołówek między wargami' AND category = 'warg'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Wędrujące powietrze', 'Kontrola powietrza i praca policzków.', '1. Nabierz powietrza do ust.
2. Przepychaj je z jednego policzka do drugiego.',
       'warg'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 45, '🦛', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Wędrujące powietrze' AND category = 'warg'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Górna i dolna warga', 'Izolowana praca każdej wargi.', '1. Zamknij szczęki.
2. Unieś wargę górną.
3. Opuść wargę dolną.',
       'warg'::public.exercise_category, 'trudne'::public.difficulty_level,
       NULL, 30, '🐰', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Górna i dolna warga' AND category = 'warg'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Dmuchamy!', 'Łączenie pracy warg z wydechem.', '1. Ułóż wargi do dmuchania.
2. Dmuchaj na płomień świecy, skrawki papieru, watkę lub piłeczkę pingpongową.',
       'warg'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🐕', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Dmuchamy!' AND category = 'warg'::public.exercise_category
    AND created_by IS NULL
);

-- ── jezyka ──
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Żucie boków języka', 'Rozciąganie powierzchni języka.', '1. Delikatnie żuj brzegi języka zębami przedtrzonowymi.
2. Przesuwaj język, żeby rozciągnąć całą jego powierzchnię.',
       'jezyka'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 45, '😬', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Żucie boków języka' AND category = 'jezyka'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Oblizywanka', 'Ruchomość języka przy zamkniętych ustach.', '1. Zamknij usta.
2. Oblizuj językiem górne zęby po wewnętrznej stronie.',
       'jezyka'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '👅', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Oblizywanka' AND category = 'jezyka'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Szczoteczka', 'Ruchy poziome i pionowe języka.', '1. Otwórz usta.
2. Naśladuj językiem mycie zębów.',
       'jezyka'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🪥', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Szczoteczka' AND category = 'jezyka'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Przyklejony język', 'Utrzymanie pionizacji języka.', '1. Otwórz szeroko usta.
2. Przyklej czubek języka do podniebienia.
3. Przytrzymaj kilka sekund.',
       'jezyka'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 45, '📌', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Przyklejony język' AND category = 'jezyka'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Język w głąb', 'Praca tylnej części języka.', '1. Cofnij język w głąb jamy ustnej.
2. Wróć do pozycji wyjściowej.',
       'jezyka'::public.exercise_category, 'trudne'::public.difficulty_level,
       NULL, 30, '↩️', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Język w głąb' AND category = 'jezyka'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Zlizywanie chrupki', 'Pionizacja i precyzja czubka języka.', '1. Przyklej kawałek chrupki do podniebienia.
2. Zlizuj go czubkiem języka.',
       'jezyka'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 60, '🍿', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Zlizywanie chrupki' AND category = 'jezyka'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Ssanie cukierka', 'Wzmacnianie unoszenia języka.', '1. Ułóż mały cukierek przy podniebieniu.
2. Ssij go czubkiem języka, nie pomagając sobie wargami.',
       'jezyka'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 60, '🍬', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Ssanie cukierka' AND category = 'jezyka'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Mlaskanie', 'Ruchomość środkowej części języka.', '1. Naśladuj mlaskanie.
2. Powtarzaj rytmicznie.',
       'jezyka'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 30, '😋', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Mlaskanie' AND category = 'jezyka'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Śpiewające sylaby', 'Koordynacja języka i głosu.', '1. Wybierz znaną melodię.
2. Zaśpiewaj ją na sylabach: la, lo, le.',
       'jezyka'::public.exercise_category, 'latwe'::public.difficulty_level,
       ARRAY['l'], 60, '🎶', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Śpiewające sylaby' AND category = 'jezyka'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Chomik', 'Siła języka i praca policzków.', '1. Otwórz szeroko usta.
2. Wypychaj językiem raz jeden, raz drugi policzek.',
       'jezyka'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🐹', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Chomik' AND category = 'jezyka'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Motylek', 'Kontrola szerokości języka.', '1. Oprzyj czubek języka na górnej wardze.
2. Rozszerzaj i zwężaj język jak skrzydła motyla.',
       'jezyka'::public.exercise_category, 'trudne'::public.difficulty_level,
       NULL, 45, '🦋', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Motylek' AND category = 'jezyka'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Łopatka', 'Spłaszczanie i rozszerzanie języka.', '1. Wysuń szeroki, płaski język.
2. Utrzymaj go nieruchomo przez kilka sekund.',
       'jezyka'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 30, '🥄', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Łopatka' AND category = 'jezyka'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Łyżeczka', 'Unoszenie boków języka.', '1. Ułóż język w kształt łyżeczki.
2. Unieś przód i boki języka.',
       'jezyka'::public.exercise_category, 'trudne'::public.difficulty_level,
       NULL, 45, '🥣', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Łyżeczka' AND category = 'jezyka'::public.exercise_category
    AND created_by IS NULL
);

-- ── podniebienia ──
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Ciche ziewanie', 'Unoszenie podniebienia bez fonacji.', '1. Ziewaj szeroko.
2. Nie wydawaj przy tym żadnego dźwięku.',
       'podniebienia'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 30, '🤫', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Ciche ziewanie' AND category = 'podniebienia'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Kaszlący miś', 'Zwarcie podniebienno-gardłowe.', '1. Delikatnie pokasłuj: ykhm, ykhm.
2. Powtórz kilka razy, bez wysiłku.',
       'podniebienia'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 30, '🐨', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Kaszlący miś' AND category = 'podniebienia'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Sowa Hu-Hu', 'Przedłużona fonacja przy uniesionym podniebieniu.', '1. Zrób wdech nosem.
2. Powtarzaj wydłużone: huuu, huuu.',
       'podniebienia'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🦉', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Sowa Hu-Hu' AND category = 'podniebienia'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Kukułka Ku-Ku', 'Aktywizacja tylnej części języka i podniebienia.', '1. Powtarzaj: ku-ku, ku-ku.
2. Mów wyraźnie i rytmicznie.',
       'podniebienia'::public.exercise_category, 'latwe'::public.difficulty_level,
       ARRAY['k'], 45, '🐦', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Kukułka Ku-Ku' AND category = 'podniebienia'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Gagatek G', 'Artykulacja głoski G.', '1. Powtarzaj: ga, go, ge, gu, gi, gą, gę.
2. Mów wyraźnie, z lekkim przedłużeniem.',
       'podniebienia'::public.exercise_category, 'srednie'::public.difficulty_level,
       ARRAY['g'], 60, '🗣️', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Gagatek G' AND category = 'podniebienia'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Kotek K', 'Artykulacja głoski K.', '1. Powtarzaj: ka, ko, ke, ku, ki, ką, kę.
2. Mów wyraźnie, z lekkim przedłużeniem.',
       'podniebienia'::public.exercise_category, 'srednie'::public.difficulty_level,
       ARRAY['k'], 60, '🐱', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Kotek K' AND category = 'podniebienia'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Pociąg sylabowy G', 'Utrwalanie G w sylabach zamkniętych.', '1. Powtarzaj: aga, ogo, ege, ugu, ygy.
2. Zachowaj równe tempo.',
       'podniebienia'::public.exercise_category, 'srednie'::public.difficulty_level,
       ARRAY['g'], 60, '🚂', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Pociąg sylabowy G' AND category = 'podniebienia'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Wagoniki K', 'Utrwalanie K w sylabach zamkniętych.', '1. Powtarzaj: aka, oko, eke, uku, yky.
2. Zachowaj równe tempo.',
       'podniebienia'::public.exercise_category, 'srednie'::public.difficulty_level,
       ARRAY['k'], 60, '🚃', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Wagoniki K' AND category = 'podniebienia'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Mostki K', 'Artykulacja K w wygłosie.', '1. Powtarzaj: ak, ok, ek, uk, ik, yk.
2. Wyraźnie kończ każdą sylabę.',
       'podniebienia'::public.exercise_category, 'trudne'::public.difficulty_level,
       ARRAY['k'], 60, '🌉', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Mostki K' AND category = 'podniebienia'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Sylabowe echo', 'Różnicowanie G i K.', '1. Powtarzaj naprzemiennie: ga-ka, go-ko, gu-ku, ge-ke.
2. Słuchaj różnicy między głoskami.',
       'podniebienia'::public.exercise_category, 'trudne'::public.difficulty_level,
       ARRAY['g', 'k'], 60, '🔁', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Sylabowe echo' AND category = 'podniebienia'::public.exercise_category
    AND created_by IS NULL
);

-- ── polykanie ──
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Języczek na górce', 'Pionizacja języka i nauka pozycji spoczynkowej.', '1. Unieś czubek i przednią część języka do wałka dziąsłowego za górnymi zębami.
2. Przyklej język do podniebienia.
3. Utrzymaj pozycję przez kilka sekund.',
       'polykanie'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '⛰️', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Języczek na górce' AND category = 'polykanie'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Cukierek na podniebieniu', 'Wzmacnianie unoszenia języka.', '1. Przytrzymaj językiem przy podniebieniu płatek kukurydziany, chrupkę lub rodzynkę.
2. Staraj się nie pomagać sobie wargami.',
       'polykanie'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 60, '🍬', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Cukierek na podniebieniu' AND category = 'polykanie'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Kląskający konik', 'Doskonalenie pionizacji języka.', '1. Rytmicznie przyklejaj i odklejaj język od podniebienia.
2. Naśladuj odgłos galopującego konia.',
       'polykanie'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🐴', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Kląskający konik' AND category = 'polykanie'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Powolny konik', 'Zwiększanie kontroli ruchów języka.', '1. Kląskaj bardzo wolno i dokładnie.
2. Wyraźnie przyklejaj język do podniebienia.',
       'polykanie'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 60, '🐎', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Powolny konik' AND category = 'polykanie'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Ślina jak profesjonalista', 'Nauka prawidłowego połykania śliny.', '1. Oprzyj język o wałek dziąsłowy.
2. Zęby zostaw lekko złączone, wargi rozluźnione.
3. Przełknij ślinę bez wysuwania języka między zęby.',
       'polykanie'::public.exercise_category, 'trudne'::public.difficulty_level,
       NULL, 45, '💧', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Ślina jak profesjonalista' AND category = 'polykanie'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Magiczna kropelka', 'Utrwalanie właściwego wzorca połykania.', '1. Zgromadź ślinę w ustach.
2. Przyklej język do podniebienia.
3. Dopiero wtedy przełknij.',
       'polykanie'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 45, '✨', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Magiczna kropelka' AND category = 'polykanie'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Zamknięte usta', 'Aktywizacja mięśni żucia podczas połykania.', '1. Zamknij usta i lekko złącz zęby.
2. Przełknij ślinę w tej pozycji.',
       'polykanie'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 30, '🤐', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Zamknięte usta' AND category = 'polykanie'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Łyk po łyku', 'Przeniesienie umiejętności na picie płynów.', '1. Pij wodę małymi łykami.
2. Każdy łyk poprzedź uniesieniem języka do podniebienia.',
       'polykanie'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 60, '🥛', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Łyk po łyku' AND category = 'polykanie'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Zatrzymaj i połknij', 'Świadoma kontrola aktu połykania.', '1. Nabierz niewielki łyk wody.
2. Zatrzymaj go na chwilę w ustach.
3. Ułóż język przy podniebieniu i spokojnie przełknij.',
       'polykanie'::public.exercise_category, 'trudne'::public.difficulty_level,
       NULL, 60, '⏸️', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Zatrzymaj i połknij' AND category = 'polykanie'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Fontanna ze słomki', 'Koordynacja oddychania, języka i połykania.', '1. Pij przez słomkę małymi porcjami.
2. Po każdym łyku wykonaj prawidłowe połknięcie.',
       'polykanie'::public.exercise_category, 'trudne'::public.difficulty_level,
       NULL, 60, '⛲', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Fontanna ze słomki' AND category = 'polykanie'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Król języczek', 'Utrwalanie pozycji języka podczas połykania.', '1. Przyklej czubek języka za górnymi siekaczami.
2. Przez całe ćwiczenie nie zmieniaj tej pozycji.
3. Połykaj ślinę lub niewielkie ilości wody.',
       'polykanie'::public.exercise_category, 'trudne'::public.difficulty_level,
       NULL, 60, '👑', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Król języczek' AND category = 'polykanie'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Ciche połykanie', 'Automatyzacja prawidłowego wzorca.', '1. Wykonaj kilka spokojnych połknięć śliny.
2. Nie poruszaj przy tym wargami, policzkami ani brodą.',
       'polykanie'::public.exercise_category, 'trudne'::public.difficulty_level,
       NULL, 45, '🤫', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Ciche połykanie' AND category = 'polykanie'::public.exercise_category
    AND created_by IS NULL
);

-- ── zuchwa ──
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Ziewający księżyc', 'Znalezienie naturalnego opadu żuchwy.', '1. Obserwuj pierwszą fazę naturalnego ziewania.
2. Zwróć uwagę, jak swobodnie opada żuchwa.
3. Naśladuj ten ruch, wywołując ziewanie.',
       'zuchwa'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🌙', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Ziewający księżyc' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Mądre paluszki', 'Określenie optymalnego otwarcia ust.', '1. Umieść między zębami poziomo palec wskazujący i środkowy lub zgięty kciuk.
2. Zapamiętaj uzyskaną pozycję.',
       'zuchwa'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 30, '✌️', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Mądre paluszki' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Ciche ziewanie', 'Rozluźnienie mięśni żuchwy.', '1. Ziewaj szeroko i spokojnie.
2. Nie wydawaj przy tym głosu.',
       'zuchwa'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 30, '🐻', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Ciche ziewanie' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Wolna winda', 'Zwiększenie zakresu ruchu żuchwy.', '1. Powoli opuszczaj żuchwę jak najniżej.
2. Następnie unoś ją do góry.
3. Zachowaj naturalne ułożenie warg.',
       'zuchwa'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🛗', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Wolna winda' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Szybka winda', 'Usprawnienie tempa ruchu.', '1. Rytmicznie opuszczaj i unoś żuchwę.
2. Stopniowo zwiększaj tempo.',
       'zuchwa'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 45, '⚡', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Szybka winda' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Otwieranie i zamykanie domku', 'Kontrola ruchu otwierania ust.', '1. Szeroko otwórz usta jak przy głosce „a".
2. Zamknij je.
3. Powtarzaj spokojnie.',
       'zuchwa'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🏠', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Otwieranie i zamykanie domku' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Krokodyl', 'Zwiększenie ruchomości stawu skroniowo-żuchwowego.', '1. Szeroko otwórz paszczę jak krokodyl.
2. Zamknij ją zdecydowanym ruchem.',
       'zuchwa'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 30, '🐊', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Krokodyl' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Koparka', 'Nauka prawidłowego opuszczania żuchwy.', '1. Powoli opuszczaj żuchwę maksymalnie w dół, lekko ją cofając.
2. Unieś ją do góry.',
       'zuchwa'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 45, '🚜', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Koparka' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Krówka gryzie', 'Usprawnienie ruchów bocznych.', '1. Naśladuj przeżuwanie trawy przez krowę.
2. Przesuwaj żuchwę raz w lewo, raz w prawo.',
       'zuchwa'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🐄', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Krówka gryzie' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Żujemy gumę', 'Koordynacja ruchów żuchwy.', '1. Zamknij usta.
2. Naśladuj żucie gumy.',
       'zuchwa'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 30, '😋', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Żujemy gumę' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Coraz większa guma', 'Zwiększenie zakresu ruchów.', '1. Wyobraź sobie, że guma staje się coraz większa.
2. Rób żuchwą coraz szersze ruchy.
3. Pilnuj, żeby usta pozostały zamknięte.',
       'zuchwa'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 45, '🎈', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Coraz większa guma' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Ciągliwy cukierek', 'Wzmacnianie mięśni żwaczy.', '1. Żuj wyobrażony, bardzo ciągliwy cukierek.
2. Wargi biorą czynny udział w ćwiczeniu.',
       'zuchwa'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 45, '🍭', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Ciągliwy cukierek' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Małpka', 'Wysuwanie żuchwy do przodu.', '1. Maksymalnie wysuń żuchwę.
2. Delikatnie nagryź dolnymi zębami górną wargę.',
       'zuchwa'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 30, '🐒', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Małpka' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Piła', 'Rozwijanie ruchów wielokierunkowych.', '1. Przesuwaj żuchwę do przodu i do tyłu.
2. Następnie w prawo i w lewo.',
       'zuchwa'::public.exercise_category, 'trudne'::public.difficulty_level,
       NULL, 45, '🪚', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Piła' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Grzebień', 'Usprawnienie wysuwania i cofania żuchwy.', '1. Dolnymi zębami przesuwaj po górnej wardze.
2. Cofnij żuchwę i górnymi zębami przesuwaj po dolnej wardze.',
       'zuchwa'::public.exercise_category, 'trudne'::public.difficulty_level,
       NULL, 45, '🐰', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Grzebień' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Kląskający konik', 'Koordynacja pracy języka i żuchwy.', '1. Kląskaj językiem.
2. Jednocześnie wykonuj swobodny opad żuchwy.',
       'zuchwa'::public.exercise_category, 'trudne'::public.difficulty_level,
       NULL, 45, '🐴', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Kląskający konik' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Broda do szyi', 'Stabilizacja żuchwy i ustawienie głowy.', '1. Oprzyj palec na brodzie.
2. Przyciągaj brodę do krtani, opierając łokieć o klatkę piersiową.',
       'zuchwa'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 45, '🧸', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Broda do szyi' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Nieme sylaby', 'Kontrola ruchów żuchwy podczas mówienia.', '1. Bezgłośnie wymawiaj sylaby: pa, ba, da.
2. Wydłużaj moment otwarcia ust.',
       'zuchwa'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 60, '🦊', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Nieme sylaby' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Zamiatanie podłogi', 'Rozluźnianie napięć mięśniowych.', '1. Pochyl głowę.
2. Wykonuj luźne ruchy ciężką żuchwą, jakby zamiatała podłogę.',
       'zuchwa'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '🧹', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Zamiatanie podłogi' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Zdziwiona mina', 'Połączenie pracy oddechowej i ruchów żuchwy.', '1. Zrób głęboki wdech nosem.
2. Na wydechu przeciągaj „aaa" albo „ooo".',
       'zuchwa'::public.exercise_category, 'latwe'::public.difficulty_level,
       NULL, 45, '😮', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Zdziwiona mina' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);
INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
SELECT 'Warga w pułapce', 'Wzmacnianie mięśni żuchwy i warg.', '1. Nagryzaj dolną wargę górnymi zębami.
2. Rób to możliwie najgłębiej, ale bez bólu.',
       'zuchwa'::public.exercise_category, 'srednie'::public.difficulty_level,
       NULL, 30, '🐻', NULL, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE title = 'Warga w pułapce' AND category = 'zuchwa'::public.exercise_category
    AND created_by IS NULL
);

-- ══════════════════════════════════════════════════════════════
-- PODSUMOWANIE — głośno, zamiast cichego „0 wierszy"
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  publiczne INT;
BEGIN
  SELECT COUNT(*) INTO publiczne
  FROM public.exercises WHERE created_by IS NULL AND archived_at IS NULL;
  RAISE NOTICE 'Ćwiczeń publicznych w obiegu po seedzie: % (oczekiwane co najmniej 92)', publiczne;
END $$;

-- Odśwież cache schematu PostgREST
NOTIFY pgrst, 'reload schema';
