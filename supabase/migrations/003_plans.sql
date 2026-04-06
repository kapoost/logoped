-- ============================================================
-- 003_plans.sql
-- Plany ćwiczeń przydzielane pacjentom przez logopedę
-- ============================================================

-- ── Plany ćwiczeń ────────────────────────────────────────────
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

-- ── Ćwiczenia w planie ──────────────────────────────────────
-- Każde przypisanie ćwiczenia do planu — z opcjonalnymi wskazówkami logopedy
CREATE TABLE public.plan_exercises (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id       UUID    NOT NULL REFERENCES public.exercise_plans(id) ON DELETE CASCADE,
  exercise_id   UUID    NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  order_index   INT     NOT NULL DEFAULT 0,
  repetitions   INT     NOT NULL DEFAULT 5 CHECK (repetitions BETWEEN 1 AND 50),
  notes         TEXT,         -- indywidualne wskazówki logopedy dla tego pacjenta
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plan_exercises_plan     ON public.plan_exercises(plan_id);
CREATE INDEX idx_plan_exercises_exercise ON public.plan_exercises(exercise_id);

-- ── Harmonogram ─────────────────────────────────────────────
-- Kiedy i jak często pacjent ma wykonywać plan
CREATE TABLE public.schedules (
  id             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id        UUID      NOT NULL REFERENCES public.exercise_plans(id) ON DELETE CASCADE,
  days_of_week   INT[]     NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6],
  -- 0 = poniedziałek, 1 = wtorek, ... 6 = niedziela (ISO-like, polski standard)
  reminder_time  TIME      NOT NULL DEFAULT '18:00',
  is_active      BOOLEAN   NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_days CHECK (
    array_length(days_of_week, 1) BETWEEN 1 AND 7
    AND days_of_week <@ ARRAY[0,1,2,3,4,5,6]
  )
);

CREATE INDEX idx_schedules_plan ON public.schedules(plan_id);

-- ── Row-Level Security ───────────────────────────────────────
ALTER TABLE public.exercise_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_exercises  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules       ENABLE ROW LEVEL SECURITY;

-- ── Polityki exercise_plans ──────────────────────────────────

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

-- ── Polityki plan_exercises ──────────────────────────────────
-- Dostęp przez plan — sprawdzamy właściciela planu

CREATE POLICY "plan_ex: logopeda widzi swoje plany"
  ON public.plan_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exercise_plans p
      WHERE p.id = plan_id AND p.therapist_id = auth.uid()
    )
  );

CREATE POLICY "plan_ex: pacjent widzi swoje ćwiczenia"
  ON public.plan_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exercise_plans p
      WHERE p.id = plan_id AND p.patient_id = auth.uid()
    )
  );

CREATE POLICY "plan_ex: logopeda zarządza"
  ON public.plan_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.exercise_plans p
      WHERE p.id = plan_id AND p.therapist_id = auth.uid()
    )
  );

CREATE POLICY "plan_ex: admin pełny dostęp"
  ON public.plan_exercises FOR ALL
  USING (public.current_user_role() = 'admin');

-- ── Polityki schedules ───────────────────────────────────────

CREATE POLICY "schedules: logopeda zarządza swoimi"
  ON public.schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.exercise_plans p
      WHERE p.id = plan_id AND p.therapist_id = auth.uid()
    )
  );

CREATE POLICY "schedules: pacjent widzi swoje"
  ON public.schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exercise_plans p
      WHERE p.id = plan_id AND p.patient_id = auth.uid()
    )
  );

CREATE POLICY "schedules: admin pełny dostęp"
  ON public.schedules FOR ALL
  USING (public.current_user_role() = 'admin');
