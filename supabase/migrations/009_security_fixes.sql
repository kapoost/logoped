-- ============================================================
-- 009_security_fixes.sql
-- Naprawa problemów bezpieczeństwa z Supabase Advisor
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 1. Widoki: włącz security_invoker (Postgres 15+)
--    Dzięki temu RLS działa na tabelach bazowych wg. uprawnień
--    użytkownika wywołującego, a nie właściciela widoku.
-- ════════════════════════════════════════════════════════════

ALTER VIEW public.today_exercises SET (security_invoker = on);
ALTER VIEW public.weekly_summary SET (security_invoker = on);
ALTER VIEW public.therapist_patient_overview SET (security_invoker = on);
ALTER VIEW public.therapist_admin_overview SET (security_invoker = on);


-- ════════════════════════════════════════════════════════════
-- 2. Funkcje: ustaw search_path = '' (zabezpieczenie przed
--    search path injection)
-- ════════════════════════════════════════════════════════════

-- set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- current_user_role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- is_therapist_of
CREATE OR REPLACE FUNCTION public.is_therapist_of(p_patient_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.therapist_patients
    WHERE therapist_id = auth.uid()
      AND patient_id   = p_patient_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- update_patient_stats_on_completion
CREATE OR REPLACE FUNCTION public.update_patient_stats_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_last        DATE;
  v_streak      INT;
  v_longest     INT;
  v_total_sess  INT;
  v_total_ex    INT;
  v_points      INT;
  v_level       INT;
  v_pts_earned  INT := 20;
  v_new_points  INT;
  v_new_level   INT;
  v_is_new_day  BOOLEAN;
BEGIN
  SELECT
    last_session_date, current_streak, longest_streak,
    total_sessions, total_exercises, points, level
  INTO
    v_last, v_streak, v_longest, v_total_sess, v_total_ex, v_points, v_level
  FROM public.patient_stats
  WHERE patient_id = NEW.patient_id;

  IF NOT FOUND THEN
    v_streak := 0; v_longest := 0; v_total_sess := 0;
    v_total_ex := 0; v_points := 0; v_level := 1; v_last := NULL;
  END IF;

  v_is_new_day := (v_last IS NULL OR v_last < CURRENT_DATE);

  IF v_last = CURRENT_DATE - INTERVAL '1 day' THEN
    v_streak := v_streak + 1;
  ELSIF v_last = CURRENT_DATE THEN
    v_streak := v_streak;
  ELSE
    v_streak := 1;
  END IF;

  v_longest := GREATEST(v_longest, v_streak);

  IF v_is_new_day THEN
    IF v_streak = 3  THEN v_pts_earned := v_pts_earned + 100; END IF;
    IF v_streak = 7  THEN v_pts_earned := v_pts_earned + 200; END IF;
    IF v_streak = 30 THEN v_pts_earned := v_pts_earned + 500; END IF;
  END IF;

  v_total_ex   := v_total_ex + 1;
  v_total_sess := v_total_sess + (CASE WHEN v_is_new_day THEN 1 ELSE 0 END);

  v_new_points := v_points + v_pts_earned;
  v_new_level := CASE
    WHEN v_new_points >= 10000 THEN 5
    WHEN v_new_points >= 4000  THEN 4
    WHEN v_new_points >= 1500  THEN 3
    WHEN v_new_points >= 500   THEN 2
    ELSE 1
  END;

  INSERT INTO public.patient_stats (
    patient_id, current_streak, longest_streak,
    total_sessions, total_exercises, points, level,
    last_session_date, updated_at
  ) VALUES (
    NEW.patient_id, v_streak, v_longest,
    CASE WHEN v_is_new_day THEN 1 ELSE 0 END,
    1, v_pts_earned, v_new_level,
    CURRENT_DATE, NOW()
  )
  ON CONFLICT (patient_id) DO UPDATE SET
    current_streak    = v_streak,
    longest_streak    = v_longest,
    total_sessions    = public.patient_stats.total_sessions
                        + (CASE WHEN v_is_new_day THEN 1 ELSE 0 END),
    total_exercises   = public.patient_stats.total_exercises + 1,
    points            = public.patient_stats.points + v_pts_earned,
    level             = v_new_level,
    last_session_date = CURRENT_DATE,
    updated_at        = NOW();

  -- Odznaki
  IF v_total_sess = 0 AND v_is_new_day THEN
    INSERT INTO public.achievements (patient_id, badge_key)
    VALUES (NEW.patient_id, 'first_session') ON CONFLICT DO NOTHING;
  END IF;

  IF v_streak = 3 THEN
    INSERT INTO public.achievements (patient_id, badge_key)
    VALUES (NEW.patient_id, 'streak_3') ON CONFLICT DO NOTHING;
  END IF;
  IF v_streak = 7 THEN
    INSERT INTO public.achievements (patient_id, badge_key)
    VALUES (NEW.patient_id, 'streak_7') ON CONFLICT DO NOTHING;
  END IF;
  IF v_streak = 30 THEN
    INSERT INTO public.achievements (patient_id, badge_key)
    VALUES (NEW.patient_id, 'streak_30') ON CONFLICT DO NOTHING;
  END IF;

  IF (v_total_sess + (CASE WHEN v_is_new_day THEN 1 ELSE 0 END)) = 10 THEN
    INSERT INTO public.achievements (patient_id, badge_key)
    VALUES (NEW.patient_id, 'sessions_10') ON CONFLICT DO NOTHING;
  END IF;
  IF (v_total_sess + (CASE WHEN v_is_new_day THEN 1 ELSE 0 END)) = 50 THEN
    INSERT INTO public.achievements (patient_id, badge_key)
    VALUES (NEW.patient_id, 'sessions_50') ON CONFLICT DO NOTHING;
  END IF;

  IF (v_total_ex + 1) = 100 THEN
    INSERT INTO public.achievements (patient_id, badge_key)
    VALUES (NEW.patient_id, 'exercises_100') ON CONFLICT DO NOTHING;
  END IF;

  IF v_new_level = 5 AND v_level < 5 THEN
    INSERT INTO public.achievements (patient_id, badge_key)
    VALUES (NEW.patient_id, 'level_5') ON CONFLICT DO NOTHING;
  END IF;

  PERFORM public.check_all_categories_badge(NEW.patient_id);
  PERFORM public.check_all_badges(NEW.patient_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- check_all_categories_badge
CREATE OR REPLACE FUNCTION public.check_all_categories_badge(p_patient_id UUID)
RETURNS VOID AS $$
DECLARE
  v_categories_done INT;
BEGIN
  SELECT COUNT(DISTINCT e.category)
  INTO v_categories_done
  FROM public.exercise_completions ec
  JOIN public.plan_exercises pe ON pe.id = ec.plan_exercise_id
  JOIN public.exercises e ON e.id = pe.exercise_id
  WHERE ec.patient_id = p_patient_id;

  IF v_categories_done >= 6 THEN
    INSERT INTO public.achievements (patient_id, badge_key)
    VALUES (p_patient_id, 'all_categories') ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- check_all_badges
CREATE OR REPLACE FUNCTION public.check_all_badges(p_patient_id UUID)
RETURNS VOID AS $$
DECLARE
  v_required TEXT[] := ARRAY[
    'first_session','streak_3','streak_7','streak_30',
    'sessions_10','sessions_50','exercises_100',
    'all_categories','level_5'
  ];
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.achievements
  WHERE patient_id = p_patient_id
    AND badge_key = ANY(v_required);

  IF v_count = array_length(v_required, 1) THEN
    INSERT INTO public.achievements (patient_id, badge_key)
    VALUES (p_patient_id, 'all_badges') ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- award_session_bonus
CREATE OR REPLACE FUNCTION public.award_session_bonus()
RETURNS TRIGGER AS $$
DECLARE
  v_total_in_plan INT;
  v_done_today    INT;
  v_plan_id       UUID;
BEGIN
  SELECT pe.plan_id INTO v_plan_id
  FROM public.plan_exercises pe
  WHERE pe.id = NEW.plan_exercise_id;

  SELECT COUNT(*) INTO v_total_in_plan
  FROM public.plan_exercises WHERE plan_id = v_plan_id;

  SELECT COUNT(*) INTO v_done_today
  FROM public.exercise_completions ec
  JOIN public.plan_exercises pe ON pe.id = ec.plan_exercise_id
  WHERE pe.plan_id = v_plan_id
    AND ec.patient_id = NEW.patient_id
    AND ec.session_date = CURRENT_DATE;

  IF v_done_today = v_total_in_plan AND v_total_in_plan > 0 THEN
    UPDATE public.patient_stats
    SET points = points + 50, updated_at = NOW()
    WHERE patient_id = NEW.patient_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- get_patient_calendar
CREATE OR REPLACE FUNCTION public.get_patient_calendar(
  p_patient_id UUID,
  p_months     INT DEFAULT 3
)
RETURNS TABLE (
  session_date        DATE,
  exercises_done      BIGINT,
  plan_exercise_total BIGINT,
  completion_rate     NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.session_date,
    COUNT(ec.id) AS exercises_done,
    COUNT(pe2.id) AS plan_exercise_total,
    ROUND(COUNT(ec.id)::NUMERIC / NULLIF(COUNT(pe2.id), 0) * 100, 0) AS completion_rate
  FROM generate_series(
    CURRENT_DATE - (p_months || ' months')::INTERVAL,
    CURRENT_DATE,
    '1 day'::INTERVAL
  ) d(dt)
  LEFT JOIN public.exercise_completions ec
    ON ec.patient_id = p_patient_id AND ec.session_date = d.dt::DATE
  LEFT JOIN public.plan_exercises pe2
    ON pe2.plan_id IN (
      SELECT id FROM public.exercise_plans
      WHERE patient_id = p_patient_id AND is_active = TRUE AND start_date <= d.dt::DATE
    )
  GROUP BY ec.session_date
  HAVING COUNT(ec.id) > 0
  ORDER BY ec.session_date;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- license_max_patients
CREATE OR REPLACE FUNCTION public.license_max_patients(lt license_type)
RETURNS INT AS $$
  SELECT CASE lt
    WHEN 'trial'     THEN 3
    WHEN 'basic'     THEN 10
    WHEN 'pro'       THEN 30
    WHEN 'unlimited' THEN 9999
    ELSE 3
  END;
$$ LANGUAGE sql IMMUTABLE SET search_path = '';

-- ════════════════════════════════════════════════════════════
-- 3. Przenieś rozszerzenie pg_trgm do schematu extensions
-- ════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION IF EXISTS pg_trgm SET SCHEMA extensions;
