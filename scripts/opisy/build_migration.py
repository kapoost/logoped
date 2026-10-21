#!/usr/bin/env python3
"""Buduje migrację dodającą opisy pisane do dziecka.

Treść żyje w opisy_dziecka.json, nie w SQL-u — dzięki temu logopeda czyta
i poprawia zwykły plik, a migracja jest z niego generowana. Ponowne
uruchomienie nadpisuje opisy aktualną zawartością JSON-a, więc poprawka
treści to zmiana w jednym miejscu i ponowne puszczenie pliku.

Użycie: python3 scripts/opisy/build_migration.py > supabase/migrations/013_opis_dla_dziecka.sql
"""
import json, os, sys

TUTAJ = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(TUTAJ, 'opisy_dziecka.json'), encoding='utf-8') as f:
    OPISY = {k: v for k, v in json.load(f).items() if not k.startswith('_')}


def sql_str(s):
    return "'" + s.replace("'", "''") + "'"


print("""-- ============================================================
-- 013_opis_dla_dziecka.sql
-- Opis ćwiczenia pisany do dziecka, obok klinicznego dla logopedy.
--
-- Kolumna description zostaje bez zmian — jest pisana rejestrem zawodowym
-- ("Przedłużona fonacja samogłosek") i taka ma pozostać w widokach logopedy
-- i admina. Dziecko dostaje osobne zdanie w description_child.
--
-- Plik jest GENEROWANY z scripts/opisy/opisy_dziecka.json przez
-- scripts/opisy/build_migration.py — nie edytuj go ręcznie, bo poprawki
-- przepadną przy następnym przebudowaniu. Edytuj JSON i przebuduj.
--
-- Bezpieczny do ponownego uruchomienia: ADD COLUMN IF NOT EXISTS,
-- CREATE OR REPLACE VIEW, a UPDATE-y są idempotentne.
--
-- UWAGA przy edycji: ten plik odtwarza widok today_exercises w CAŁOŚCI, więc
-- musi zawierać wszystkie warunki dołożone przez PÓŹNIEJSZE migracje. Dziś
-- jest to bramka publikacji z 014. Pominięcie jej wystawia plany robocze
-- wszystkim dzieciom i nie zgłasza przy tym żadnego błędu.
-- ============================================================

-- ── 1. Kolumna ──────────────────────────────────────────────
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS description_child text;

COMMENT ON COLUMN public.exercises.description_child IS
  'Opis pisany do dziecka, drugą osobą, bez terminologii. NULL = pokaż description.';

-- ── 2. Widok dla ekranu pacjenta ────────────────────────────
-- Nowa kolumna dopisana NA KOŃCU listy — CREATE OR REPLACE VIEW pozwala
-- dokładać kolumny tylko na końcu, kolejność i typy pozostałych muszą się
-- zgadzać co do jednej.
CREATE OR REPLACE VIEW public.today_exercises AS
SELECT
  pe.id                  AS plan_exercise_id,
  pe.plan_id,
  pe.order_index,
  pe.repetitions,
  pe.notes               AS therapist_notes,
  e.id                   AS exercise_id,
  e.title,
  e.description,
  e.instructions,
  e.category,
  e.difficulty,
  e.target_sounds,
  e.media_url,
  e.duration_seconds,
  e.emoji,
  ep.patient_id,
  ep.name                AS plan_name,
  CASE
    WHEN ec.id IS NOT NULL THEN TRUE
    ELSE FALSE
  END                    AS completed_today,
  ec.id                  AS completion_id,
  ec.completed_at,
  e.description_child
FROM public.plan_exercises pe
JOIN public.exercise_plans ep  ON ep.id  = pe.plan_id
JOIN public.exercises       e  ON e.id   = pe.exercise_id
LEFT JOIN public.exercise_completions ec
  ON  ec.plan_exercise_id = pe.id
  AND ec.patient_id       = ep.patient_id
  AND ec.session_date     = CURRENT_DATE
WHERE ep.is_active = TRUE
  AND ep.published_at IS NOT NULL      -- bramka z migracji 014
ORDER BY pe.order_index;

-- ── 3. Treść ────────────────────────────────────────────────
-- Dopasowanie po kategorii i tytule, wyłącznie dla bazy publicznej
-- (created_by IS NULL). Ćwiczeń tworzonych przez logopedów nie ruszamy —
-- to ich treść, nie nasza.""")

print(f"-- Opisów do wgrania: {len(OPISY)}\n")

for klucz in sorted(OPISY):
    kategoria, tytul = klucz.split('/', 1)
    print(f"UPDATE public.exercises SET description_child = {sql_str(OPISY[klucz])}")
    print(f"  WHERE category = {sql_str(kategoria)} AND title = {sql_str(tytul)}")
    print( "    AND created_by IS NULL;")

print("""
-- ── 4. Kontrola ─────────────────────────────────────────────
-- Po uruchomieniu powinno pokazać tyle samo, ile mówi nagłówek wyżej.
SELECT count(*) AS z_opisem_dla_dziecka
FROM public.exercises
WHERE description_child IS NOT NULL AND archived_at IS NULL;""")
