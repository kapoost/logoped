-- ============================================================
-- 002_exercises.sql
-- Baza ćwiczeń logopedycznych (publiczna + własne logopedy)
-- ============================================================

-- ── Typy wyliczeniowe ────────────────────────────────────────
CREATE TYPE public.exercise_category AS ENUM (
  'oddechowe',     -- ćwiczenia oddechowe 💨
  'warg',          -- ćwiczenia warg 👄
  'jezyka',        -- ćwiczenia języka 👅
  'artykulacyjne', -- ćwiczenia artykulacyjne 🔤
  'podniebienia',  -- ćwiczenia podniebienia miękkiego
  'sluchowe'       -- ćwiczenia słuchowe 👂
);

CREATE TYPE public.difficulty_level AS ENUM (
  'latwe',
  'srednie',
  'trudne'
);

-- ── Tabela ćwiczeń ───────────────────────────────────────────
CREATE TABLE public.exercises (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT        NOT NULL,
  description      TEXT,
  instructions     TEXT        NOT NULL,  -- treść w Markdown, kroki dla dziecka
  category         public.exercise_category NOT NULL,
  difficulty       public.difficulty_level  NOT NULL DEFAULT 'latwe',
  target_sounds    TEXT[],               -- np. ARRAY['sz','cz','r']
  media_url        TEXT,                 -- URL obrazka/gifa z Supabase Storage
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

-- Indeksy do szybkiego filtrowania w UI
CREATE INDEX idx_exercises_category   ON public.exercises(category);
CREATE INDEX idx_exercises_difficulty ON public.exercises(difficulty);
CREATE INDEX idx_exercises_public     ON public.exercises(is_public);
CREATE INDEX idx_exercises_created_by ON public.exercises(created_by);
-- Wyszukiwanie pełnotekstowe po tytule i głoskach
CREATE INDEX idx_exercises_sounds ON public.exercises USING GIN(target_sounds);

-- ── Row-Level Security ───────────────────────────────────────
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Każdy zalogowany widzi publiczne ćwiczenia
CREATE POLICY "exercises: publiczne dla wszystkich"
  ON public.exercises FOR SELECT
  USING (is_public = TRUE AND auth.uid() IS NOT NULL);

-- Logopeda widzi swoje prywatne ćwiczenia
CREATE POLICY "exercises: własne prywatne"
  ON public.exercises FOR SELECT
  USING (created_by = auth.uid());

-- Logopeda tworzy własne ćwiczenia
CREATE POLICY "exercises: tworzenie przez logopedę"
  ON public.exercises FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.current_user_role() IN ('therapist', 'admin')
    AND created_by = auth.uid()
  );

-- Logopeda edytuje tylko swoje ćwiczenia
CREATE POLICY "exercises: edycja własnych"
  ON public.exercises FOR UPDATE
  USING (created_by = auth.uid());

-- Logopeda usuwa tylko swoje ćwiczenia
CREATE POLICY "exercises: usuwanie własnych"
  ON public.exercises FOR DELETE
  USING (created_by = auth.uid());

-- Admin ma pełny dostęp (w tym do publicznych created_by = NULL)
CREATE POLICY "exercises: admin pełny dostęp"
  ON public.exercises FOR ALL
  USING (public.current_user_role() = 'admin');
