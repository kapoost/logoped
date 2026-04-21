-- 008_login_bez_maila.sql
-- Migracja emaili demo na nową konwencję: login@logoped.app
-- Logowanie po loginie (bez maila) — logopeda przekazuje dane na wizycie

-- Zaktualizuj demo pacjentkę
UPDATE auth.users SET email = 'demo@logoped.app' WHERE email = 'demo@logoped.pl';

-- Zaktualizuj demo logopedę
UPDATE auth.users SET email = 'logopeda-demo@logoped.app' WHERE email = 'logopeda-demo@logoped.pl';
