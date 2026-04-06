-- ============================================================
-- 001_profiles.sql
-- Tabela użytkowników + Row-Level Security
-- ============================================================

-- Profil tworzony automatycznie po rejestracji przez trigger
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: utwórz pusty profil zaraz po rejestracji auth.users
-- Rola i imię uzupełniane przez onboarding flow
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Tabela relacji logopeda ↔ pacjent ────────────────────────
CREATE TABLE public.therapist_patients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes         TEXT,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (therapist_id, patient_id)
);

-- ── Row-Level Security ───────────────────────────────────────
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_patients ENABLE ROW LEVEL SECURITY;

-- Helper: zwraca rolę aktualnego użytkownika
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: sprawdza czy logopeda jest przypisany do pacjenta
CREATE OR REPLACE FUNCTION public.is_therapist_of(p_patient_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.therapist_patients
    WHERE therapist_id = auth.uid()
      AND patient_id   = p_patient_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Polityki profiles ────────────────────────────────────────

-- Każdy widzi swój własny profil
CREATE POLICY "profiles: własny profil"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Logopeda widzi profile swoich pacjentów
CREATE POLICY "profiles: logopeda widzi pacjentów"
  ON public.profiles FOR SELECT
  USING (public.is_therapist_of(id));

-- Admin widzi wszystkie profile
CREATE POLICY "profiles: admin widzi wszystko"
  ON public.profiles FOR SELECT
  USING (public.current_user_role() = 'admin');

-- Każdy może aktualizować swój profil
CREATE POLICY "profiles: własna aktualizacja"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Admin może aktualizować dowolny profil
CREATE POLICY "profiles: admin aktualizuje"
  ON public.profiles FOR UPDATE
  USING (public.current_user_role() = 'admin');

-- ── Polityki therapist_patients ──────────────────────────────

-- Logopeda widzi i zarządza swoimi przypisaniami
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

-- Admin może robić wszystko
CREATE POLICY "tp: admin pełny dostęp"
  ON public.therapist_patients FOR ALL
  USING (public.current_user_role() = 'admin');

-- Pacjent widzi kto jest jego logopedą
CREATE POLICY "tp: pacjent widzi swojego logopedę"
  ON public.therapist_patients FOR SELECT
  USING (patient_id = auth.uid());
