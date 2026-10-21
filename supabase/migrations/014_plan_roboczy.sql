-- ============================================================
-- 014_plan_roboczy.sql
-- Rozdzielenie planu roboczego od opublikowanego dziecku.
--
-- Dziś zapis planu jest NATYCHMIAST widoczny dla dziecka — logopeda nie ma
-- jak przygotować planu na spokojnie, bo każda pośrednia wersja trafia
-- od razu na ekran pacjenta. To luka produktowa, nie kosmetyka.
--
-- Bezpieczna do ponownego uruchomienia: ADD COLUMN IF NOT EXISTS,
-- CREATE OR REPLACE VIEW, UPDATE idempotentny.
-- ============================================================

-- ── 1. Kolumna ──────────────────────────────────────────────
ALTER TABLE public.exercise_plans
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

COMMENT ON COLUMN public.exercise_plans.published_at IS
  'Moment udostępnienia planu dziecku. NULL = wersja robocza, widoczna tylko dla logopedy.';

-- ── 2. Backfill — KRYTYCZNY ─────────────────────────────────
-- Wszystkie plany sprzed tej migracji były widoczne dla dzieci, bo takie
-- było dotychczasowe zachowanie. Bez tego kroku każde dziecko straciłoby
-- plan w chwili uruchomienia migracji.
UPDATE public.exercise_plans
   SET published_at = created_at
 WHERE published_at IS NULL;

-- ── 3. Widok pacjenta respektuje publikację ─────────────────
-- Lista kolumn musi zostać co do kolejności i typu, a description_child
-- dalej na końcu — tak jak zostawiła to migracja 013. CREATE OR REPLACE
-- VIEW pozwala dokładać kolumny wyłącznie na końcu.
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
  AND ep.published_at IS NOT NULL      -- wersje robocze nie trafiają do dziecka
ORDER BY pe.order_index;

-- ── 4. Kontrola ─────────────────────────────────────────────
-- opublikowane powinno równać się wszystkim, robocze powinno wynosić 0 —
-- zaraz po migracji nic nie jest jeszcze robocze.
SELECT
  count(*)                                        AS planow_razem,
  count(*) FILTER (WHERE published_at IS NOT NULL) AS opublikowane,
  count(*) FILTER (WHERE published_at IS NULL)     AS robocze
FROM public.exercise_plans;
