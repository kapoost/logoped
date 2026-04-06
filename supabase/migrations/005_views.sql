-- ============================================================
-- 005_views.sql
-- Widoki upraszczające zapytania frontendowe
-- ============================================================

-- ── Widok: ćwiczenia na dziś dla pacjenta ───────────────────
-- Używany w /today — zwraca ćwiczenia z aktywnego planu
-- z informacją czy już wykonane dziś
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
  ec.completed_at
FROM public.plan_exercises pe
JOIN public.exercise_plans ep  ON ep.id  = pe.plan_id
JOIN public.exercises       e  ON e.id   = pe.exercise_id
LEFT JOIN public.exercise_completions ec
  ON  ec.plan_exercise_id = pe.id
  AND ec.patient_id       = ep.patient_id
  AND ec.session_date     = CURRENT_DATE
WHERE ep.is_active = TRUE
ORDER BY pe.order_index;

-- Uwaga: RLS nie działa na widokach bezpośrednio w Supabase.
-- Frontend filtruje przez .eq('patient_id', userId)
-- lub używamy funkcji z security definer (patrz niżej).

-- ── Widok: podsumowanie tygodniowe pacjenta ─────────────────
CREATE OR REPLACE VIEW public.weekly_summary AS
SELECT
  ec.patient_id,
  ec.session_date,
  COUNT(*)                          AS exercises_done,
  COUNT(DISTINCT pe.plan_id)        AS plans_touched
FROM public.exercise_completions ec
JOIN public.plan_exercises pe ON pe.id = ec.plan_exercise_id
WHERE ec.session_date >= CURRENT_DATE - INTERVAL '6 days'
GROUP BY ec.patient_id, ec.session_date
ORDER BY ec.patient_id, ec.session_date;

-- ── Widok: przegląd pacjentów dla logopedy ──────────────────
CREATE OR REPLACE VIEW public.therapist_patient_overview AS
SELECT
  tp.therapist_id,
  p.id                                           AS patient_id,
  p.full_name,
  p.date_of_birth,
  p.avatar_url,
  ps.current_streak,
  ps.longest_streak,
  ps.total_sessions,
  ps.total_exercises,
  ps.points,
  ps.level,
  ps.last_session_date,
  -- ile dni aktywnych w bieżącym tygodniu (pon–nd)
  COALESCE((
    SELECT COUNT(DISTINCT ec.session_date)
    FROM public.exercise_completions ec
    WHERE ec.patient_id = p.id
      AND ec.session_date >= date_trunc('week', CURRENT_DATE)
      AND ec.session_date <  date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
  ), 0)                                          AS days_active_this_week,
  -- aktywny plan
  ep.id                                          AS active_plan_id,
  ep.name                                        AS active_plan_name,
  -- liczba ćwiczeń w aktywnym planie
  COALESCE((
    SELECT COUNT(*) FROM public.plan_exercises
    WHERE plan_id = ep.id
  ), 0)                                          AS plan_exercise_count
FROM public.therapist_patients tp
JOIN public.profiles          p   ON p.id   = tp.patient_id
LEFT JOIN public.patient_stats  ps  ON ps.patient_id = p.id
LEFT JOIN public.exercise_plans ep  ON ep.patient_id  = p.id
                                   AND ep.therapist_id = tp.therapist_id
                                   AND ep.is_active    = TRUE
ORDER BY ps.last_session_date DESC NULLS LAST;

-- ── Funkcja: kalendarz postępów pacjenta ─────────────────────
-- Zwraca dane do widoku kalendarza (ostatnie N miesięcy)
-- Wywoływana z frontendu jako rpc('get_patient_calendar', {...})
CREATE OR REPLACE FUNCTION public.get_patient_calendar(
  p_patient_id UUID,
  p_months     INT DEFAULT 3
)
RETURNS TABLE (
  session_date      DATE,
  exercises_done    BIGINT,
  plan_exercise_total BIGINT,
  completion_rate   NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.session_date,
    COUNT(ec.id)                          AS exercises_done,
    -- ile ćwiczeń miał zaplanowane tego dnia
    COUNT(pe2.id)                         AS plan_exercise_total,
    ROUND(COUNT(ec.id)::NUMERIC
      / NULLIF(COUNT(pe2.id), 0) * 100, 0) AS completion_rate
  FROM generate_series(
    CURRENT_DATE - (p_months || ' months')::INTERVAL,
    CURRENT_DATE,
    '1 day'::INTERVAL
  ) d(dt)
  -- ćwiczenia wykonane
  LEFT JOIN public.exercise_completions ec
    ON ec.patient_id   = p_patient_id
   AND ec.session_date = d.dt::DATE
  -- ćwiczenia zaplanowane (przez aktywny plan w tamtym dniu)
  LEFT JOIN public.plan_exercises pe2
    ON pe2.plan_id IN (
      SELECT id FROM public.exercise_plans
      WHERE patient_id = p_patient_id
        AND is_active  = TRUE
        AND start_date <= d.dt::DATE
    )
  GROUP BY ec.session_date
  HAVING COUNT(ec.id) > 0   -- tylko dni z aktywnością
  ORDER BY ec.session_date;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
