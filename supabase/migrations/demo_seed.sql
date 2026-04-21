-- ============================================================
-- demo_seed.sql
-- Konto demo dla niezalogowanych odwiedzających
-- Pacjentka: Zosia Zaczarowana 🧚
-- Uruchom w Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
  v_therapist_id  UUID;
  v_patient_id    UUID;
  v_plan1_id      UUID;
  v_plan2_id      UUID;
  v_plan3_id      UUID;
  v_plan4_id      UUID;
  v_ex1           UUID; -- kotek
  v_ex2           UUID; -- zegar
  v_ex3           UUID; -- głoska sz
  v_ex4           UUID; -- głoska r
  v_ex5           UUID; -- całuski
  v_ex6           UUID; -- dmuchanie
  v_ex7           UUID; -- grzyb
  v_ex8           UUID; -- malarz
  v_pe1 UUID; v_pe2 UUID; v_pe3 UUID; v_pe4 UUID;
  v_pe5 UUID; v_pe6 UUID; v_pe7 UUID; v_pe8 UUID;
  v_day DATE;
  i     INT;
BEGIN

-- ── 1. Konto logopedy demo ───────────────────────────────────
SELECT id INTO v_therapist_id
  FROM auth.users WHERE email = 'logopeda-demo@logoped.app';

IF v_therapist_id IS NULL THEN
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, aud, role
  ) VALUES (
    gen_random_uuid(),
    'logopeda-demo@logoped.app',
    crypt('DemoLogopeda123!', gen_salt('bf')),
    NOW(),
    '{"full_name":"Pani Logopeda (Demo)"}'::jsonb,
    NOW(), NOW(), '', '', 'authenticated', 'authenticated'
  ) RETURNING id INTO v_therapist_id;
END IF;

UPDATE public.profiles SET role = 'therapist', full_name = 'Pani Logopeda (Demo)'
  WHERE id = v_therapist_id;

-- ── 2. Konto pacjenta demo ───────────────────────────────────
SELECT id INTO v_patient_id
  FROM auth.users WHERE email = 'demo@logoped.app';

IF v_patient_id IS NULL THEN
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, aud, role
  ) VALUES (
    gen_random_uuid(),
    'demo@logoped.app',
    crypt('Demo2026!', gen_salt('bf')),
    NOW(),
    '{"full_name":"Zosia Zaczarowana"}'::jsonb,
    NOW() - INTERVAL '60 days', NOW(),
    '', '', 'authenticated', 'authenticated'
  ) RETURNING id INTO v_patient_id;
END IF;

UPDATE public.profiles
  SET role = 'patient',
      full_name = 'Zosia Zaczarowana',
      date_of_birth = '2019-03-15'
  WHERE id = v_patient_id;

-- ── 3. Relacja logopeda ↔ pacjent ────────────────────────────
INSERT INTO public.therapist_patients (therapist_id, patient_id)
VALUES (v_therapist_id, v_patient_id)
ON CONFLICT (therapist_id, patient_id) DO NOTHING;

-- ── 4. Pobierz ID ćwiczeń z bazy publicznej ──────────────────
SELECT id INTO v_ex1 FROM public.exercises WHERE title = 'Kotek'               LIMIT 1;
SELECT id INTO v_ex2 FROM public.exercises WHERE title = 'Zegar'               LIMIT 1;
SELECT id INTO v_ex3 FROM public.exercises WHERE title ILIKE '%sz%'            LIMIT 1;
SELECT id INTO v_ex4 FROM public.exercises WHERE title ILIKE '%głoska R%'      LIMIT 1;
SELECT id INTO v_ex5 FROM public.exercises WHERE title = 'Całuski'             LIMIT 1;
SELECT id INTO v_ex6 FROM public.exercises WHERE title = 'Dmuchanie balonka'   LIMIT 1;
SELECT id INTO v_ex7 FROM public.exercises WHERE title = 'Grzyb'               LIMIT 1;
SELECT id INTO v_ex8 FROM public.exercises WHERE title = 'Malarz'              LIMIT 1;

-- Fallback — użyj pierwszych dostępnych jeśli brak seed
IF v_ex1 IS NULL THEN SELECT id INTO v_ex1 FROM public.exercises WHERE category = 'jezyka'        LIMIT 1; END IF;
IF v_ex2 IS NULL THEN SELECT id INTO v_ex2 FROM public.exercises WHERE category = 'jezyka'        OFFSET 1 LIMIT 1; END IF;
IF v_ex3 IS NULL THEN SELECT id INTO v_ex3 FROM public.exercises WHERE category = 'artykulacyjne' LIMIT 1; END IF;
IF v_ex4 IS NULL THEN SELECT id INTO v_ex4 FROM public.exercises WHERE category = 'artykulacyjne' OFFSET 1 LIMIT 1; END IF;
IF v_ex5 IS NULL THEN SELECT id INTO v_ex5 FROM public.exercises WHERE category = 'warg'          LIMIT 1; END IF;
IF v_ex6 IS NULL THEN SELECT id INTO v_ex6 FROM public.exercises WHERE category = 'oddechowe'     LIMIT 1; END IF;
IF v_ex7 IS NULL THEN SELECT id INTO v_ex7 FROM public.exercises WHERE category = 'jezyka'        OFFSET 2 LIMIT 1; END IF;
IF v_ex8 IS NULL THEN SELECT id INTO v_ex8 FROM public.exercises WHERE category = 'jezyka'        OFFSET 3 LIMIT 1; END IF;

-- ── 5. Plany ćwiczeń ─────────────────────────────────────────

-- Plan 1: Głoska R (aktywny, główny)
SELECT id INTO v_plan1_id FROM public.exercise_plans
  WHERE patient_id = v_patient_id AND name = '🐉 Głoska R — etap 1';
IF v_plan1_id IS NULL THEN
  INSERT INTO public.exercise_plans
    (id, therapist_id, patient_id, name, description, is_active, start_date)
  VALUES (
    gen_random_uuid(), v_therapist_id, v_patient_id,
    '🐉 Głoska R — etap 1',
    'Przygotowanie narządów mowy do wymowy głoski R. Zaczynamy od ćwiczeń języka.',
    TRUE, CURRENT_DATE - INTERVAL '45 days'
  ) RETURNING id INTO v_plan1_id;
END IF;

-- Plan 2: Ćwiczenia warg (aktywny)
SELECT id INTO v_plan2_id FROM public.exercise_plans
  WHERE patient_id = v_patient_id AND name = '💋 Gimnastyka buzi';
IF v_plan2_id IS NULL THEN
  INSERT INTO public.exercise_plans
    (id, therapist_id, patient_id, name, description, is_active, start_date)
  VALUES (
    gen_random_uuid(), v_therapist_id, v_patient_id,
    '💋 Gimnastyka buzi',
    'Ćwiczenia warg i języka dla lepszej artykulacji.',
    TRUE, CURRENT_DATE - INTERVAL '30 days'
  ) RETURNING id INTO v_plan2_id;
END IF;

-- Plan 3: Głoska SZ (ukończony, nieaktywny)
SELECT id INTO v_plan3_id FROM public.exercise_plans
  WHERE patient_id = v_patient_id AND name = '🌊 Głoska SZ — gotowe!';
IF v_plan3_id IS NULL THEN
  INSERT INTO public.exercise_plans
    (id, therapist_id, patient_id, name, description, is_active, start_date)
  VALUES (
    gen_random_uuid(), v_therapist_id, v_patient_id,
    '🌊 Głoska SZ — gotowe!',
    'Plan ukończony! Zosia świetnie opanowała głoskę SZ.',
    FALSE, CURRENT_DATE - INTERVAL '90 days'
  ) RETURNING id INTO v_plan3_id;
END IF;

-- Plan 4: Oddech (aktywny)
SELECT id INTO v_plan4_id FROM public.exercise_plans
  WHERE patient_id = v_patient_id AND name = '💨 Ćwiczenia oddechu';
IF v_plan4_id IS NULL THEN
  INSERT INTO public.exercise_plans
    (id, therapist_id, patient_id, name, description, is_active, start_date)
  VALUES (
    gen_random_uuid(), v_therapist_id, v_patient_id,
    '💨 Ćwiczenia oddechu',
    'Poprawna technika oddychania wspiera prawidłową mowę.',
    TRUE, CURRENT_DATE - INTERVAL '20 days'
  ) RETURNING id INTO v_plan4_id;
END IF;

-- ── 6. Ćwiczenia w planach ───────────────────────────────────

-- Plan 1: 3 ćwiczenia języka
INSERT INTO public.plan_exercises (id, plan_id, exercise_id, order_index, repetitions, notes)
SELECT gen_random_uuid(), v_plan1_id, v_ex1, 1, 10,
  'Rób powoli — czubek języka musi dotykać podniebienia!'
WHERE NOT EXISTS (SELECT 1 FROM public.plan_exercises WHERE plan_id = v_plan1_id AND exercise_id = v_ex1)
RETURNING id INTO v_pe1;

IF v_pe1 IS NULL THEN
  SELECT id INTO v_pe1 FROM public.plan_exercises WHERE plan_id = v_plan1_id AND exercise_id = v_ex1;
END IF;

INSERT INTO public.plan_exercises (id, plan_id, exercise_id, order_index, repetitions, notes)
SELECT gen_random_uuid(), v_plan1_id, v_ex2, 2, 10, 'Tic-tac, jak zegar!'
WHERE NOT EXISTS (SELECT 1 FROM public.plan_exercises WHERE plan_id = v_plan1_id AND exercise_id = v_ex2)
RETURNING id INTO v_pe2;
IF v_pe2 IS NULL THEN SELECT id INTO v_pe2 FROM public.plan_exercises WHERE plan_id = v_plan1_id AND exercise_id = v_ex2; END IF;

INSERT INTO public.plan_exercises (id, plan_id, exercise_id, order_index, repetitions, notes)
SELECT gen_random_uuid(), v_plan1_id, v_ex7, 3, 8, 'Przyklejaj mocno jak grzyb po deszczu!'
WHERE NOT EXISTS (SELECT 1 FROM public.plan_exercises WHERE plan_id = v_plan1_id AND exercise_id = v_ex7)
RETURNING id INTO v_pe3;
IF v_pe3 IS NULL THEN SELECT id INTO v_pe3 FROM public.plan_exercises WHERE plan_id = v_plan1_id AND exercise_id = v_ex7; END IF;

-- Plan 2: 2 ćwiczenia warg
INSERT INTO public.plan_exercises (id, plan_id, exercise_id, order_index, repetitions, notes)
SELECT gen_random_uuid(), v_plan2_id, v_ex5, 1, 8, 'Rytmicznie, jak muzyka!'
WHERE NOT EXISTS (SELECT 1 FROM public.plan_exercises WHERE plan_id = v_plan2_id AND exercise_id = v_ex5)
RETURNING id INTO v_pe4;
IF v_pe4 IS NULL THEN SELECT id INTO v_pe4 FROM public.plan_exercises WHERE plan_id = v_plan2_id AND exercise_id = v_ex5; END IF;

INSERT INTO public.plan_exercises (id, plan_id, exercise_id, order_index, repetitions, notes)
SELECT gen_random_uuid(), v_plan2_id, v_ex8, 2, 8, 'Malujemy sufit językiem!'
WHERE NOT EXISTS (SELECT 1 FROM public.plan_exercises WHERE plan_id = v_plan2_id AND exercise_id = v_ex8)
RETURNING id INTO v_pe5;
IF v_pe5 IS NULL THEN SELECT id INTO v_pe5 FROM public.plan_exercises WHERE plan_id = v_plan2_id AND exercise_id = v_ex8; END IF;

-- Plan 4: 2 ćwiczenia oddechu
INSERT INTO public.plan_exercises (id, plan_id, exercise_id, order_index, repetitions, notes)
SELECT gen_random_uuid(), v_plan4_id, v_ex6, 1, 5, 'Powoli i spokojnie!'
WHERE NOT EXISTS (SELECT 1 FROM public.plan_exercises WHERE plan_id = v_plan4_id AND exercise_id = v_ex6)
RETURNING id INTO v_pe7;
IF v_pe7 IS NULL THEN SELECT id INTO v_pe7 FROM public.plan_exercises WHERE plan_id = v_plan4_id AND exercise_id = v_ex6; END IF;

-- ── 7. Harmonogramy ──────────────────────────────────────────
INSERT INTO public.schedules (plan_id, days_of_week, reminder_time, is_active)
VALUES
  (v_plan1_id, ARRAY[0,1,2,3,4,5,6], '18:00', TRUE),
  (v_plan2_id, ARRAY[0,1,2,3,4],     '17:30', TRUE),
  (v_plan4_id, ARRAY[0,2,4],         '18:00', TRUE)
ON CONFLICT DO NOTHING;

-- ── 8. Historia wykonań (45 dni wstecz) ─────────────────────
-- Pierwsze 2 tygodnie: nieregularne (3-4x/tydz)
-- Kolejne 2 tygodnie: regularne (5-6x/tydz)
-- Ostatnie 2 tygodnie: codziennie (streak!)

-- Usuń stare dane jeśli istnieją
DELETE FROM public.exercise_completions
  WHERE patient_id = v_patient_id;

FOR i IN 1..45 LOOP
  v_day := CURRENT_DATE - (45 - i);

  -- Wzorzec frekwencji
  CONTINUE WHEN (
    -- Pierwsze 2 tygodnie: opuszczaj co 2-3 dni
    (i <= 14 AND i % 3 = 0) OR
    -- Tygodnie 3-4: opuszczaj weekendy i jeden dzień
    (i BETWEEN 15 AND 30 AND EXTRACT(DOW FROM v_day) IN (0) AND i % 4 = 0) OR
    -- Ostatnie 2 tygodnie: codziennie (brak przerw)
    FALSE
  );

  -- Plan 1: kotek (pe1)
  IF v_pe1 IS NOT NULL THEN
    INSERT INTO public.exercise_completions
      (patient_id, plan_exercise_id, session_date, completed_at)
    VALUES
      (v_patient_id, v_pe1, v_day, v_day + TIME '18:02')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Plan 1: zegar (pe2) — od 2. tygodnia
  IF v_pe2 IS NOT NULL AND i > 10 THEN
    INSERT INTO public.exercise_completions
      (patient_id, plan_exercise_id, session_date, completed_at)
    VALUES
      (v_patient_id, v_pe2, v_day, v_day + TIME '18:05')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Plan 1: grzyb (pe3) — od 3. tygodnia, najnowsze
  IF v_pe3 IS NOT NULL AND i > 21 THEN
    INSERT INTO public.exercise_completions
      (patient_id, plan_exercise_id, session_date, completed_at)
    VALUES
      (v_patient_id, v_pe3, v_day, v_day + TIME '18:08')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Plan 2: całuski (pe4) — od 15. dnia
  IF v_pe4 IS NOT NULL AND i > 15 THEN
    INSERT INTO public.exercise_completions
      (patient_id, plan_exercise_id, session_date, completed_at)
    VALUES
      (v_patient_id, v_pe4, v_day, v_day + TIME '17:32')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Plan 4: oddech (pe7) — od 25. dnia, co 2 dni
  IF v_pe7 IS NOT NULL AND i > 25 AND i % 2 = 0 THEN
    INSERT INTO public.exercise_completions
      (patient_id, plan_exercise_id, session_date, completed_at)
    VALUES
      (v_patient_id, v_pe7, v_day, v_day + TIME '18:15')
    ON CONFLICT DO NOTHING;
  END IF;

END LOOP;

-- ── 9. Odznaki ───────────────────────────────────────────────
INSERT INTO public.achievements (patient_id, badge_key, unlocked_at)
VALUES
  (v_patient_id, 'first_session', NOW() - INTERVAL '45 days'),
  (v_patient_id, 'streak_3',      NOW() - INTERVAL '30 days'),
  (v_patient_id, 'streak_7',      NOW() - INTERVAL '14 days'),
  (v_patient_id, 'sessions_10',   NOW() - INTERVAL '20 days'),
  (v_patient_id, 'sessions_50',   NOW() - INTERVAL '3 days')
ON CONFLICT (patient_id, badge_key) DO NOTHING;

RAISE NOTICE '✓ Demo gotowe!';
RAISE NOTICE '  Email: demo@logoped.app';
RAISE NOTICE '  Hasło: Demo2026!';
RAISE NOTICE '  Pacjentka: Zosia Zaczarowana';
RAISE NOTICE '  Plany: 3 aktywne + 1 ukończony';

END $$;

-- Weryfikacja
SELECT
  u.email,
  p.full_name,
  p.role,
  ps.current_streak,
  ps.total_exercises,
  ps.points,
  ps.level,
  (SELECT COUNT(*) FROM public.exercise_completions WHERE patient_id = p.id) AS completions
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.patient_stats ps ON ps.patient_id = p.id
WHERE u.email IN ('demo@logoped.app', 'logopeda-demo@logoped.app')
ORDER BY p.role DESC;
