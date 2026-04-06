-- ============================================================
-- 007_licenses.sql
-- System licencji dla logopedów
-- ============================================================

-- Typy licencji
CREATE TYPE license_type AS ENUM ('trial', 'basic', 'pro', 'unlimited');

-- Kolumny licencyjne w tabeli profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS license_type     license_type DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS license_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  ADD COLUMN IF NOT EXISTS max_patients     INT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS is_blocked       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS block_reason     TEXT,
  ADD COLUMN IF NOT EXISTS notes            TEXT,    -- notatki admina
  ADD COLUMN IF NOT EXISTS phone            TEXT,
  ADD COLUMN IF NOT EXISTS organization     TEXT;    -- gabinet / klinika

-- Widok z pełnymi danymi logopedy dla admina
CREATE OR REPLACE VIEW public.therapist_admin_overview AS
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
  -- liczba pacjentów
  COUNT(DISTINCT tp.patient_id)::INT                             AS patient_count,
  -- liczba aktywnych planów
  COUNT(DISTINCT ep.id) FILTER (WHERE ep.is_active = TRUE)::INT AS active_plans,
  -- sesje ostatnie 30 dni
  COUNT(DISTINCT ec.id) FILTER (
    WHERE ec.completed_at > NOW() - INTERVAL '30 days'
  )::INT AS sessions_last_30d,
  -- czy licencja wygasła
  (p.license_expires_at IS NOT NULL AND p.license_expires_at < NOW()) AS license_expired,
  -- dni do wygaśnięcia
  EXTRACT(DAY FROM p.license_expires_at - NOW())::INT            AS license_days_left
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN public.therapist_patients tp ON tp.therapist_id = p.id
LEFT JOIN public.exercise_plans ep ON ep.therapist_id = p.id
LEFT JOIN public.exercise_completions ec ON ec.patient_id = tp.patient_id
WHERE p.role = 'therapist'
GROUP BY p.id, u.email, u.last_sign_in_at, u.email_confirmed_at;

-- Limity domyślne wg typu licencji
CREATE OR REPLACE FUNCTION public.license_max_patients(lt license_type)
RETURNS INT AS $$
  SELECT CASE lt
    WHEN 'trial'     THEN 3
    WHEN 'basic'     THEN 10
    WHEN 'pro'       THEN 30
    WHEN 'unlimited' THEN 9999
    ELSE 3
  END;
$$ LANGUAGE sql IMMUTABLE;
