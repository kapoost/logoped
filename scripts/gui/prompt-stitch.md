# Prompt do Google Stitch — nowe GUI aplikacji LogoPed

Jak używać: **sekcję 1 wklej raz** jako brief projektu, potem generuj ekran po ekranie,
wklejając kolejne prompty z sekcji 3. Sekcja 2 to słownik, do którego odwołują się
wszystkie prompty ekranowe — bez niego Stitch wymyśli własne kolory i rozmiary.

Prompty są po angielsku, bo na tym Stitch pracuje najlepiej. Wszystkie teksty
interfejsu podane są **dosłownie po polsku** — inaczej wygeneruje angielskie UI.

---

## 1. Brief projektu (wklej jako pierwszy)

```
You are designing a complete mobile-first UI for LogoPed — a Polish speech therapy
app used by three different people with sharply different needs. It is an installed
PWA, used on phones, in Polish. Design at 390×844 as the baseline and make every
screen hold at 375×667 without the primary action falling below the fold.

THE THREE USERS

1. A CHILD, age 4–9, often a pre-reader or weak reader, sometimes with motor
   difficulties. Uses the app daily for 5–15 minutes, usually with a parent nearby.
   This user cannot navigate by reading. Everything must be carried by illustration,
   colour, size and one obvious next action per screen.
2. A SPEECH THERAPIST (logopeda). A professional on a tight schedule who manages
   10–40 children, assembles exercise plans, writes notes, reviews progress. Needs
   density, scanning and precision — the opposite of the child's screens.
3. AN ADMIN. Manages therapists, licences and the shared exercise database.
   Desktop-leaning, tabular, utilitarian.

Do not apply one visual language across all three. The child's screens should feel
like a picture book that responds; the therapist's like a well-made clinical tool;
the admin's like a quiet back office. They share a palette and a logo, nothing else.

WHAT THE PRODUCT ACTUALLY DOES

A therapist assigns a child a plan — an ordered list of exercises with a repetition
count for each. Every day the child opens the app, sees today's exercises, opens one
at a time, performs the movement the required number of times, and taps a big button
once per repetition. Finishing an exercise awards points; finishing the whole set
triggers a celebration. Progress is tracked as a daily streak, stars and a growing
mascot parrot.

Each exercise carries: a title, a one-sentence description written FOR THE CHILD,
numbered steps, a difficulty level, a repetition count, an illustration, and
sometimes a sagittal cross-section drawing of the mouth showing tongue position.

THE HARD CONSTRAINT THAT SHAPES THE CHILD'S SCREENS

Every exercise has a square illustration — a friendly animal mascot on a plain cream
background, one recurring character per exercise category. These illustrations are
the product's main asset and its main way of communicating with a non-reading child.
They must be large and must not be reduced to icons.

This creates a vertical budget problem on the exercise screen, which currently holds,
top to bottom: illustration, title, difficulty chip, a circular repetition counter, a
row of repetition dots, the description, the numbered steps, and the primary action
button — plus a fixed bottom navigation bar. At 390×844 that is roughly 110 px more
content than fits. The current design solves it badly: the counter block crowds the
description, and the steps are squeezed into a ~105 px scrolling sliver that shows
one and a half steps.

SOLVE THIS EXPLICITLY. Propose a layout where the illustration stays large, the
primary action is always reachable without scrolling, and the description plus at
least three steps are readable at once. Reorganising, collapsing, paging or
progressively disclosing this content is in scope — do not just shrink everything.

RULES THAT ARE NOT NEGOTIABLE

- Primary action on the child's screens: minimum 64 px tall, full width, reachable
  with a thumb, visible without scrolling, on every supported screen height.
- No horizontal scrolling anywhere, at any supported width.
- The child's screens carry at most one primary action. No competing buttons.
- Text for the child: minimum 16 px, high contrast, short sentences.
- Numbers that the child must read (repetitions, points) are large and in a
  consistent place across screens.
- Respect prefers-reduced-motion. Celebrations must have a calm variant.
- The therapist and admin screens may be dense, but tap targets stay at least 44 px.

Deliver: a cohesive screen set, a stated type scale, a spacing scale, and component
specs for the recurring pieces listed in the design-system section.
```

---

## 2. Design system (wklej jako drugi, przed ekranami)

```
Use this as the project's design system. Keep the brand hue — it is already in
production and in the installed-app icon.

COLOUR
- Brand primary: #6C5CE7 (violet). Shades in use: #f5f3ff, #ede9fe, #ddd6fe,
  #a78bfa, #8b5cf6, #6C5CE7, #5b21b6, #4c1d95, #3d2b8e.
- The child's screens currently lean on a violet gradient header. You may replace
  the gradient, but keep violet as the identity colour.
- Illustration background is a fixed warm cream (#FDF6E3-ish) baked into every
  image file. Pick surfaces that sit well against cream — pure white tiles make the
  illustrations look dirty. This is a real constraint, not a preference.
- Semantic colours separate from the brand: success/completed, warning, danger.
  Difficulty levels are three steps: łatwe (easy, green), średnie (medium, amber),
  trudne (hard, red).
- Design light theme first; state what a dark theme would do.

TYPE
- Polish text with diacritics: ą ć ę ł ń ó ś ź ż. Whatever face you choose must
  render them correctly — check "Ćwiczenia", "Język", "Żuchwa", "Połykanie".
- Two roles: a friendly rounded face for the child, a neutral workhorse for the
  therapist and admin. State the scale explicitly.

RECURRING COMPONENTS — give each a spec
1. Exercise tile — square illustration + title + meta. Appears at many sizes, from a
   large feature card down to a 56 px row thumbnail. The illustration must stay
   recognisable at the smallest size; define the floor.
2. Repetition counter — shows progress through one exercise, e.g. 3 of 5. Currently
   a 140 px ring plus a separate row of dots, which duplicates the same information
   twice and eats vertical space. Replace it with one device.
3. Step list — numbered instructions, 1 to 8 items, must be readable by a parent
   reading aloud.
4. Primary action button — the child taps this once per repetition, dozens of times
   per session. Design its resting, pressed and completed states.
5. Streak badge, star/points display, achievement card.
6. Mouth cross-section panel — a line-art sagittal drawing of the oral cavity shown
   beside the illustration, with a caption and a review-status chip. Sometimes two
   drawings side by side for exercises that contrast two sounds.
7. Bottom navigation, four items, child-facing: Ćwiczenia, Kalendarz, Nagrody, Papuga.
8. Therapist side navigation and patient list row.
9. Empty states and loading states for every list.
```

---

## 3. Ekrany

### 3a. Dziecko — 6 ekranów

```
SCREEN: Child home / today's exercises. Route /pacjent/cwiczenia.
Shows a greeting with the child's first name, today's progress as a fraction and a
star row, then a large feature card for the next exercise to do, then the remaining
exercises as a list split into done and not-yet-done. Done items read as finished
without looking broken or disabled-sad. Copy, verbatim: "Cześć, [imię]!", "DZISIAJ",
"Kontynuuj!", "Zacznij ćwiczenia!", "Jeszcze [n] do zrobienia", "Zrobione!".
The feature card is the single primary action. Bottom navigation present.
```

```
SCREEN: Child exercise screen. Route /pacjent/cwiczenie/[id]. THE MOST IMPORTANT
SCREEN IN THE PRODUCT — solve the vertical budget problem described in the brief.
Contains: a large square illustration, exercise title, a difficulty chip, the
repetition progress, a one-sentence description written for the child, numbered
steps, and one primary button the child taps per repetition. A back arrow returns to
the list. Optionally a mouth cross-section panel. Copy, verbatim: "Zacznij! (0/5)",
"+1", "Zrobione! +20 ⭐", "Powtórz ćwiczenie", "Następne ćwiczenie".
Show three states: not started, mid-way (3 of 5), and completed.
```

```
SCREEN: Child calendar. Route /pacjent/kalendarz. A month grid showing which days the
child practised, the current streak, and nothing else to decide. Make a missed day
feel neutral, not like a punishment — this is a therapy app for children.
Copy: "Kalendarz", "Twoja seria", "dni z rzędu".
```

```
SCREEN: Child rewards. Route /pacjent/nagrody. Earned and locked achievements, total
stars, current level. Locked items should invite rather than shame. Copy: "Nagrody",
"Twoje gwiazdki", "Zdobyte", "Do zdobycia".
```

```
SCREEN: Child mascot. Route /pacjent/papuga. A companion parrot named Lolo that grows
and gains accessories as the child practises. Shows the mascot large, its current
level, and what unlocks next. This is the emotional reward screen — give it the most
visual personality of any screen in the app. Copy: "Lolo", "Poziom [n]".
```

```
SCREEN: Session complete celebration (overlay on the exercise screen). Confetti, the
mascot, points earned, and two choices: go to the next exercise or finish for today.
Provide a reduced-motion variant that still feels like a reward. Copy: "Brawo!",
"Ukończone wszystkie ćwiczenia!", "+20 ⭐".
```

### 3b. Logopeda — 10 ekranów

```
SCREEN: Therapist dashboard. Route /logopeda. Today at a glance: patients who
practised and who did not, plans needing attention, quick entry to the patient list
and the exercise database. Dense, scannable, no decoration that costs a row.
Copy: "Pacjenci", "Plany", "Baza ćwiczeń".
```

```
SCREEN: Patient list. Route /logopeda/pacjenci. 10–40 rows. Each row: child's name,
active plan, last practice date, adherence over the last 7 days as a compact visual.
Needs search and a sort. One row must communicate "this child has stopped practising"
at a glance. Copy: "Pacjenci", "Dodaj pacjenta", "ostatnie ćwiczenie".
```

```
SCREEN: Patient detail. Route /logopeda/pacjenci/[id]. The child's profile, the active
plan, a compact practice calendar, completion statistics, and therapist notes.
Entry points to edit the patient and to edit or create the plan.
```

```
SCREEN: Add / edit patient form. Routes /logopeda/pacjenci/dodaj and .../edytuj.
Fields: display name, login (not an email — the child logs in with a short username),
password, date of birth, notes. Show how validation errors read.
```

```
SCREEN: Exercise database. Route /logopeda/cwiczenia. A browsable library of ~130
exercises in 8 categories, each with its illustration. Needs category filtering,
sound filtering and search. The illustration must be large enough here that the
therapist recognises what the child will see. Categories, verbatim: "oddechowe",
"warg", "języka", "artykulacyjne", "podniebienia", "słuchowe", "połykanie", "żuchwa".
```

```
SCREEN: Exercise preview. Route /logopeda/cwiczenia/[id]. Everything about one
exercise: illustration, clinical description, the child-facing description shown
separately and labelled so the therapist sees exactly what the child reads, numbered
steps, target sounds, duration, difficulty, mouth cross-section with its review
status, and which plans use it. Actions: edit, clone, archive.
Copy: "Przebieg ćwiczenia", "Co czyta dziecko", "Układ języka", "czeka na akceptację".
```

```
SCREEN: Exercise editor. Routes /logopeda/cwiczenia/nowe and .../edytuj. Fields:
title, clinical description, child-facing description, numbered steps, category,
difficulty, target sounds, duration, visibility, illustration, and a fallback icon
used when there is no illustration. Show a LARGE live preview of the illustration —
this is where the therapist decides what a child will look at every day.
```

```
SCREEN: Plan list. Route /logopeda/plany. Plans across all patients, with status and
how many exercises each contains.
```

```
SCREEN: Plan builder. Routes /logopeda/plany/nowy and /logopeda/plany/[id]. Two
panes: the exercise library to pick from, and the ordered plan being assembled. Each
planned item carries a repetition count and an optional note to the child. Needs
reordering, and must work on a tablet. This is the therapist's most-used tool — give
it the most care of the professional screens.
```

```
SCREEN: Therapist settings and licence. Shows plan limits, patient count against the
limit, and account details.
```

### 3c. Admin — 8 ekranów

```
SCREEN: Admin dashboard. Route /admin/dashboard. System totals: therapists, patients,
exercises, completions. Quiet, tabular, no gamification.
```

```
SCREEN: Therapist list and detail. Routes /admin/logopedzi, /admin/logopedzi/[id],
/admin/logopedzi/dodaj. Licence type, expiry, patient limit, blocked state with a
reason. Blocking is a consequential action — design its confirmation.
```

```
SCREEN: Admin exercise table. Route /admin/cwiczenia. All exercises including
archived ones, in three groups: public database, therapist-created, archived. A
table, with the illustration as a thumbnail large enough to identify. Row actions:
preview, edit, archive, delete.
```

```
SCREEN: Admin exercise detail and editor. Routes /admin/cwiczenia/[id] and
.../edytuj and .../nowe. Same content as the therapist's, plus usage across plans and
destructive actions. Deleting an exercise used by live plans must be designed as a
blocked or heavily confirmed path, never a plain red button.
```

### 3d. Wejście do aplikacji — 5 ekranów

```
SCREEN: Child login. Route /login. The child signs in with a SHORT USERNAME, not an
email — they cannot type an email. Huge fields, numeric-friendly, a visible "show
password" control, and a demo entry button. Copy: "Zaloguj się", "Login", "Hasło",
"Wejdź jako demo", "Jestem logopedą".
```

```
SCREEN: Therapist login. Route /login/logopeda. Email and password, plus a link to
password reset. A deliberately different, more adult feel than the child's login, so
nobody lands on the wrong one. Copy: "Logowanie dla logopedy", "Nie pamiętam hasła".
```

```
SCREEN: Password reset request and new password. Routes /login/reset and /haslo/nowe.
Two steps with clear confirmation that an email was sent. Copy: "Zresetuj hasło",
"Wyślij link", "Ustaw nowe hasło".
```

```
SCREEN: Registration. Route /register. Therapist self-registration with licence
selection.
```

```
SCREEN: Install prompt and push-notification permission. A PWA install nudge and a
request to enable practice reminders, both framed for a parent, not a child.
Copy: "Przypomnienia o ćwiczeniach", "Włącz powiadomienia".
```

---

## 4. Czego NIE zmieniać

Wklej razem z briefem, jeśli Stitch zacznie przeprojektowywać model danych:

```
Keep these product facts fixed — they are implemented and in production:
- Three roles with separate entry points: child, therapist, admin.
- The child logs in with a short username, never an email.
- A plan is an ordered list of exercises, each with its own repetition count.
- One tap on the primary button equals one repetition. Completion is per day.
- Eight exercise categories, each with its own recurring mascot character.
- Illustrations are square, 1024×1024, on a fixed cream background.
- The app is an installed PWA and works on phones.
```

---

## 5. Po wygenerowaniu

Zanim cokolwiek trafi do kodu, sprawdź na projekcie trzy rzeczy, bo to one wywróciły
obecny układ:

1. **Czy główny przycisk dziecka mieści się bez przewijania przy 375×667.** To jest
   najniższy realny ekran; przy 390×844 obecny układ wychodził poza krawędź o 8 px.
2. **Czy ilustracja czyta się w najmniejszym kafelku.** Przy 64 px bohater robi się
   „jakimś zwierzęciem" i cała praca nad rozpoznawalnością postaci przepada.
3. **Czy opis i co najmniej trzy kroki są widoczne naraz** na ekranie ćwiczenia.
   Obecnie obszar kroków ma 105 px przy treści 183 px — widać półtora kroku.
