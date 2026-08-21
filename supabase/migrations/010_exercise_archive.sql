-- ============================================================
-- 010_exercise_archive.sql
-- Archiwizacja ćwiczeń zamiast kasowania.
--
-- Powód: plan_exercises.exercise_id ma ON DELETE RESTRICT (003_plans.sql),
-- więc ćwiczenia użytego w jakimkolwiek planie NIE DA SIĘ usunąć — baza odrzuci
-- operację. Archiwizacja wycofuje ćwiczenie z obiegu (znika z bazy do wyboru
-- i z kreatora planów), ale wiersz zostaje, więc istniejące plany pacjentów
-- działają dalej bez zmian.
-- ============================================================

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.exercises.archived_at IS
  'NULL = ćwiczenie w obiegu. Data = wycofane; nie pojawia się w bazie ani w kreatorze planów, ale istniejące plany działają dalej.';

-- Listy filtrują po archived_at IS NULL — indeks częściowy obsługuje ten warunek
CREATE INDEX IF NOT EXISTS idx_exercises_active
  ON public.exercises(category, title) WHERE archived_at IS NULL;

-- ── Widok: użycie ćwiczeń w planach ─────────────────────────
-- Odpowiada na pytanie "czy mogę to usunąć na twardo" i zasila licznik w UI.
-- security_invoker = on → liczby respektują RLS pytającego (konwencja z 009).
CREATE OR REPLACE VIEW public.exercise_usage
  WITH (security_invoker = on) AS
SELECT
  e.id                                       AS exercise_id,
  COUNT(pe.id)                               AS plan_count,
  COUNT(pe.id) FILTER (WHERE ep.is_active)   AS active_plan_count,
  COUNT(DISTINCT ep.patient_id)              AS patient_count
FROM public.exercises e
LEFT JOIN public.plan_exercises pe ON pe.exercise_id = e.id
LEFT JOIN public.exercise_plans  ep ON ep.id = pe.plan_id
GROUP BY e.id;

COMMENT ON VIEW public.exercise_usage IS
  'Ile planów używa danego ćwiczenia. plan_count = 0 → można usunąć na twardo, inaczej tylko archiwizacja.';

-- Jawne granty — nie polegamy na default privileges dla nowo tworzonych obiektów
GRANT SELECT ON public.exercise_usage TO authenticated, service_role;

-- Odśwież cache schematu PostgREST (inaczej nowa kolumna/widok dają PGRST205)
NOTIFY pgrst, 'reload schema';
