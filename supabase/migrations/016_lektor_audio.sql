-- ============================================================
-- 016_lektor_audio.sql
-- Nagrania lektora w buckecie exercise-media.
--
-- Bucket powstał w 006 z listą MIME ograniczoną do obrazków, więc wysyłka
-- MP3 wracała z 415 invalid_mime_type. Lektor czyta dziecku polecenia
-- krok po kroku i jego nagrania są dokładnie tym samym rodzajem treści co
-- ilustracje ćwiczeń: publiczne, niezmienne, wspólne dla wszystkich
-- pacjentów. Stąd ten sam bucket, te same polityki, a nie nowy byt.
--
-- Nagrania leżą pod lektor/<exercise_id>/<numer_kroku>-<skrót_treści>.mp3.
-- Skrót liczy hashTekstu() z lib/lektor.ts i hash_tekstu() ze skryptu
-- scripts/lektor/generuj.py — ta sama funkcja po obu stronach. Dzięki temu
-- nie ma kolumny w bazie: po edycji polecenia skrót się zmienia, stary plik
-- przestaje pasować, aplikacja dostaje 404 i czyta syntezatorem zamiast
-- odtwarzać dziecku nieaktualną treść.
--
-- Limit 5 MB z 006 zostaje — krok ćwiczenia to kilka sekund mowy, czyli
-- kilkadziesiąt kilobajtów.
-- ============================================================

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'audio/mpeg'
    ]
WHERE id = 'exercise-media';
