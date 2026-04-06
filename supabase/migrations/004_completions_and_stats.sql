-- ============================================================
-- 004_completions_and_stats.sql
-- Wykonania ćwiczeń + gamifikacja (statystyki, odznaki)
-- ============================================================

-- ── Wykonania ćwiczeń ────────────────────────────────────────
CREATE TABLE public.exercise_completions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_exercise_id  UUID        NOT NULL REFERENCES public.plan_exercises(id) ON DELETE CASCADE,
  session_date      DATE        NOT NULL DEFAULT CURRENT_DATE,
  completed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- v2: nagranie audio/wideo
  recording_url     TEXT,
  -- v2: logopeda potwierdził poprawność wykonania
  therapist_ok      BOOLEAN,
  therapist_note    TEXT,
  reviewed_at       TIMESTAMPTZ,
  -- Jedno wykonanie na dzień na jedno ćwiczenie w planie
  UNIQUE (patient_id, plan_exercise_id, session_date)
);

CREATE INDEX idx_completions_patient      ON public.exercise_completions(patient_id);
CREATE INDEX idx_completions_date         ON public.exercise_completions(session_date DESC);
CREATE INDEX idx_completions_plan_ex      ON public.exercise_completions(plan_exercise_id);
CREATE INDEX idx_completions_patient_date ON public.exercise_completions(patient_id, session_date DESC);

-- ── Statystyki pacjenta (gamifikacja) ────────────────────────
-- Aktualizowane automatycznie triggerem po każdym INSERT do completions
CREATE TABLE public.patient_stats (
  patient_id        UUID    PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak    INT     NOT NULL DEFAULT 0,
  longest_streak    INT     NOT NULL DEFAULT 0,
  total_sessions    INT     NOT NULL DEFAULT 0,  -- ile dni z sesjami
  total_exercises   INT     NOT NULL DEFAULT 0,  -- łączna liczba wykonań
  points            INT     NOT NULL DEFAULT 0,
  level             INT     NOT NULL DEFAULT 1,
  last_session_date DATE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Odznaki ─────────────────────────────────────────────────
CREATE TABLE public.achievements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_key   TEXT        NOT NULL,
  -- Klucze: first_session, streak_3, streak_7, streak_30,
  --         sessions_10, sessions_50, exercises_100,
  --         all_categories, all_badges, level_5
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (patient_id, badge_key)
);

CREATE INDEX idx_achievements_patient ON public.achievements(patient_id);

-- ── Push subscriptions ───────────────────────────────────────
CREATE TABLE public.push_subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint    TEXT        NOT NULL UNIQUE,
  p256dh      TEXT        NOT NULL,
  auth        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_patient ON public.push_subscriptions(patient_id);

-- ── Row-Level Security ───────────────────────────────────────
ALTER TABLE public.exercise_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_stats        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions   ENABLE ROW LEVEL SECURITY;

-- completions
CREATE POLICY "completions: pacjent widzi i tworzy swoje"
  ON public.exercise_completions FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "completions: pacjent dodaje"
  ON public.exercise_completions FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "completions: logopeda widzi pacjentów"
  ON public.exercise_completions FOR SELECT
  USING (public.is_therapist_of(patient_id));

-- Logopeda może zaktualizować therapist_ok / therapist_note (v2)
CREATE POLICY "completions: logopeda zatwierdza"
  ON public.exercise_completions FOR UPDATE
  USING (public.is_therapist_of(patient_id));

CREATE POLICY "completions: admin pełny dostęp"
  ON public.exercise_completions FOR ALL
  USING (public.current_user_role() = 'admin');

-- patient_stats
CREATE POLICY "stats: pacjent widzi swoje"
  ON public.patient_stats FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "stats: logopeda widzi pacjentów"
  ON public.patient_stats FOR SELECT
  USING (public.is_therapist_of(patient_id));

CREATE POLICY "stats: admin widzi wszystko"
  ON public.patient_stats FOR SELECT
  USING (public.current_user_role() = 'admin');

-- achievements
CREATE POLICY "achievements: pacjent widzi swoje"
  ON public.achievements FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "achievements: logopeda widzi pacjentów"
  ON public.achievements FOR SELECT
  USING (public.is_therapist_of(patient_id));

-- push_subscriptions
CREATE POLICY "push: własne"
  ON public.push_subscriptions FOR ALL
  USING (patient_id = auth.uid());

-- ============================================================
-- TRIGGER: aktualizacja statystyk i przyznawanie odznak
-- uruchamiany po każdym INSERT do exercise_completions
-- ============================================================
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
  v_pts_earned  INT := 20;   -- punkty bazowe za jedno ćwiczenie
  v_new_points  INT;
  v_new_level   INT;
  v_is_new_day  BOOLEAN;
BEGIN
  -- Pobierz aktualne statystyki (mogą nie istnieć — nowy pacjent)
  SELECT
    last_session_date,
    current_streak,
    longest_streak,
    total_sessions,
    total_exercises,
    points,
    level
  INTO
    v_last, v_streak, v_longest, v_total_sess, v_total_ex, v_points, v_level
  FROM public.patient_stats
  WHERE patient_id = NEW.patient_id;

  -- Inicjalizacja dla nowego pacjenta
  IF NOT FOUND THEN
    v_streak     := 0;
    v_longest    := 0;
    v_total_sess := 0;
    v_total_ex   := 0;
    v_points     := 0;
    v_level      := 1;
    v_last       := NULL;
  END IF;

  -- ── Oblicz serię ─────────────────────────────────────────
  v_is_new_day := (v_last IS NULL OR v_last < CURRENT_DATE);

  IF v_last = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Ciągła seria
    v_streak := v_streak + 1;
  ELSIF v_last = CURRENT_DATE THEN
    -- Już dziś ćwiczył — seria bez zmian
    v_streak := v_streak;
  ELSE
    -- Przerwa lub pierwsze ćwiczenie — restart serii
    v_streak := 1;
  END IF;

  v_longest := GREATEST(v_longest, v_streak);

  -- ── Bonusy za serię ──────────────────────────────────────
  IF v_is_new_day THEN
    IF v_streak = 3  THEN v_pts_earned := v_pts_earned + 100; END IF;
    IF v_streak = 7  THEN v_pts_earned := v_pts_earned + 200; END IF;
    IF v_streak = 30 THEN v_pts_earned := v_pts_earned + 500; END IF;
  END IF;

  -- ── Zlicz statystyki ─────────────────────────────────────
  v_total_ex   := v_total_ex + 1;
  v_total_sess := v_total_sess + (CASE WHEN v_is_new_day THEN 1 ELSE 0 END);

  -- ── Oblicz nowe punkty i poziom ──────────────────────────
  v_new_points := v_points + v_pts_earned;

  v_new_level := CASE
    WHEN v_new_points >= 10000 THEN 5  -- Mistrz Mowy 🏆
    WHEN v_new_points >= 4000  THEN 4  -- Mistrz Słowa 🏅
    WHEN v_new_points >= 1500  THEN 3  -- Gadałka 🗣️
    WHEN v_new_points >= 500   THEN 2  -- Uczniaczek 📚
    ELSE                            1  -- Maluszek 🐣
  END;

  -- ── Upsert statystyk ─────────────────────────────────────
  INSERT INTO public.patient_stats (
    patient_id, current_streak, longest_streak,
    total_sessions, total_exercises, points, level,
    last_session_date, updated_at
  )
  VALUES (
    NEW.patient_id, v_streak, v_longest,
    CASE WHEN v_is_new_day THEN 1 ELSE 0 END,
    1, v_pts_earned, v_new_level,
    CURRENT_DATE, NOW()
  )
  ON CONFLICT (patient_id) DO UPDATE SET
    current_streak    = v_streak,
    longest_streak    = v_longest,
    total_sessions    = patient_stats.total_sessions
                        + (CASE WHEN v_is_new_day THEN 1 ELSE 0 END),
    total_exercises   = patient_stats.total_exercises + 1,
    points            = patient_stats.points + v_pts_earned,
    level             = v_new_level,
    last_session_date = CURRENT_DATE,
    updated_at        = NOW();

  -- ── Przyznaj odznaki ─────────────────────────────────────
  -- Używamy INSERT ... ON CONFLICT DO NOTHING żeby nie duplikować

  -- Pierwsza sesja
  IF v_total_sess = 0 AND v_is_new_day THEN
    INSERT INTO public.achievements (patient_id, badge_key)
    VALUES (NEW.patient_id, 'first_session')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Serie
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

  -- Liczba sesji
  IF (v_total_sess + (CASE WHEN v_is_new_day THEN 1 ELSE 0 END)) = 10 THEN
    INSERT INTO public.achievements (patient_id, badge_key)
    VALUES (NEW.patient_id, 'sessions_10') ON CONFLICT DO NOTHING;
  END IF;
  IF (v_total_sess + (CASE WHEN v_is_new_day THEN 1 ELSE 0 END)) = 50 THEN
    INSERT INTO public.achievements (patient_id, badge_key)
    VALUES (NEW.patient_id, 'sessions_50') ON CONFLICT DO NOTHING;
  END IF;

  -- 100 ćwiczeń
  IF (v_total_ex + 1) = 100 THEN
    INSERT INTO public.achievements (patient_id, badge_key)
    VALUES (NEW.patient_id, 'exercises_100') ON CONFLICT DO NOTHING;
  END IF;

  -- Poziom 5
  IF v_new_level = 5 AND v_level < 5 THEN
    INSERT INTO public.achievements (patient_id, badge_key)
    VALUES (NEW.patient_id, 'level_5') ON CONFLICT DO NOTHING;
  END IF;

  -- Wszystkie kategorie — sprawdzamy asynchronicznie przez osobną funkcję
  PERFORM public.check_all_categories_badge(NEW.patient_id);

  -- Wszystkie odznaki (musi być ostatnie)
  PERFORM public.check_all_badges(NEW.patient_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Helper: odznaka "wszystkie kategorie" ────────────────────
CREATE OR REPLACE FUNCTION public.check_all_categories_badge(p_patient_id UUID)
RETURNS VOID AS $$
DECLARE
  v_categories_done INT;
BEGIN
  SELECT COUNT(DISTINCT e.category)
  INTO v_categories_done
  FROM public.exercise_completions ec
  JOIN public.plan_exercises        pe ON pe.id = ec.plan_exercise_id
  JOIN public.exercises              e ON e.id  = pe.exercise_id
  WHERE ec.patient_id = p_patient_id;

  IF v_categories_done >= 6 THEN
    INSERT INTO public.achievements (patient_id, badge_key)
    VALUES (p_patient_id, 'all_categories')
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Helper: odznaka "wszystkie odznaki" ──────────────────────
CREATE OR REPLACE FUNCTION public.check_all_badges(p_patient_id UUID)
RETURNS VOID AS $$
DECLARE
  -- wszystkie odznaki poza 'all_badges' (ta przyznawana tu)
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
    VALUES (p_patient_id, 'all_badges')
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Podpięcie triggera ───────────────────────────────────────
CREATE TRIGGER trg_completion_stats
  AFTER INSERT ON public.exercise_completions
  FOR EACH ROW EXECUTE FUNCTION public.update_patient_stats_on_completion();

-- ── Trigger: bonus za ukończoną całą sesję ──────────────────
-- Przyznaje +50 pkt gdy pacjent ukończy WSZYSTKIE ćwiczenia z planu danego dnia
CREATE OR REPLACE FUNCTION public.award_session_bonus()
RETURNS TRIGGER AS $$
DECLARE
  v_total_in_plan     INT;
  v_done_today        INT;
  v_plan_id           UUID;
BEGIN
  -- Znajdź plan_id przez plan_exercise
  SELECT pe.plan_id INTO v_plan_id
  FROM public.plan_exercises pe
  WHERE pe.id = NEW.plan_exercise_id;

  -- Policz ile ćwiczeń jest w planie łącznie
  SELECT COUNT(*) INTO v_total_in_plan
  FROM public.plan_exercises
  WHERE plan_id = v_plan_id;

  -- Policz ile ukończono dziś dla tego planu
  SELECT COUNT(*) INTO v_done_today
  FROM public.exercise_completions ec
  JOIN public.plan_exercises pe ON pe.id = ec.plan_exercise_id
  WHERE pe.plan_id  = v_plan_id
    AND ec.patient_id = NEW.patient_id
    AND ec.session_date = CURRENT_DATE;

  -- Jeśli właśnie ukończono ostatnie ćwiczenie — przyznaj bonus
  IF v_done_today = v_total_in_plan AND v_total_in_plan > 0 THEN
    UPDATE public.patient_stats
    SET points     = points + 50,
        updated_at = NOW()
    WHERE patient_id = NEW.patient_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_session_bonus
  AFTER INSERT ON public.exercise_completions
  FOR EACH ROW EXECUTE FUNCTION public.award_session_bonus();
