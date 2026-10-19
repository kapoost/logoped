-- 011_kategorie_polykanie_zuchwa.sql
-- Dwie nowe kategorie ćwiczeń: prawidłowe połykanie i żuchwa.
--
-- Materiały od logopedy obejmują sześć obszarów terapii, a enum `exercise_category`
-- znał tylko cztery z nich (+ artykulacyjne i słuchowe). Bez tych wartości 33 z 92
-- ćwiczeń nie miałyby gdzie trafić.
--
-- UWAGA: ten plik musi zostać uruchomiony W OSOBNEJ TRANSAKCJI przed 012_seed...
-- Postgres nie pozwala użyć nowej wartości enuma w tej samej transakcji, w której
-- została dodana (błąd: "unsafe use of new value of enum type"). Dlatego nie ma tu
-- BEGIN/COMMIT — ALTER TYPE ... ADD VALUE sam się commituje.

ALTER TYPE public.exercise_category ADD VALUE IF NOT EXISTS 'polykanie';
ALTER TYPE public.exercise_category ADD VALUE IF NOT EXISTS 'zuchwa';

COMMENT ON TYPE public.exercise_category IS
  'Obszary terapii logopedycznej: oddechowe, warg, jezyka, artykulacyjne, podniebienia, sluchowe, polykanie (prawidłowy wzorzec połykania), zuchwa (ruchomość i stabilizacja żuchwy).';

-- Odśwież cache schematu PostgREST — bez tego nowe wartości dają PGRST
NOTIFY pgrst, 'reload schema';
