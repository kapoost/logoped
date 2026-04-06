-- ============================================================
-- 006_storage.sql
-- Konfiguracja Supabase Storage (buckety + polityki dostępu)
-- Uruchom przez SQL Editor w panelu Supabase
-- ============================================================

-- ── Buckety ─────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'exercise-media',
    'exercise-media',
    true,            -- publiczny: obrazki/gify instruktażowe ćwiczeń
    5242880,         -- 5 MB limit
    ARRAY['image/jpeg','image/png','image/gif','image/webp']
  ),
  (
    'avatars',
    'avatars',
    false,           -- prywatny: avatary użytkowników
    2097152,         -- 2 MB limit
    ARRAY['image/jpeg','image/png','image/webp']
  ),
  (
    'recordings',
    'recordings',
    false,           -- prywatny: nagrania audio/wideo pacjentów (v2)
    104857600,       -- 100 MB limit
    ARRAY['audio/webm','audio/ogg','audio/mp4','video/webm','video/mp4']
  )
ON CONFLICT (id) DO NOTHING;

-- ── Polityki Storage ─────────────────────────────────────────

-- exercise-media: publiczny odczyt, tylko admin może pisać
CREATE POLICY "exercise-media: publiczny odczyt"
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

-- avatars: każdy widzi swoje, każdy może wgrać swój
CREATE POLICY "avatars: własny odczyt"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "avatars: własny zapis"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "avatars: własne usuwanie"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- recordings: pacjent wgrywa swoje, logopeda widzi nagrania swoich pacjentów
CREATE POLICY "recordings: pacjent wgrywa"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'recordings'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "recordings: pacjent widzi swoje"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'recordings'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

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
