-- ============================================================
-- 015_jeden_plan_na_pacjenta.sql
-- Jeden plan widoczny dla dziecka naraz.
--
-- Stan zastany: 3 z 6 pacjentów ma po 2-3 aktywne plany, a widok
-- today_exercises sumuje ćwiczenia ze wszystkich. .single() w karcie pacjenta
-- wywalało się u nich od zawsze — bug starszy niż rozdzielenie roboczy/
-- opublikowany z migracji 014, które tylko czyniło go systematycznym.
--
-- NIE wyłączamy nadmiarowych planów, tylko je SCALAMY. U co najmniej jednego
-- pacjenta trzy plany to celowy podział tematyczny (głoska R, gimnastyka buzi,
-- oddech), a nie pomyłka. Scalenie zachowuje dokładnie ten sam zestaw ćwiczeń,
-- który dziecko widzi dziś — jego dzień nie zmienia się ani o jedną pozycję.
--
-- Ograniczenie celowo dotyczy pary (aktywny AND opublikowany), nie samego
-- is_active. Plan roboczy MUSI móc współistnieć z żywym — po to powstał.
-- ============================================================

-- ── 1. Scalenie nadmiarowych planów ─────────────────────────
DO $$
DECLARE
  v_pacjent  uuid;
  v_keeper   uuid;
  v_nazwy    text;
  v_offset   int;
BEGIN
  FOR v_pacjent IN
    SELECT patient_id FROM public.exercise_plans
     WHERE is_active AND published_at IS NOT NULL
     GROUP BY patient_id HAVING count(*) > 1
  LOOP
    -- Zostaje najnowszy; pozostałe wlewamy do niego.
    SELECT id INTO v_keeper FROM public.exercise_plans
     WHERE patient_id = v_pacjent AND is_active AND published_at IS NOT NULL
     ORDER BY created_at DESC, id LIMIT 1;

    SELECT string_agg(name, ', ' ORDER BY created_at) INTO v_nazwy
      FROM public.exercise_plans
     WHERE patient_id = v_pacjent AND is_active AND published_at IS NOT NULL
       AND id <> v_keeper;

    SELECT coalesce(max(order_index), -1) + 1 INTO v_offset
      FROM public.plan_exercises WHERE plan_id = v_keeper;

    -- Ćwiczenia dopisujemy na koniec, zachowując kolejność z planów źródłowych.
    WITH zrodlo AS (
      SELECT pe.id,
             row_number() OVER (ORDER BY ep.created_at, pe.order_index) - 1 AS lp
        FROM public.plan_exercises pe
        JOIN public.exercise_plans ep ON ep.id = pe.plan_id
       WHERE ep.patient_id = v_pacjent AND ep.is_active
         AND ep.published_at IS NOT NULL AND ep.id <> v_keeper
    )
    UPDATE public.plan_exercises pe
       SET plan_id = v_keeper, order_index = v_offset + z.lp
      FROM zrodlo z WHERE pe.id = z.id;

    -- Nazwy scalonych planów zostają w opisie — inaczej przepadłyby bezśladowo.
    UPDATE public.exercise_plans
       SET description = coalesce(description || E'\n', '')
                      || 'Scalono plany: ' || v_nazwy || ' (migracja 015)'
     WHERE id = v_keeper;

    UPDATE public.exercise_plans SET is_active = FALSE
     WHERE patient_id = v_pacjent AND is_active AND published_at IS NOT NULL
       AND id <> v_keeper;

    RAISE NOTICE 'Pacjent %: scalono do %, wchłonięto: %', v_pacjent, v_keeper, v_nazwy;
  END LOOP;
END $$;

-- ── 2. Ograniczenie ─────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uniq_jeden_zywy_plan_na_pacjenta
  ON public.exercise_plans (patient_id)
  WHERE is_active AND published_at IS NOT NULL;

-- ── 3. Publikacja bez okna, w którym dziecko nie ma nic ─────
-- Zwolnienie miejsca i publikacja muszą być jedną transakcją: przy dwóch
-- osobnych zapytaniach z aplikacji awaria między nimi zostawiłaby pacjenta
-- bez żadnego planu.
CREATE OR REPLACE FUNCTION public.publikuj_plan(p_plan_id uuid, p_publish boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_pacjent uuid;
BEGIN
  -- SECURITY DEFINER omija RLS, więc uprawnienia sprawdzamy tutaj, a nie
  -- wyłącznie w trasie API — funkcję można wywołać bezpośrednio.
  IF NOT EXISTS (
    SELECT 1 FROM public.exercise_plans p
     WHERE p.id = p_plan_id
       AND (p.therapist_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.profiles pr
                        WHERE pr.id = auth.uid() AND pr.role = 'admin'))
  ) THEN
    RAISE EXCEPTION 'Brak uprawnien do planu %', p_plan_id USING ERRCODE = '42501';
  END IF;

  IF NOT p_publish THEN
    UPDATE public.exercise_plans SET published_at = NULL WHERE id = p_plan_id;
    RETURN;
  END IF;

  SELECT patient_id INTO v_pacjent FROM public.exercise_plans WHERE id = p_plan_id;

  UPDATE public.exercise_plans SET is_active = FALSE
   WHERE patient_id = v_pacjent AND id <> p_plan_id
     AND is_active AND published_at IS NOT NULL;

  UPDATE public.exercise_plans
     SET published_at = now(), is_active = TRUE
   WHERE id = p_plan_id;
END $$;

GRANT EXECUTE ON FUNCTION public.publikuj_plan(uuid, boolean) TO authenticated;

-- ── 4. Kontrola ─────────────────────────────────────────────
-- naruszen ma byc 0; suma_pozycji ma sie zgadzac z tym, co dziecko widzialo
-- przed migracja (nic nie znika, tylko zmienia plan).
SELECT
  (SELECT count(*) FROM (
     SELECT patient_id FROM public.exercise_plans
      WHERE is_active AND published_at IS NOT NULL
      GROUP BY patient_id HAVING count(*) > 1) x)      AS naruszen,
  (SELECT count(*) FROM public.today_exercises)        AS suma_pozycji,
  (SELECT count(*) FROM public.exercise_plans
    WHERE is_active AND published_at IS NOT NULL)      AS zywych_planow;
