-- ============================================================
-- LOGOPED — pełna migracja od zera
-- Wersja: 2026-04-22 (z poprawkami bezpieczeństwa)
--
-- Użycie: uruchom w SQL Editor nowego projektu Supabase
-- Po migracji uruchom seed.sql i demo_seed.sql
-- ============================================================

-- ── Schemat extensions ─────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- ════════════════════════════════════════════════════════════
-- 001 — Profile użytkowników + relacja logopeda↔pacjent
-- ════════════════════════════════════════════════════════════

CREATE TABLE public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role           TEXT NOT NULL CHECK (role IN ('admin', 'therapist', 'patient')),
  full_name      TEXT NOT NULL,
  avatar_url     TEXT,
  parent_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  date_of_birth  DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatyczny updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: utwórz profil po rejestracji auth.users
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

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Relacja logopeda ↔ pacjent
CREATE TABLE public.therapist_patients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes         TEXT,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (therapist_id, patient_id)
);

-- RLS
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_patients ENABLE ROW LEVEL SECURITY;

-- Helper: rola aktualnego użytkownika
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- Helper: czy logopeda jest przypisany do pacjenta
CREATE OR REPLACE FUNCTION public.is_therapist_of(p_patient_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.therapist_patients
    WHERE therapist_id = auth.uid()
      AND patient_id   = p_patient_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- Polityki profiles
CREATE POLICY "profiles: własny profil"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles: logopeda widzi pacjentów"
  ON public.profiles FOR SELECT
  USING (public.is_therapist_of(id));

CREATE POLICY "profiles: admin widzi wszystko"
  ON public.profiles FOR SELECT
  USING (public.current_user_role() = 'admin');

CREATE POLICY "profiles: własna aktualizacja"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles: admin aktualizuje"
  ON public.profiles FOR UPDATE
  USING (public.current_user_role() = 'admin');

-- Polityki therapist_patients
CREATE POLICY "tp: logopeda widzi swoje"
  ON public.therapist_patients FOR SELECT
  USING (therapist_id = auth.uid());

CREATE POLICY "tp: logopeda dodaje"
  ON public.therapist_patients FOR INSERT
  WITH CHECK (
    therapist_id = auth.uid()
    AND public.current_user_role() = 'therapist'
  );

CREATE POLICY "tp: logopeda usuwa"
  ON public.therapist_patients FOR DELETE
  USING (therapist_id = auth.uid());

CREATE POLICY "tp: admin pełny dostęp"
  ON public.therapist_patients FOR ALL
  USING (public.current_user_role() = 'admin');

CREATE POLICY "tp: pacjent widzi swojego logopedę"
  ON public.therapist_patients FOR SELECT
  USING (patient_id = auth.uid());

-- ════════════════════════════════════════════════════════════
-- 002 — Baza ćwiczeń logopedycznych
-- ════════════════════════════════════════════════════════════

CREATE TYPE public.exercise_category AS ENUM (
  'oddechowe', 'warg', 'jezyka', 'artykulacyjne', 'podniebienia', 'sluchowe'
);

CREATE TYPE public.difficulty_level AS ENUM ('latwe', 'srednie', 'trudne');

CREATE TABLE public.exercises (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT        NOT NULL,
  description      TEXT,
  instructions     TEXT        NOT NULL,
  category         public.exercise_category NOT NULL,
  difficulty       public.difficulty_level  NOT NULL DEFAULT 'latwe',
  target_sounds    TEXT[],
  media_url        TEXT,
  duration_seconds INT         NOT NULL DEFAULT 60,
  emoji            TEXT        NOT NULL DEFAULT '👅',
  created_by       UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_public        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_exercises_category   ON public.exercises(category);
CREATE INDEX idx_exercises_difficulty ON public.exercises(difficulty);
CREATE INDEX idx_exercises_public     ON public.exercises(is_public);
CREATE INDEX idx_exercises_created_by ON public.exercises(created_by);
CREATE INDEX idx_exercises_sounds     ON public.exercises USING GIN(target_sounds);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercises: publiczne dla wszystkich"
  ON public.exercises FOR SELECT
  USING (is_public = TRUE AND auth.uid() IS NOT NULL);

CREATE POLICY "exercises: własne prywatne"
  ON public.exercises FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "exercises: tworzenie przez logopedę"
  ON public.exercises FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.current_user_role() IN ('therapist', 'admin')
    AND created_by = auth.uid()
  );

CREATE POLICY "exercises: edycja własnych"
  ON public.exercises FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "exercises: usuwanie własnych"
  ON public.exercises FOR DELETE
  USING (created_by = auth.uid());

CREATE POLICY "exercises: admin pełny dostęp"
  ON public.exercises FOR ALL
  USING (public.current_user_role() = 'admin');

-- ════════════════════════════════════════════════════════════
-- 003 — Plany ćwiczeń
-- ════════════════════════════════════════════════════════════

CREATE TABLE public.exercise_plans (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  description   TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  start_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_exercise_plans_updated_at
  BEFORE UPDATE ON public.exercise_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_plans_patient    ON public.exercise_plans(patient_id);
CREATE INDEX idx_plans_therapist  ON public.exercise_plans(therapist_id);
CREATE INDEX idx_plans_active     ON public.exercise_plans(is_active);

CREATE TABLE public.plan_exercises (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id       UUID    NOT NULL REFERENCES public.exercise_plans(id) ON DELETE CASCADE,
  exercise_id   UUID    NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  order_index   INT     NOT NULL DEFAULT 0,
  repetitions   INT     NOT NULL DEFAULT 5 CHECK (repetitions BETWEEN 1 AND 50),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plan_exercises_plan     ON public.plan_exercises(plan_id);
CREATE INDEX idx_plan_exercises_exercise ON public.plan_exercises(exercise_id);

CREATE TABLE public.schedules (
  id             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id        UUID      NOT NULL REFERENCES public.exercise_plans(id) ON DELETE CASCADE,
  days_of_week   INT[]     NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6],
  reminder_time  TIME      NOT NULL DEFAULT '18:00',
  is_active      BOOLEAN   NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_days CHECK (
    array_length(days_of_week, 1) BETWEEN 1 AND 7
    AND days_of_week <@ ARRAY[0,1,2,3,4,5,6]
  )
);

CREATE INDEX idx_schedules_plan ON public.schedules(plan_id);

ALTER TABLE public.exercise_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_exercises  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans: logopeda widzi swoje"
  ON public.exercise_plans FOR SELECT
  USING (therapist_id = auth.uid());

CREATE POLICY "plans: pacjent widzi swoje"
  ON public.exercise_plans FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "plans: logopeda tworzy"
  ON public.exercise_plans FOR INSERT
  WITH CHECK (
    therapist_id = auth.uid()
    AND public.current_user_role() = 'therapist'
    AND public.is_therapist_of(patient_id)
  );

CREATE POLICY "plans: logopeda edytuje swoje"
  ON public.exercise_plans FOR UPDATE
  USING (therapist_id = auth.uid());

CREATE POLICY "plans: logopeda usuwa swoje"
  ON public.exercise_plans FOR DELETE
  USING (therapist_id = auth.uid());

CREATE POLICY "plans: admin pełny dostęp"
  ON public.exercise_plans FOR ALL
  USING (public.current_user_role() = 'admin');

CREATE POLICY "plan_ex: logopeda widzi swoje plany"
  ON public.plan_exercises FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exercise_plans p
    WHERE p.id = plan_id AND p.therapist_id = auth.uid()
  ));

CREATE POLICY "plan_ex: pacjent widzi swoje ćwiczenia"
  ON public.plan_exercises FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exercise_plans p
    WHERE p.id = plan_id AND p.patient_id = auth.uid()
  ));

CREATE POLICY "plan_ex: logopeda zarządza"
  ON public.plan_exercises FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.exercise_plans p
    WHERE p.id = plan_id AND p.therapist_id = auth.uid()
  ));

CREATE POLICY "plan_ex: admin pełny dostęp"
  ON public.plan_exercises FOR ALL
  USING (public.current_user_role() = 'admin');

CREATE POLICY "schedules: logopeda zarządza swoimi"
  ON public.schedules FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.exercise_plans p
    WHERE p.id = plan_id AND p.therapist_id = auth.uid()
  ));

CREATE POLICY "schedules: pacjent widzi swoje"
  ON public.schedules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exercise_plans p
    WHERE p.id = plan_id AND p.patient_id = auth.uid()
  ));

CREATE POLICY "schedules: admin pełny dostęp"
  ON public.schedules FOR ALL
  USING (public.current_user_role() = 'admin');

-- ════════════════════════════════════════════════════════════
-- 004 — Wykonania ćwiczeń + gamifikacja
-- ════════════════════════════════════════════════════════════

CREATE TABLE public.exercise_completions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_exercise_id  UUID        NOT NULL REFERENCES public.plan_exercises(id) ON DELETE CASCADE,
  session_date      DATE        NOT NULL DEFAULT CURRENT_DATE,
  completed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recording_url     TEXT,
  therapist_ok      BOOLEAN,
  therapist_note    TEXT,
  reviewed_at       TIMESTAMPTZ,
  UNIQUE (patient_id, plan_exercise_id, session_date)
);

CREATE INDEX idx_completions_patient      ON public.exercise_completions(patient_id);
CREATE INDEX idx_completions_date         ON public.exercise_completions(session_date DESC);
CREATE INDEX idx_completions_plan_ex      ON public.exercise_completions(plan_exercise_id);
CREATE INDEX idx_completions_patient_date ON public.exercise_completions(patient_id, session_date DESC);

CREATE TABLE public.patient_stats (
  patient_id        UUID    PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak    INT     NOT NULL DEFAULT 0,
  longest_streak    INT     NOT NULL DEFAULT 0,
  total_sessions    INT     NOT NULL DEFAULT 0,
  total_exercises   INT     NOT NULL DEFAULT 0,
  points            INT     NOT NULL DEFAULT 0,
  level             INT     NOT NULL DEFAULT 1,
  last_session_date DATE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.achievements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_key   TEXT        NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (patient_id, badge_key)
);

CREATE INDEX idx_achievements_patient ON public.achievements(patient_id);

CREATE TABLE public.push_subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint    TEXT        NOT NULL UNIQUE,
  p256dh      TEXT        NOT NULL,
  auth        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_patient ON public.push_subscriptions(patient_id);

ALTER TABLE public.exercise_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_stats        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "completions: pacjent widzi i tworzy swoje"
  ON public.exercise_completions FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "completions: pacjent dodaje"
  ON public.exercise_completions FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "completions: logopeda widzi pacjentów"
  ON public.exercise_completions FOR SELECT
  USING (public.is_therapist_of(patient_id));

CREATE POLICY "completions: logopeda zatwierdza"
  ON public.exercise_completions FOR UPDATE
  USING (public.is_therapist_of(patient_id));

CREATE POLICY "completions: admin pełny dostęp"
  ON public.exercise_completions FOR ALL
  USING (public.current_user_role() = 'admin');

CREATE POLICY "stats: pacjent widzi swoje"
  ON public.patient_stats FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "stats: logopeda widzi pacjentów"
  ON public.patient_stats FOR SELECT
  USING (public.is_therapist_of(patient_id));

CREATE POLICY "stats: admin widzi wszystko"
  ON public.patient_stats FOR SELECT
  USING (public.current_user_role() = 'admin');

CREATE POLICY "achievements: pacjent widzi swoje"
  ON public.achievements FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "achievements: logopeda widzi pacjentów"
  ON public.achievements FOR SELECT
  USING (public.is_therapist_of(patient_id));

CREATE POLICY "push: własne"
  ON public.push_subscriptions FOR ALL
  USING (patient_id = auth.uid());

-- Trigger: aktualizacja statystyk po wykonaniu ćwiczenia
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
  SELECT last_session_date, current_streak, longest_streak,
    total_sessions, total_exercises, points, level
  INTO v_last, v_streak, v_longest, v_total_sess, v_total_ex, v_points, v_level
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

CREATE TRIGGER trg_completion_stats
  AFTER INSERT ON public.exercise_completions
  FOR EACH ROW EXECUTE FUNCTION public.update_patient_stats_on_completion();

-- Bonus za ukończoną całą sesję (+50 pkt)
CREATE OR REPLACE FUNCTION public.award_session_bonus()
RETURNS TRIGGER AS $$
DECLARE
  v_total_in_plan INT;
  v_done_today    INT;
  v_plan_id       UUID;
BEGIN
  SELECT pe.plan_id INTO v_plan_id
  FROM public.plan_exercises pe WHERE pe.id = NEW.plan_exercise_id;

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

CREATE TRIGGER trg_session_bonus
  AFTER INSERT ON public.exercise_completions
  FOR EACH ROW EXECUTE FUNCTION public.award_session_bonus();

-- ════════════════════════════════════════════════════════════
-- 005 — Widoki (z security_invoker = on)
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.today_exercises
  WITH (security_invoker = on) AS
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
  CASE WHEN ec.id IS NOT NULL THEN TRUE ELSE FALSE END AS completed_today,
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

CREATE OR REPLACE VIEW public.weekly_summary
  WITH (security_invoker = on) AS
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

CREATE OR REPLACE VIEW public.therapist_patient_overview
  WITH (security_invoker = on) AS
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
  COALESCE((
    SELECT COUNT(DISTINCT ec.session_date)
    FROM public.exercise_completions ec
    WHERE ec.patient_id = p.id
      AND ec.session_date >= date_trunc('week', CURRENT_DATE)
      AND ec.session_date <  date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
  ), 0)                                          AS days_active_this_week,
  ep.id                                          AS active_plan_id,
  ep.name                                        AS active_plan_name,
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

-- Funkcja: kalendarz postępów pacjenta
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
    COUNT(pe2.id)                         AS plan_exercise_total,
    ROUND(COUNT(ec.id)::NUMERIC
      / NULLIF(COUNT(pe2.id), 0) * 100, 0) AS completion_rate
  FROM generate_series(
    CURRENT_DATE - (p_months || ' months')::INTERVAL,
    CURRENT_DATE,
    '1 day'::INTERVAL
  ) d(dt)
  LEFT JOIN public.exercise_completions ec
    ON ec.patient_id   = p_patient_id
   AND ec.session_date = d.dt::DATE
  LEFT JOIN public.plan_exercises pe2
    ON pe2.plan_id IN (
      SELECT id FROM public.exercise_plans
      WHERE patient_id = p_patient_id
        AND is_active  = TRUE
        AND start_date <= d.dt::DATE
    )
  GROUP BY ec.session_date
  HAVING COUNT(ec.id) > 0
  ORDER BY ec.session_date;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- ════════════════════════════════════════════════════════════
-- 006 — Storage
-- ════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('exercise-media', 'exercise-media', true, 5242880,
   ARRAY['image/jpeg','image/png','image/gif','image/webp']),
  ('avatars', 'avatars', false, 2097152,
   ARRAY['image/jpeg','image/png','image/webp']),
  ('recordings', 'recordings', false, 104857600,
   ARRAY['audio/webm','audio/ogg','audio/mp4','video/webm','video/mp4'])
ON CONFLICT (id) DO NOTHING;

-- exercise-media: authenticated read (nie broad anon listing)
CREATE POLICY "exercise-media: publiczny odczyt pliku"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'exercise-media');

CREATE POLICY "exercise-media: admin pisze"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exercise-media'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'therapist')
  );

CREATE POLICY "exercise-media: admin usuwa"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'exercise-media'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- avatars
CREATE POLICY "avatars: własny odczyt"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "avatars: własny zapis"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "avatars: własne usuwanie"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

-- recordings
CREATE POLICY "recordings: pacjent wgrywa"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recordings' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "recordings: pacjent widzi swoje"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recordings' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "recordings: logopeda widzi pacjentów"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'recordings'
    AND EXISTS (
      SELECT 1 FROM public.therapist_patients tp
      WHERE tp.therapist_id = auth.uid()
        AND tp.patient_id   = ((storage.foldername(name))[1])::UUID
    )
  );

-- ════════════════════════════════════════════════════════════
-- 007 — Licencje
-- ════════════════════════════════════════════════════════════

CREATE TYPE license_type AS ENUM ('trial', 'basic', 'pro', 'unlimited');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS license_type       license_type DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS license_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  ADD COLUMN IF NOT EXISTS max_patients       INT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS is_blocked         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS block_reason       TEXT,
  ADD COLUMN IF NOT EXISTS notes              TEXT,
  ADD COLUMN IF NOT EXISTS phone              TEXT,
  ADD COLUMN IF NOT EXISTS organization       TEXT;

CREATE OR REPLACE VIEW public.therapist_admin_overview
  WITH (security_invoker = on) AS
SELECT
  p.id,
  p.full_name,
  p.avatar_url,
  p.created_at,
  p.license_type,
  p.license_expires_at,
  p.max_patients,
  p.is_blocked,
  p.block_reason,
  p.notes,
  p.phone,
  p.organization,
  u.email,
  u.last_sign_in_at,
  u.email_confirmed_at,
  COUNT(DISTINCT tp.patient_id)::INT                             AS patient_count,
  COUNT(DISTINCT ep.id) FILTER (WHERE ep.is_active = TRUE)::INT AS active_plans,
  COUNT(DISTINCT ec.id) FILTER (
    WHERE ec.completed_at > NOW() - INTERVAL '30 days'
  )::INT AS sessions_last_30d,
  (p.license_expires_at IS NOT NULL AND p.license_expires_at < NOW()) AS license_expired,
  EXTRACT(DAY FROM p.license_expires_at - NOW())::INT            AS license_days_left
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN public.therapist_patients tp ON tp.therapist_id = p.id
LEFT JOIN public.exercise_plans ep ON ep.therapist_id = p.id
LEFT JOIN public.exercise_completions ec ON ec.patient_id = tp.patient_id
WHERE p.role = 'therapist'
GROUP BY p.id, u.email, u.last_sign_in_at, u.email_confirmed_at;

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
