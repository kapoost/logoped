-- ============================================================
-- seed.sql
-- Publiczna baza ćwiczeń logopedycznych
-- created_by = NULL oznacza ćwiczenie publiczne (admin)
-- Uruchamiać PO wszystkich migracjach
-- ============================================================

INSERT INTO public.exercises
  (title, description, instructions, category, difficulty, target_sounds, duration_seconds, emoji, created_by, is_public)
VALUES

-- ════════════════════════════════════════════════════════════
-- 💨 ĆWICZENIA ODDECHOWE
-- ════════════════════════════════════════════════════════════

(
  'Dmuchanie balonka',
  'Ćwiczenie wydłużające wydech i wzmacniające mięśnie oddechowe.',
  '1. Usiądź prosto i nabierz powoli powietrze przez nos — licz do 3.
2. Zatrzymaj powietrze na chwilę.
3. Dmuchaj powoli przez usta, jakbyś nadmuchiwał wielki balon.
4. Poczuj jak policzki się lekko nadymają.
5. Powtórz 5 razy.',
  'oddechowe', 'latwe', NULL, 60, '🎈', NULL, TRUE
),
(
  'Zgaś świeczkę',
  'Ćwiczenie kontroli siły i czasu wydechu.',
  '1. Unieś rękę na 15–20 cm od ust.
2. Wyobraź sobie, że na palcu wskazującym płonie świeczka.
3. Weź powietrze nosem.
4. Jednym krótkim, mocnym dmuchnięciem zgaś płomień.
5. Powtórz 8 razy.',
  'oddechowe', 'latwe', NULL, 60, '🕯️', NULL, TRUE
),
(
  'Słomka w wodzie',
  'Ćwiczenie wydłużonego wydechu i kontroli przepływu powietrza.',
  '1. Włóż słomkę do szklanki z wodą.
2. Nabierz spokojnie powietrze przez nos.
3. Wydychaj przez słomkę — rób bąbelki jak najdłużej.
4. Staraj się robić bąbelki równomiernie — nie za szybko.
5. Powtórz 5 razy. Kto zrobi bąbelki najdłużej?',
  'oddechowe', 'latwe', NULL, 90, '🥤', NULL, TRUE
),
(
  'Wąchanie kwiatka',
  'Ćwiczenie kontrolowanego wdechu i wydechu.',
  '1. Wyobraź sobie piękny, pachnący kwiatek.
2. Powoli wdychaj przez nos — cały czas wyobrażaj sobie zapach.
3. Zatrzymaj powietrze na 3 sekundy.
4. Powoli wydychaj przez usta przez 5 sekund.
5. Powtórz 6 razy.',
  'oddechowe', 'latwe', NULL, 60, '🌸', NULL, TRUE
),
(
  'Pióropusz',
  'Ćwiczenie precyzji i siły wydechu.',
  '1. Połóż piórko lub skrawek bibuły na dłoni.
2. Unieś dłoń na wysokość ust.
3. Nabierz powietrze przez nos.
4. Dmuchnij — niech piórko poleci jak najdalej!
5. Powtórz 5 razy. Kto wyśle piórko najdalej?',
  'oddechowe', 'latwe', NULL, 60, '🪶', NULL, TRUE
),
(
  'Bańki mydlane',
  'Ćwiczenie kontroli równomiernego, długiego wydechu.',
  '1. Zanurz patyczek w płynie do baniek.
2. Nabierz spokojnie powietrze przez nos.
3. Przykładaj usta do patyczka i dmuchaj bardzo powoli i równomiernie.
4. Staraj się zrobić jak największą bańkę bez jej pęknięcia.
5. Powtórz 5 razy.',
  'oddechowe', 'latwe', NULL, 90, '🫧', NULL, TRUE
),
(
  'Wąski strumień',
  'Ćwiczenie precyzji wydechu — przygotowanie do głosek szumiących.',
  '1. Złącz usta jak do gwizdania (mały otwór).
2. Nabierz powietrze przez nos.
3. Dmuchnij wąskim strumieniem powietrza przez 5 sekund.
4. Przyłóż grzbiet dłoni — powinieneś czuć chłodny strumień.
5. Powtórz 6 razy.',
  'oddechowe', 'srednie', ARRAY['sz','cz','s','z'], 90, '💨', NULL, TRUE
),
(
  'Głęboki oddech — relaks',
  'Ćwiczenie oddychania przeponowego, rozluźnia przed sesjami.',
  '1. Połóż jedną rękę na brzuchu, drugą na klatce piersiowej.
2. Wdychaj powoli przez nos — ręka na brzuchu powinna się unosić.
3. Zatrzymaj powietrze na 2 sekundy.
4. Powoli wydychaj przez usta — ręka na brzuchu opada.
5. Powtórz 8 razy. Klatka piersiowa powinna się ruszać jak najmniej.',
  'oddechowe', 'srednie', NULL, 120, '🧘', NULL, TRUE
),

-- ════════════════════════════════════════════════════════════
-- 👄 ĆWICZENIA WARG
-- ════════════════════════════════════════════════════════════

(
  'Całuski',
  'Wzmacnianie mięśni warg — przygotowanie do głosek p, b, m.',
  '1. Ściśnij wargi mocno razem jak do pocałunku.
2. Wysuń mocno do przodu.
3. Utrzymaj 2 sekundy.
4. Wróć do pozycji wyjściowej.
5. Powtórz rytmicznie 10 razy.',
  'warg', 'latwe', ARRAY['p','b','m'], 60, '💋', NULL, TRUE
),
(
  'Szeroki uśmiech',
  'Rozciąganie mięśni warg — przygotowanie do głosek s, z, c, dz.',
  '1. Rozciągnij usta jak najszerzej — pokaż wszystkie zęby!
2. Utrzymaj pozycję przez 3 sekundy.
3. Rozluźnij wargi.
4. Powtórz 8 razy.',
  'warg', 'latwe', ARRAY['s','z','c','dz'], 60, '😁', NULL, TRUE
),
(
  'Ryjek / trąbka',
  'Wzmacnianie mięśnia okrężnego ust — przygotowanie do głosek u, o, sz.',
  '1. Ściągnij wargi w wąski ryjek jak trąba słonia.
2. Utrzymaj przez 3 sekundy — wargi powinny być napięte.
3. Rozluźnij.
4. Powtórz 8 razy.',
  'warg', 'latwe', ARRAY['sz','cz','u'], 60, '🐘', NULL, TRUE
),
(
  'Uśmiech ↔ ryjek',
  'Ćwiczenie naprzemienne — zwinność warg.',
  '1. Zacznij od szerokiego uśmiechu (pokaż zęby).
2. Przejdź płynnie do ryjka (usta wysunięte do przodu).
3. Wróć do uśmiechu.
4. Utrzymuj każdą pozycję 2 sekundy.
5. Wykonaj 10 zmian — utrzymuj rytm.',
  'warg', 'srednie', ARRAY['s','sz','u'], 90, '😊', NULL, TRUE
),
(
  'Dmuchanie policzków',
  'Wzmacnianie mięśni policzków i warg.',
  '1. Nabierz dużo powietrza przez nos.
2. Zamknij usta — nadmij oba policzki naraz jak kulka.
3. Utrzymaj 3 sekundy.
4. Wypuść powietrze przez złączone usta — powoli!
5. Powtórz 5 razy.',
  'warg', 'latwe', NULL, 60, '🐡', NULL, TRUE
),
(
  'Balonik z boku',
  'Ćwiczenie sterowania powietrzem w jamie ustnej.',
  '1. Nabierz powietrze.
2. Przepchnij je do lewego policzka — nadmuchaj jak balonik.
3. Przepchnij do prawego policzka.
4. Lewy → prawy → lewy → prawy.
5. Wykonaj 10 zmian spokojnie i wyraźnie.',
  'warg', 'srednie', NULL, 90, '🎈', NULL, TRUE
),
(
  'Parskanie konia',
  'Relaksowanie i wibrowanie warg.',
  '1. Rozluźnij wargi zupełnie.
2. Weź powietrze przez nos.
3. Dmuchnij przez luźne wargi — wydaj dźwięk jak koń parskający.
4. Wibracje warg muszą być wyraźne i równomiernie.
5. Powtórz 5 razy po 2–3 sekundy każde.',
  'warg', 'latwe', NULL, 60, '🐴', NULL, TRUE
),
(
  'Zęby na wardze',
  'Ćwiczenie kontroli i siły warg — przygotowanie do f, w.',
  '1. Lekko ugryź górną wargę górnymi zębami.
2. Utrzymaj 3 sekundy — czuj jak zęby naciskają wargę.
3. Wróć do pozycji wyjściowej.
4. Teraz ugryź dolną wargę dolnymi zębami.
5. Utrzymaj 3 sekundy. Powtórz 6 razy dla każdej wargi.',
  'warg', 'srednie', ARRAY['f','w'], 90, '😬', NULL, TRUE
),

-- ════════════════════════════════════════════════════════════
-- 👅 ĆWICZENIA JĘZYKA
-- ════════════════════════════════════════════════════════════

(
  'Kotek',
  'Wzmacnianie pionowego ruchu języka — przygotowanie do l, r.',
  '1. Otwórz szeroko usta.
2. Wysuń szeroki, płaski język.
3. Rób powolne ruchy góra–dół jak kotek pijący mleko.
4. Pilnuj, żeby język był szeroki i płaski przez cały czas!
5. Powtórz 10 razy powoli i wyraźnie.',
  'jezyka', 'latwe', ARRAY['l','r'], 60, '🐱', NULL, TRUE
),
(
  'Zegar',
  'Ćwiczenie bocznych ruchów języka.',
  '1. Otwórz usta — szeroko jak u dentysty.
2. Wysuń język na prawą stronę jak najdalej.
3. Wróć do środka.
4. Wysuń na lewą stronę.
5. Tic-tac! Powtórz 10 razy na każdą stronę. Nie ruszaj szczęką!',
  'jezyka', 'latwe', NULL, 60, '🕐', NULL, TRUE
),
(
  'Malarz',
  'Rozciąganie wędzidełka języka i unoszenie czubka — dla głoski r.',
  '1. Otwórz usta szeroko jak możesz.
2. Czubkiem języka dotknij górnych zębów od wewnątrz.
3. Przesuwaj język po podniebieniu powoli ku gardłu — malujesz sufit!
4. Wróć tak samo do przednich zębów.
5. Powtórz 8 razy. To ważne ćwiczenie przed głoską R!',
  'jezyka', 'srednie', ARRAY['r'], 90, '🖌️', NULL, TRUE
),
(
  'Żmijka',
  'Ćwiczenie pionizacji i spionowania języka — dla głosek sz, cz.',
  '1. Zamknij usta.
2. Wysuń wąski, spiczasty język jak żmijka.
3. Język musi być naprawdę wąski — ściśnij boki!
4. Utrzymaj 2 sekundy i szybko schowaj.
5. Powtórz 10 razy.',
  'jezyka', 'latwe', ARRAY['sz','cz','r'], 60, '🐍', NULL, TRUE
),
(
  'Celownik',
  'Ćwiczenie pionowego zakresu ruchu języka.',
  '1. Otwórz usta szeroko.
2. Czubkiem języka staraj się dotknąć nosa — unosisz język ku górze.
3. Następnie staraj się dotknąć brody — opuszczasz jak najniżej.
4. Góra–dół = jedna runda.
5. Powtórz 8 rund powoli. Nie pomagaj sobie wargami!',
  'jezyka', 'srednie', NULL, 90, '🎯', NULL, TRUE
),
(
  'Smakosz',
  'Ćwiczenie okrężnych ruchów języka po wargach.',
  '1. Otwórz lekko usta.
2. Czubkiem języka oblizuj górną wargę — od lewej do prawej.
3. Teraz oblizuj dolną wargę — od lewej do prawej.
4. To jedna runda.
5. Wykonaj 5 rund. Jakbyś zjadał coś pysznego!',
  'jezyka', 'latwe', NULL, 60, '😋', NULL, TRUE
),
(
  'Grzyb',
  'Rozciąganie wędzidełka języka — kluczowe dla głoski r.',
  '1. Otwórz usta szeroko.
2. Przyciśnij cały język płasko do podniebienia jak grzyb do drzewa.
3. Utrzymaj 5 sekund — czuj napięcie pod językiem (wędzidełko!).
4. Oderwij język z głośnym kliknięciem.
5. Powtórz 8 razy. To najtrudniejsze ale najważniejsze ćwiczenie!',
  'jezyka', 'trudne', ARRAY['r'], 120, '🍄', NULL, TRUE
),
(
  'Winda',
  'Ćwiczenie pionizacji języka — unoszenie do podniebienia.',
  '1. Otwórz usta.
2. Trzymaj język płasko na dole jamy ustnej.
3. Powoli unoś cały język ku podniebieniu jak winda jadąca w górę.
4. Dotknij podniebienia — utrzymaj 2 sekundy.
5. Opuść powoli. Powtórz 8 razy.',
  'jezyka', 'srednie', ARRAY['r','l'], 90, '🛗', NULL, TRUE
),
(
  'Kółko',
  'Ćwiczenie zwinności języka — trudne!',
  '1. Otwórz usta.
2. Czubkiem języka zataczaj kółka za zębami — po wewnętrznej stronie.
3. 5 kółek w lewo (wolno i wyraźnie).
4. 5 kółek w prawo.
5. Pilnuj żeby czubek dotykał zębów przez cały czas!',
  'jezyka', 'trudne', NULL, 120, '🔄', NULL, TRUE
),
(
  'Klaskanie językiem',
  'Wzmacnianie mięśni języka i nauka unoszenia czubka — dla r.',
  '1. Przyciśnij szeroki język do podniebienia.
2. Trzymaj go mocno przez chwilę.
3. Gwałtownie oderwij — usłyszysz głośne klaśnięcie!
4. Jak koń stukający kopytem o ziemię.
5. Powtórz 10 klaśnięć. Im głośniej, tym lepiej!',
  'jezyka', 'latwe', ARRAY['r'], 60, '👅', NULL, TRUE
),
(
  'Liczenie zębów językiem',
  'Ćwiczenie precyzyjnych ruchów czubka języka.',
  '1. Zamknij usta, zęby lekko złączone.
2. Czubkiem języka dotykaj kolejno każdego górnego zęba od lewej do prawej.
3. Teraz dolne zęby — od lewej do prawej.
4. Staraj się dotykać dokładnie każdego zęba.
5. Wykonaj 3 rundy. Nie spiesz się!',
  'jezyka', 'srednie', NULL, 90, '🦷', NULL, TRUE
),

-- ════════════════════════════════════════════════════════════
-- 🔤 ĆWICZENIA ARTYKULACYJNE
-- ════════════════════════════════════════════════════════════

(
  'Głoska S — syk węża',
  'Nauka poprawnej artykulacji głoski S.',
  '1. Złącz zęby delikatnie.
2. Rozciągnij usta jak do uśmiechu.
3. Czubek języka schowaj za dolnymi zębami.
4. Wydaj długi syk: sssssss.
5. Dotknij szyi — nie powinna wibrować (S jest bezdźwięczne!).
6. Powtórz 5 razy po 5 sekund.',
  'artykulacyjne', 'latwe', ARRAY['s'], 90, '🐍', NULL, TRUE
),
(
  'Głoska Z — buczenie pszczoły',
  'Nauka poprawnej artykulacji głoski Z.',
  '1. Pozycja jak przy S — zęby złączone, usta w uśmiechu.
2. Czubek języka za dolnymi zębami.
3. Dodaj głos — dotknij krtani, powinna wibrować!
4. Wydaj buczenie pszczoły: zzzzzzz.
5. Poczuj różnicę między S (cicho) a Z (głośno).
6. Powtórz 5 razy po 5 sekund.',
  'artykulacyjne', 'latwe', ARRAY['z'], 90, '🐝', NULL, TRUE
),
(
  'Głoska C — cyk zegara',
  'Nauka artykulacji głoski C — krótkie, wybuchowe.',
  '1. Złącz zęby.
2. Czubek języka za dolnymi zębami.
3. Wydaj krótkie, szybkie uderzenie: c-c-c.
4. Jak cykanie zegara — krótko i ostro!
5. Powtórz serię 10 razy. Nie przedłużaj dźwięku.',
  'artykulacyjne', 'latwe', ARRAY['c'], 90, '⏱️', NULL, TRUE
),
(
  'Głoska SZ — szum lasu',
  'Nauka artykulacji głoski SZ.',
  '1. Lekko zaokrąglij usta (nie tak jak przy S).
2. Język szeroki, uniesiony ku górze — ale nie dotyka podniebienia.
3. Wydaj długi szum: szszszszsz.
4. Wyobraź sobie wiatr w lesie.
5. Powtórz 5 razy po 5 sekund.',
  'artykulacyjne', 'srednie', ARRAY['sz'], 90, '🌲', NULL, TRUE
),
(
  'Głoska CZ — pociąg',
  'Nauka artykulacji głoski CZ.',
  '1. Pozycja jak przy SZ — usta zaokrąglone, język ku górze.
2. Wydaj krótkie uderzenia: cz-cz-cz.
3. Jak pociąg ruszający z miejsca — cz-cz-cz!
4. Powtórz serię 10 razy.
5. Pilnuj żeby usta były zaokrąglone, nie rozciągnięte!',
  'artykulacyjne', 'srednie', ARRAY['cz'], 90, '🚂', NULL, TRUE
),
(
  'Głoska DŻ — silnik motocykla',
  'Nauka artykulacji głoski DŻ — najtrudniejsza z szumiących.',
  '1. Pozycja jak CZ — usta zaokrąglone, język ku górze.
2. Dodaj głos — dotknij krtani, powinna wibrować!
3. Wydaj dźwięk silnika: dżdżdżdż.
4. Jak motocykl ruszający spod świateł!
5. Powtórz serię 8 razy. Czujesz wibracje krtani?',
  'artykulacyjne', 'trudne', ARRAY['dż'], 90, '🏍️', NULL, TRUE
),
(
  'Głoska L — łyżeczka',
  'Nauka poprawnej artykulacji głoski L.',
  '1. Otwórz usta szeroko.
2. Czubek języka unieś i dotknij górnych zębów od wewnątrz.
3. Trzymając czubek — powiedz: lll-la-le-li-lo-lu.
4. Czubek języka nie może się ruszać od zębów!
5. Powtórz 5 serii. To podstawa dla głoski R.',
  'artykulacyjne', 'latwe', ARRAY['l'], 90, '🥄', NULL, TRUE
),
(
  'Głoska R — silnik auta',
  'Ćwiczenie prowadzące do artykulacji najtrudniejszej głoski.',
  '1. Czubek języka unieś za górne zęby (jak przy L).
2. Zacznij od kombinacji D+R: dr-dr-dr.
3. Dmuchaj lekko — czubek języka zaczyna drżeć.
4. Następnie tr-tr-tr, trrr, rrr.
5. Powtórz 5 razy. Nie spiesz się — R to maraton, nie sprint!',
  'artykulacyjne', 'trudne', ARRAY['r'], 120, '🚗', NULL, TRUE
),
(
  'Głoska K — kaszlenie',
  'Nauka artykulacji głoski K — tylnojęzykowa.',
  '1. Tył języka unieś — dotknij podniebienia miękkiego.
2. Przód języka leży spokojnie — nie rusza się!
3. Wydaj głośne k-k-k jak kaszlenie.
4. Możesz przytrzymać czubek języka palcem, żeby nie skakał.
5. Powtórz 10 razy.',
  'artykulacyjne', 'latwe', ARRAY['k'], 60, '😤', NULL, TRUE
),
(
  'Głoska G — żaba kumka',
  'Nauka artykulacji głoski G — dźwięczna wersja K.',
  '1. Pozycja jak przy K — tył języka dotyka podniebienia.
2. Dodaj głos! Dotknij krtani — powinna wibrować.
3. Żaba kumka: g-g-g, ge-ge-ge.
4. Poczuj różnicę: K = bezdźwięczne, G = dźwięczne.
5. Powtórz 10 razy.',
  'artykulacyjne', 'latwe', ARRAY['g'], 60, '🐸', NULL, TRUE
),
(
  'Sylaby z S–SZ',
  'Ćwiczenie różnicowania głosek S i SZ w sylabach.',
  '1. Powtarzaj za logopedą na zmianę: sa-sza, se-sze, si-szi.
2. Pilnuj: przy S — usta w uśmiechu, przy SZ — usta zaokrąglone.
3. sa — sza — sa — sza (5 razy każda para).
4. Staraj się wyraźnie pokazać różnicę!',
  'artykulacyjne', 'srednie', ARRAY['s','sz'], 120, '🔤', NULL, TRUE
),
(
  'Sylaby z C–CZ',
  'Ćwiczenie różnicowania głosek C i CZ.',
  '1. Powtarzaj na zmianę: ca-cza, ce-cze, cu-czu.
2. Przy C — usta w uśmiechu. Przy CZ — usta zaokrąglone.
3. ca — cza — ca — cza (5 razy każda para).
4. Wyraźnie pokazuj różnicę ułożeniem warg!',
  'artykulacyjne', 'srednie', ARRAY['c','cz'], 120, '🔤', NULL, TRUE
),

-- ════════════════════════════════════════════════════════════
-- ĆWICZENIA PODNIEBIENIA MIĘKKIEGO
-- ════════════════════════════════════════════════════════════

(
  'Ziewanie',
  'Unoszenie podniebienia miękkiego — zapobiega mowie nosowej.',
  '1. Otwórz usta szeroko jak przy ziewaniu.
2. Poczuj jak podniebienie miękkie (tyłek podniebienia) unosi się ku górze.
3. Utrzymaj pozycję przez 3 sekundy.
4. Zamknij usta i rozluźnij.
5. Powtórz 5 razy. Możesz przed lustrem — widać łączkę!',
  'podniebienia', 'latwe', NULL, 60, '🥱', NULL, TRUE
),
(
  'Chrapanie',
  'Ćwiczenie wibracji tylnej części gardła.',
  '1. Nabierz powietrza przez usta.
2. Wydaj dźwięk jak przy chrapaniu — wibruj tylną częścią gardła.
3. To dźwięk „chrrr" albo „grr" — tył gardła drży.
4. Utrzymaj wibrację przez 3 sekundy.
5. Powtórz 5 razy. Zabawne ćwiczenie!',
  'podniebienia', 'latwe', NULL, 60, '😴', NULL, TRUE
),
(
  'Płukanie gardła',
  'Intensywne ćwiczenie podniebienia miękkiego.',
  '1. Weź mały łyk wody do ust.
2. Odchyl lekko głowę do tyłu.
3. Postaraj się „płukać" gardło przez 5 sekund — woda wibruje w gardle.
4. Wypluj wodę (nie połykaj!).
5. Powtórz 3 razy. Uwaga — tylko pod okiem rodzica!',
  'podniebienia', 'srednie', NULL, 90, '💧', NULL, TRUE
),
(
  'AAAA — głośne i długie',
  'Podstawowe ćwiczenie unoszenia podniebienia.',
  '1. Szeroko otwórz usta jak u dentysty.
2. Powiedz głośne AAAA przez 5 sekund.
3. Poczuj jak podniebienie miękkie unosi się i opada.
4. Głos powinien być czysty — bez nosowania.
5. Powtórz 5 razy. Możesz sprawdzić przed lustrem!',
  'podniebienia', 'latwe', NULL, 60, '😮', NULL, TRUE
),

-- ════════════════════════════════════════════════════════════
-- 👂 ĆWICZENIA SŁUCHOWE
-- ════════════════════════════════════════════════════════════

(
  'Różnicowanie par',
  'Ćwiczenie słuchu fonemowego — rozróżnianie podobnych głosek.',
  '1. Logopeda mówi dwa słowa (np. kosa / koza, bas / pas).
2. Dziecko słucha uważnie — czy słowa są TAKIE SAME czy RÓŻNE?
3. Jeśli różne — jakim dźwiękiem się różnią?
4. Możesz wskazać odpowiedni obrazek.
5. Zacznij od łatwych par, potem trudniejsze.',
  'sluchowe', 'latwe', NULL, 120, '👂', NULL, TRUE
),
(
  'Echo',
  'Ćwiczenie precyzyjnego powtarzania sylab i słów.',
  '1. Logopeda mówi sylabę lub słowo.
2. Dziecko powtarza DOKŁADNIE TO SAMO — jest echem.
3. Zacznij od prostych sylab: ma, ba, da, la, ka.
4. Potem wyrazy 2-sylabowe: mama, tata, lala.
5. Następnie krótkie zdania.',
  'sluchowe', 'latwe', NULL, 90, '🎤', NULL, TRUE
),
(
  'Rytm klaskania',
  'Ćwiczenie słuchu rytmicznego i pamięci słuchowej.',
  '1. Logopeda klaszcze rytm (np. klap-klap-klap-klaaap).
2. Dziecko słucha i odtwarza dokładnie ten sam rytm.
3. Zacznij od 2 elementów.
4. Dodawaj kolejne — 3, 4, 5 elementów.
5. Możesz też używać bębenka lub tupania.',
  'sluchowe', 'latwe', NULL, 90, '👏', NULL, TRUE
),
(
  'Odgłosy zwierząt',
  'Ćwiczenie rozróżniania dźwięków i naśladowania.',
  '1. Puść nagranie odgłosu zwierzęcia (bez pokazywania obrazka!).
2. Dziecko zgaduje co to za zwierzę.
3. Naśladuje dźwięk razem z nagraniem.
4. Zacznij od łatwych: krowa, pies, kot.
5. Trudniejsze: sowa, cykada, żaba.',
  'sluchowe', 'latwe', NULL, 120, '🐄', NULL, TRUE
),
(
  'Szukaj dźwięku',
  'Ćwiczenie lokalizacji źródła dźwięku (koncentracja słuchowa).',
  '1. Dziecko zasłania oczy.
2. Logopeda lub rodzic klaszcze, dzwoni lub puka z różnych stron.
3. Dziecko wskazuje palcem skąd dochodzi dźwięk.
4. Sprawdź — czy dobrze wskazał?
5. Powtórz 8 razy z różnych kierunków.',
  'sluchowe', 'latwe', NULL, 90, '🔔', NULL, TRUE
),
(
  'Jaki to dźwięk?',
  'Ćwiczenie identyfikacji dźwięków otoczenia.',
  '1. Puść nagranie dźwięków z otoczenia (deszcz, samochód, dzwonek).
2. Dziecko mówi co to za dźwięk.
3. Opisuje gdzie ten dźwięk można usłyszeć.
4. Naśladuje dźwięk głosem jeśli potrafi.
5. Zacznij od 5 dźwięków i zwiększaj stopniowo.',
  'sluchowe', 'srednie', NULL, 120, '🔊', NULL, TRUE
);

-- Sprawdź liczbę wstawionych ćwiczeń
SELECT
  category,
  COUNT(*) AS liczba_cwiczen
FROM public.exercises
WHERE created_by IS NULL
GROUP BY category
ORDER BY category;
