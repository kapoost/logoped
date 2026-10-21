-- ============================================================
-- 013_opis_dla_dziecka.sql
-- Opis ćwiczenia pisany do dziecka, obok klinicznego dla logopedy.
--
-- Kolumna description zostaje bez zmian — jest pisana rejestrem zawodowym
-- ("Przedłużona fonacja samogłosek") i taka ma pozostać w widokach logopedy
-- i admina. Dziecko dostaje osobne zdanie w description_child.
--
-- Plik jest GENEROWANY z scripts/opisy/opisy_dziecka.json przez
-- scripts/opisy/build_migration.py — nie edytuj go ręcznie, bo poprawki
-- przepadną przy następnym przebudowaniu. Edytuj JSON i przebuduj.
--
-- Bezpieczny do ponownego uruchomienia: ADD COLUMN IF NOT EXISTS,
-- CREATE OR REPLACE VIEW, a UPDATE-y są idempotentne.
--
-- UWAGA przy edycji: ten plik odtwarza widok today_exercises w CAŁOŚCI, więc
-- musi zawierać wszystkie warunki dołożone przez PÓŹNIEJSZE migracje. Dziś
-- jest to bramka publikacji z 014. Pominięcie jej wystawia plany robocze
-- wszystkim dzieciom i nie zgłasza przy tym żadnego błędu.
-- ============================================================

-- ── 1. Kolumna ──────────────────────────────────────────────
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS description_child text;

COMMENT ON COLUMN public.exercises.description_child IS
  'Opis pisany do dziecka, drugą osobą, bez terminologii. NULL = pokaż description.';

-- ── 2. Widok dla ekranu pacjenta ────────────────────────────
-- Nowa kolumna dopisana NA KOŃCU listy — CREATE OR REPLACE VIEW pozwala
-- dokładać kolumny tylko na końcu, kolejność i typy pozostałych muszą się
-- zgadzać co do jednej.
CREATE OR REPLACE VIEW public.today_exercises AS
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
  CASE
    WHEN ec.id IS NOT NULL THEN TRUE
    ELSE FALSE
  END                    AS completed_today,
  ec.id                  AS completion_id,
  ec.completed_at,
  e.description_child
FROM public.plan_exercises pe
JOIN public.exercise_plans ep  ON ep.id  = pe.plan_id
JOIN public.exercises       e  ON e.id   = pe.exercise_id
LEFT JOIN public.exercise_completions ec
  ON  ec.plan_exercise_id = pe.id
  AND ec.patient_id       = ep.patient_id
  AND ec.session_date     = CURRENT_DATE
WHERE ep.is_active = TRUE
  AND ep.published_at IS NOT NULL      -- bramka z migracji 014
ORDER BY pe.order_index;

-- ── 3. Treść ────────────────────────────────────────────────
-- Dopasowanie po kategorii i tytule, wyłącznie dla bazy publicznej
-- (created_by IS NULL). Ćwiczeń tworzonych przez logopedów nie ruszamy —
-- to ich treść, nie nasza.
-- Opisów do wgrania: 127

UPDATE public.exercises SET description_child = 'Mów krótkie c-c-c jak cykający zegar — krótko i ostro.'
  WHERE category = 'artykulacyjne' AND title = 'Głoska C — cyk zegara'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Mów cz-cz-cz jak pociąg ruszający z miejsca.'
  WHERE category = 'artykulacyjne' AND title = 'Głoska CZ — pociąg'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Zawarkocz dżdżdż jak silnik motocykla — dotknij szyi, powinna drżeć.'
  WHERE category = 'artykulacyjne' AND title = 'Głoska DŻ — silnik motocykla'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Kumkaj g-g-g jak żabka — dotknij szyi, powinna drżeć.'
  WHERE category = 'artykulacyjne' AND title = 'Głoska G — żaba kumka'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Mów głośne k-k-k tyłem języka, jak przy lekkim kaszlnięciu.'
  WHERE category = 'artykulacyjne' AND title = 'Głoska K — kaszlenie'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Dotknij językiem górnych zębów i mów lll-la-le-li-lo-lu.'
  WHERE category = 'artykulacyjne' AND title = 'Głoska L — łyżeczka'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Zacznij od dr-dr-dr i zamień to w warkot auta.'
  WHERE category = 'artykulacyjne' AND title = 'Głoska R — silnik auta'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Sycz długim sssss jak wąż, z buzią ułożoną w uśmiech.'
  WHERE category = 'artykulacyjne' AND title = 'Głoska S — syk węża'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Szum szszsz jak las, z wargami zaokrąglonymi w dzióbek.'
  WHERE category = 'artykulacyjne' AND title = 'Głoska SZ — szum lasu'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Bzycz zzzz jak pszczoła — dotknij szyi, powinna drżeć.'
  WHERE category = 'artykulacyjne' AND title = 'Głoska Z — buczenie pszczoły'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Mów na zmianę ca–cza: uśmiech przy C, dzióbek przy CZ.'
  WHERE category = 'artykulacyjne' AND title = 'Sylaby z C–CZ'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Mów na zmianę sa–sza: uśmiech przy S, dzióbek przy SZ.'
  WHERE category = 'artykulacyjne' AND title = 'Sylaby z S–SZ'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Sięgaj czubkiem języka raz do nosa, raz do brody.'
  WHERE category = 'jezyka' AND title = 'Celownik'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Wypychaj językiem policzki od środka — raz jeden, raz drugi.'
  WHERE category = 'jezyka' AND title = 'Chomik'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Przyklej cały język płasko do podniebienia jak grzybek do drzewa.'
  WHERE category = 'jezyka' AND title = 'Grzyb'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Cofnij język głęboko do tyłu i wróć na miejsce.'
  WHERE category = 'jezyka' AND title = 'Język w głąb'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Kląskaj językiem jak konik idący po bruku.'
  WHERE category = 'jezyka' AND title = 'Kląskający konik'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Rób szerokim językiem ruchy góra–dół, jak kotek pijący mleko.'
  WHERE category = 'jezyka' AND title = 'Kotek'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Zataczaj czubkiem języka kółka za zębami — w lewo i w prawo.'
  WHERE category = 'jezyka' AND title = 'Kółko'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Policz językiem górne zęby po kolei, od środka buzi.'
  WHERE category = 'jezyka' AND title = 'Liczenie zębów'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Maluj językiem podniebienie — powoli, od zębów aż w głąb.'
  WHERE category = 'jezyka' AND title = 'Malarz'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Mlaskaj rytmicznie środkiem języka.'
  WHERE category = 'jezyka' AND title = 'Mlaskanie'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Rozszerzaj i zwężaj język na wardze jak skrzydła motyla.'
  WHERE category = 'jezyka' AND title = 'Motylek'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Przy zamkniętej buzi oblizuj językiem górne zęby od środka.'
  WHERE category = 'jezyka' AND title = 'Oblizywanka'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Przyklej czubek języka do podniebienia i potrzymaj kilka sekund.'
  WHERE category = 'jezyka' AND title = 'Przyklejony język'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Oblizuj wargi dookoła, jakbyś właśnie zjadł coś pysznego.'
  WHERE category = 'jezyka' AND title = 'Smakosz'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Trzymaj cukierka przy podniebieniu samym czubkiem języka.'
  WHERE category = 'jezyka' AND title = 'Ssanie cukierka'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Myj zęby samym językiem — góra, dół i na boki.'
  WHERE category = 'jezyka' AND title = 'Szczoteczka'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Unieś cały język powoli do podniebienia jak windę jadącą w górę.'
  WHERE category = 'jezyka' AND title = 'Winda'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Przesuwaj język na boki — raz w prawo, raz w lewo, tik-tak.'
  WHERE category = 'jezyka' AND title = 'Zegar'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Zliż chrupkę z podniebienia samym czubkiem języka.'
  WHERE category = 'jezyka' AND title = 'Zlizywanie chrupki'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Wysuń szeroki, płaski język i potrzymaj go nieruchomo.'
  WHERE category = 'jezyka' AND title = 'Łopatka'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Ułóż język w kształt łyżeczki i unieś jej brzegi.'
  WHERE category = 'jezyka' AND title = 'Łyżeczka'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Zaśpiewaj znaną melodię na sylabach la, lo, le.'
  WHERE category = 'jezyka' AND title = 'Śpiewające sylaby'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Wysuń wąski, spiczasty język jak żmijka i schowaj go szybko.'
  WHERE category = 'jezyka' AND title = 'Żmijka'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Delikatnie żuj brzegi języka bocznymi zębami.'
  WHERE category = 'jezyka' AND title = 'Żucie boków języka'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Dmuchaj powoli i równo, żeby bańka urosła, a nie pękła od razu.'
  WHERE category = 'oddechowe' AND title = 'Bańki mydlane'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Dmuchaj tak spokojnie, żeby płomyk się kłaniał, ale nie zgasł.'
  WHERE category = 'oddechowe' AND title = 'Gaszenie świeczki'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Sprawdź, jak długo potrafisz gwizdać bez nabierania powietrza.'
  WHERE category = 'oddechowe' AND title = 'Gwizdanie'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Ciągnij głoski na jednym wydechu tak długo, jak dasz radę.'
  WHERE category = 'oddechowe' AND title = 'Głoskowa zabawa'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Oddychaj brzuszkiem i wycisz się przed ćwiczeniami.'
  WHERE category = 'oddechowe' AND title = 'Głęboki oddech — relaks'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Kołysz misia brzuszkiem — to on pokaże, czy oddychasz dobrze.'
  WHERE category = 'oddechowe' AND title = 'Huśtanie misia'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Rusz pociąg własnym głosem: cz-cz-cz, tu-tu, szszsz.'
  WHERE category = 'oddechowe' AND title = 'Lokomotywa'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Nadmuchuj balon spokojnie i równo, bez szarpania.'
  WHERE category = 'oddechowe' AND title = 'Nadmuchiwanie balonu'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Utrzymaj piórko w powietrzu samym dmuchaniem.'
  WHERE category = 'oddechowe' AND title = 'Piórko w powietrzu'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Dmuchnij mocno i zobacz, jak daleko poleci piórko.'
  WHERE category = 'oddechowe' AND title = 'Pióropusz'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Przenoś drobiazgi słomką, nie pomagając sobie rękami.'
  WHERE category = 'oddechowe' AND title = 'Siła słomki'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Połącz oddech z ruchem: wdech na górze, wydech przy skłonie.'
  WHERE category = 'oddechowe' AND title = 'Skłony'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Doprowadź statek do celu, sterując nim samym dmuchaniem.'
  WHERE category = 'oddechowe' AND title = 'Statek na wodzie'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Sycz sssss i szum szszsz jak najdłużej na jednym wydechu.'
  WHERE category = 'oddechowe' AND title = 'Syczenie i szumienie'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Rób w wodzie równe bąbelki jak najdłużej — nie za szybko.'
  WHERE category = 'oddechowe' AND title = 'Słomka w wodzie'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Kręć wiatraczkiem jak najdłużej jednym dmuchnięciem.'
  WHERE category = 'oddechowe' AND title = 'Wiatraczek'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Dopchnij kulkę do mety, dmuchając przez słomkę.'
  WHERE category = 'oddechowe' AND title = 'Wyścigi papierowych kulek'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Powąchaj kwiatek powoli nosem i spokojnie wypuść powietrze buzią.'
  WHERE category = 'oddechowe' AND title = 'Wąchanie kwiatków'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Zrób w buzi małą dziurkę i dmuchnij cienkim strumyczkiem — poczuj chłód na dłoni.'
  WHERE category = 'oddechowe' AND title = 'Wąski strumień'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Chuchaj na dłonie raz krótko, raz długo — ogrzej je.'
  WHERE category = 'oddechowe' AND title = 'Zimne rączki'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Ziewnij szeroko, ale zupełnie bezgłośnie.'
  WHERE category = 'podniebienia' AND title = 'Ciche ziewanie'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Pochrap jak dziadek — raz na wdechu, raz na wydechu.'
  WHERE category = 'podniebienia' AND title = 'Dziadek chrapie'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Ciągnij aaa, ooo, uuu jak echo odbijające się w jaskini.'
  WHERE category = 'podniebienia' AND title = 'Echo w jaskini'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Powtarzaj wyraźnie ga, go, ge, gu, gi — z lekkim przeciąganiem.'
  WHERE category = 'podniebienia' AND title = 'Gagatek G'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Pogulgocz gardłem, jakbyś płukał je wodą.'
  WHERE category = 'podniebienia' AND title = 'Gołąbek grucha'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Pochrząkaj delikatnie: ykhm, ykhm — bez wysiłku.'
  WHERE category = 'podniebienia' AND title = 'Kaszlący miś'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Powtarzaj wyraźnie ka, ko, ke, ku, ki — z lekkim przeciąganiem.'
  WHERE category = 'podniebienia' AND title = 'Kotek K'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Zakukaj ku-ku jak kukułka w zegarze — rytmicznie.'
  WHERE category = 'podniebienia' AND title = 'Kukułka Ku-Ku'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Kończ sylaby twardo: ak, ok, ek, uk, ik, yk.'
  WHERE category = 'podniebienia' AND title = 'Mostki K'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Jedź równym tempem: aga, ogo, ege, ugu, ygy.'
  WHERE category = 'podniebienia' AND title = 'Pociąg sylabowy G'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Zahukaj długo huuu jak sowa.'
  WHERE category = 'podniebienia' AND title = 'Sowa Hu-Hu'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Mów na zmianę ga-ka, go-ko i wsłuchaj się w różnicę.'
  WHERE category = 'podniebienia' AND title = 'Sylabowe echo'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Powtarzaj równo: aka, oko, eke, uku, yky.'
  WHERE category = 'podniebienia' AND title = 'Wagoniki K'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Opuść żuchwę i ziewnij szeroko jak rozespany miś.'
  WHERE category = 'podniebienia' AND title = 'Ziewający miś'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Połykaj ślinę tak cicho, żeby wargi, policzki i broda się nie ruszały.'
  WHERE category = 'polykanie' AND title = 'Ciche połykanie'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Trzymaj chrupkę przy podniebieniu samym językiem, bez pomocy warg.'
  WHERE category = 'polykanie' AND title = 'Cukierek na podniebieniu'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Pij przez słomkę małymi łykami i po każdym spokojnie przełknij.'
  WHERE category = 'polykanie' AND title = 'Fontanna ze słomki'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Unieś czubek języka na górkę za górnymi zębami i potrzymaj.'
  WHERE category = 'polykanie' AND title = 'Języczek na górce'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Kląskaj rytmicznie jak galopujący konik.'
  WHERE category = 'polykanie' AND title = 'Kląskający konik'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Trzymaj język na górce i połykaj, ani razu nie zmieniając jego pozycji.'
  WHERE category = 'polykanie' AND title = 'Król języczek'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Zbierz ślinę, przyklej język do podniebienia i dopiero wtedy przełknij.'
  WHERE category = 'polykanie' AND title = 'Magiczna kropelka'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Kląskaj bardzo wolno i dokładnie, wyraźnie przyklejając język.'
  WHERE category = 'polykanie' AND title = 'Powolny konik'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Przełknij przy zamkniętej buzi i lekko złączonych zębach.'
  WHERE category = 'polykanie' AND title = 'Zamknięte usta'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Zatrzymaj łyk wody w buzi, ułóż język i dopiero przełknij.'
  WHERE category = 'polykanie' AND title = 'Zatrzymaj i połknij'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Przed każdym łykiem unieś język do podniebienia.'
  WHERE category = 'polykanie' AND title = 'Łyk po łyku'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Przełknij ślinę, nie wysuwając języka między zęby.'
  WHERE category = 'polykanie' AND title = 'Ślina jak profesjonalista'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Powtórz dokładnie to, co usłyszysz — bądź echem.'
  WHERE category = 'sluchowe' AND title = 'Echo'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Zgadnij, co wydaje ten dźwięk, i powiedz, gdzie można go usłyszeć.'
  WHERE category = 'sluchowe' AND title = 'Jaki to dźwięk?'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Zgadnij zwierzę po samym głosie i naśladuj je.'
  WHERE category = 'sluchowe' AND title = 'Odgłosy zwierząt'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Posłuchaj rytmu i wyklaszcz dokładnie taki sam.'
  WHERE category = 'sluchowe' AND title = 'Rytm klaskania'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Posłuchaj dwóch słów i powiedz, czy brzmią tak samo, czy inaczej.'
  WHERE category = 'sluchowe' AND title = 'Różnicowanie par'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Zasłoń oczy i wskaż palcem, skąd dochodzi dźwięk.'
  WHERE category = 'sluchowe' AND title = 'Szukaj dźwięku'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Przepychaj powietrze z jednego policzka do drugiego.'
  WHERE category = 'warg' AND title = 'Balonik z boku'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Nadmuchaj oba policzki i potrzymaj w nich powietrze chwilę.'
  WHERE category = 'warg' AND title = 'Balonikowe policzki'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Zrób dzióbek i cmoknij głośno kilka razy.'
  WHERE category = 'warg' AND title = 'Cmokanie'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Ułóż wargi do dmuchania i poruszaj nimi lekkie rzeczy.'
  WHERE category = 'warg' AND title = 'Dmuchamy!'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Rusz osobno górną i dolną wargą — same, bez otwierania szczęk.'
  WHERE category = 'warg' AND title = 'Górna i dolna warga'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Zaciśnij wargi mocno i potrzymaj kilka sekund.'
  WHERE category = 'warg' AND title = 'Mocny zacisk'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Wysuń wargi do przodu i otwieraj je w tej pozycji jak rybka.'
  WHERE category = 'warg' AND title = 'Otwórz i zamknij'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Utrzymaj ołówek samymi wargami, nie pomagając sobie zębami.'
  WHERE category = 'warg' AND title = 'Ołówek między wargami'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Rozluźnij wargi zupełnie i zaparskaj jak konik.'
  WHERE category = 'warg' AND title = 'Parskanie konia'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Rób na zmianę ryjek i szeroki uśmiech.'
  WHERE category = 'warg' AND title = 'Ryjek i uśmiech'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Wysuń zaokrąglone wargi w ryjek i potrzymaj go chwilę.'
  WHERE category = 'warg' AND title = 'Ryjek świnki'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Utrzymaj guzik samymi wargami, kiedy ktoś delikatnie ciągnie za sznurek.'
  WHERE category = 'warg' AND title = 'Silne wargi'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Wciągnij obie wargi do buzi i potrzymaj je tak chwilę.'
  WHERE category = 'warg' AND title = 'Ssanie warg'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Uśmiechnij się najszerzej, jak potrafisz — pokaż wszystkie zęby.'
  WHERE category = 'warg' AND title = 'Szeroki uśmiech'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Nałóż górną wargę na dolną, a potem dolną na górną.'
  WHERE category = 'warg' AND title = 'Warga na wardze'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Naśladuj zwierzęta i dźwięki: mu-mu, ku-ku, hau-hau, puk-puk.'
  WHERE category = 'warg' AND title = 'Wesołe odgłosy'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Przeganiaj powietrze od jednego policzka do drugiego.'
  WHERE category = 'warg' AND title = 'Wędrujące powietrze'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Oprzyj zęby na wardze i potrzymaj trzy sekundy — poczuj, jak naciskają.'
  WHERE category = 'warg' AND title = 'Zęby na wardze'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Przyciągnij brodę do szyi, pomagając sobie palcem.'
  WHERE category = 'zuchwa' AND title = 'Broda do szyi'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Ziewaj szeroko i spokojnie, zupełnie bez głosu.'
  WHERE category = 'zuchwa' AND title = 'Ciche ziewanie'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Żuj wyobrażonego, bardzo ciągnącego się cukierka — wargami też.'
  WHERE category = 'zuchwa' AND title = 'Ciągliwy cukierek'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Żuj coraz większą gumę — ruchy mają rosnąć, buzia zostaje zamknięta.'
  WHERE category = 'zuchwa' AND title = 'Coraz większa guma'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Przesuwaj dolnymi zębami po górnej wardze, a potem górnymi po dolnej.'
  WHERE category = 'zuchwa' AND title = 'Grzebień'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Kląskaj językiem i jednocześnie luźno opuszczaj żuchwę.'
  WHERE category = 'zuchwa' AND title = 'Kląskający konik'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Opuszczaj żuchwę powoli w dół jak łyżkę koparki i unoś z powrotem.'
  WHERE category = 'zuchwa' AND title = 'Koparka'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Otwórz buzię szeroko jak krokodyl i zamknij ją zdecydowanie.'
  WHERE category = 'zuchwa' AND title = 'Krokodyl'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Przeżuwaj jak krowa — raz w lewo, raz w prawo.'
  WHERE category = 'zuchwa' AND title = 'Krówka gryzie'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Wysuń żuchwę mocno do przodu jak małpka.'
  WHERE category = 'zuchwa' AND title = 'Małpka'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Sprawdź palcami, jak szeroko otwierać buzię, i zapamiętaj tę pozycję.'
  WHERE category = 'zuchwa' AND title = 'Mądre paluszki'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Mów pa, ba, da zupełnie bezgłośnie, wyraźnie otwierając buzię.'
  WHERE category = 'zuchwa' AND title = 'Nieme sylaby'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Otwieraj buzię szeroko jak przy a i spokojnie zamykaj.'
  WHERE category = 'zuchwa' AND title = 'Otwieranie i zamykanie domku'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Przesuwaj żuchwę do przodu i do tyłu, a potem w prawo i w lewo.'
  WHERE category = 'zuchwa' AND title = 'Piła'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Opuszczaj i unoś żuchwę rytmicznie, coraz szybciej.'
  WHERE category = 'zuchwa' AND title = 'Szybka winda'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Nagryzaj dolną wargę górnymi zębami — głęboko, ale bez bólu.'
  WHERE category = 'zuchwa' AND title = 'Warga w pułapce'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Opuść żuchwę najniżej, jak potrafisz, i powoli unieś ją z powrotem.'
  WHERE category = 'zuchwa' AND title = 'Wolna winda'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Pochyl głowę i kołysz luźno żuchwą, jakby zamiatała podłogę.'
  WHERE category = 'zuchwa' AND title = 'Zamiatanie podłogi'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Zrób zdziwioną minę i na wydechu ciągnij aaa albo ooo.'
  WHERE category = 'zuchwa' AND title = 'Zdziwiona mina'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Ziewnij naturalnie i poczuj, jak żuchwa opada sama.'
  WHERE category = 'zuchwa' AND title = 'Ziewający księżyc'
    AND created_by IS NULL;
UPDATE public.exercises SET description_child = 'Żuj gumę przy zamkniętej buzi.'
  WHERE category = 'zuchwa' AND title = 'Żujemy gumę'
    AND created_by IS NULL;

-- ── 4. Kontrola ─────────────────────────────────────────────
-- Po uruchomieniu powinno pokazać tyle samo, ile mówi nagłówek wyżej.
SELECT count(*) AS z_opisem_dla_dziecka
FROM public.exercises
WHERE description_child IS NOT NULL AND archived_at IS NULL;
