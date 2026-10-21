// types/database.ts
// Typy TypeScript odzwierciedlające schemat bazy danych

export type Role = 'admin' | 'therapist' | 'patient'
export type ExerciseCategory =
  | 'oddechowe'
  | 'warg'
  | 'jezyka'
  | 'artykulacyjne'
  | 'podniebienia'
  | 'sluchowe'
  | 'polykanie'   // 011 — prawidłowy wzorzec połykania
  | 'zuchwa'      // 011 — ruchomość i stabilizacja żuchwy
export type DifficultyLevel = 'latwe' | 'srednie' | 'trudne'

// ── Tabele ────────────────────────────────────────────────────────────────

export type LicenseType = 'trial' | 'basic' | 'pro' | 'unlimited'

export type Profile = {
  id: string
  role: Role
  full_name: string
  avatar_url: string | null
  parent_id: string | null
  date_of_birth: string | null
  created_at: string
  updated_at: string
  // 007_licenses.sql — wszystkie dodane z DEFAULT, ale nullable w bazie
  license_type: LicenseType | null
  license_expires_at: string | null
  max_patients: number | null
  is_blocked: boolean | null
  block_reason: string | null
  notes: string | null          // notatki admina
  phone: string | null
  organization: string | null   // gabinet / klinika
}

export type TherapistPatient = {
  id: string
  therapist_id: string
  patient_id: string
  notes: string | null
  assigned_at: string
}

export type Exercise = {
  id: string
  title: string
  description: string | null
  /** Opis pisany do dziecka. NULL = brak wersji dziecięcej, pokazujemy description. */
  description_child: string | null
  instructions: string
  category: ExerciseCategory
  difficulty: DifficultyLevel
  target_sounds: string[] | null
  media_url: string | null
  duration_seconds: number
  emoji: string
  created_by: string | null   // null = publiczne (admin)
  is_public: boolean
  archived_at: string | null  // null = w obiegu; data = wycofane z bazy i kreatora planów
  archived_by: string | null
  created_at: string
  updated_at: string
}

/** Widok public.exercise_usage — ile planów używa ćwiczenia */
export type ExerciseUsage = {
  exercise_id: string
  plan_count: number
  active_plan_count: number
  patient_count: number
}

export type ExercisePlan = {
  id: string
  therapist_id: string
  patient_id: string
  name: string
  description: string | null
  is_active: boolean
  start_date: string
  created_at: string
  updated_at: string
}

export type PlanExercise = {
  id: string
  plan_id: string
  exercise_id: string
  order_index: number
  repetitions: number
  notes: string | null
  created_at: string
}

export type Schedule = {
  id: string
  plan_id: string
  days_of_week: number[]   // 0=pon, 6=nd
  reminder_time: string    // "HH:MM"
  is_active: boolean
  created_at: string
}

export type ExerciseCompletion = {
  id: string
  patient_id: string
  plan_exercise_id: string
  session_date: string
  completed_at: string
  recording_url: string | null
  therapist_ok: boolean | null
  therapist_note: string | null
  reviewed_at: string | null
}

export type PatientStats = {
  patient_id: string
  current_streak: number
  longest_streak: number
  total_sessions: number
  total_exercises: number
  points: number
  level: number
  last_session_date: string | null
  updated_at: string
}

export type Achievement = {
  id: string
  patient_id: string
  badge_key: BadgeKey
  unlocked_at: string
}

export type PushSubscription = {
  id: string
  patient_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}

// ── Odznaki ───────────────────────────────────────────────────────────────

export type BadgeKey =
  | 'first_session'
  | 'streak_3'
  | 'streak_7'
  | 'streak_30'
  | 'sessions_10'
  | 'sessions_50'
  | 'exercises_100'
  | 'all_categories'
  | 'all_badges'
  | 'level_5'

export interface BadgeDefinition {
  key: BadgeKey
  emoji: string
  title: string
  description: string
}

export const BADGES: BadgeDefinition[] = [
  { key: 'first_session',  emoji: '🌟', title: 'Pierwsze kroki',  description: 'Ukończona pierwsza sesja' },
  { key: 'streak_3',       emoji: '🔥', title: 'Płomień',         description: '3 dni ćwiczeń z rzędu' },
  { key: 'streak_7',       emoji: '🏅', title: 'Tydzień',         description: '7 dni ćwiczeń z rzędu' },
  { key: 'streak_30',      emoji: '🦁', title: 'Lew',             description: '30 dni ćwiczeń z rzędu' },
  { key: 'sessions_10',    emoji: '💪', title: 'Pracuś',          description: '10 ukończonych sesji' },
  { key: 'sessions_50',    emoji: '💎', title: 'Diament',         description: '50 ukończonych sesji' },
  { key: 'exercises_100',  emoji: '🦜', title: 'Gadułka',         description: '100 ukończonych ćwiczeń' },
  { key: 'all_categories', emoji: '🎯', title: 'Celny strzał',    description: 'Ćwiczenia ze wszystkich 6 kategorii' },
  { key: 'all_badges',     emoji: '🎓', title: 'Ekspert',         description: 'Wszystkie pozostałe odznaki' },
  { key: 'level_5',        emoji: '🏆', title: 'Mistrz Mowy',     description: 'Osiągnięcie poziomu 5' },
]

// ── Poziomy (gamifikacja) ─────────────────────────────────────────────────

export interface LevelDefinition {
  level: number
  emoji: string
  title: string
  minPoints: number
}

export const LEVELS: LevelDefinition[] = [
  { level: 1, emoji: '🐣', title: 'Maluszek',     minPoints: 0 },
  { level: 2, emoji: '📚', title: 'Uczniaczek',   minPoints: 500 },
  { level: 3, emoji: '🗣️', title: 'Gadałka',      minPoints: 1500 },
  { level: 4, emoji: '🏅', title: 'Mistrz Słowa', minPoints: 4000 },
  { level: 5, emoji: '🏆', title: 'Mistrz Mowy',  minPoints: 10000 },
]

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  oddechowe:     'Oddechowe 💨',
  warg:          'Wargi 👄',
  jezyka:        'Język 👅',
  artykulacyjne: 'Artykulacyjne 🔤',
  podniebienia:  'Podniebienie',
  sluchowe:      'Słuchowe 👂',
  polykanie:     'Połykanie 💧',
  zuchwa:        'Żuchwa 🦷',
}

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  latwe:   'Łatwe',
  srednie: 'Średnie',
  trudne:  'Trudne',
}

// ── Widoki (Views z 005_views.sql) ────────────────────────────────────────

export type TodayExercise = {
  plan_exercise_id: string
  plan_id: string
  order_index: number
  repetitions: number
  therapist_notes: string | null
  exercise_id: string
  title: string
  description: string | null
  /** Opis pisany do dziecka. NULL = brak wersji dziecięcej, pokazujemy description. */
  description_child: string | null
  instructions: string
  category: ExerciseCategory
  difficulty: DifficultyLevel
  target_sounds: string[] | null
  media_url: string | null
  duration_seconds: number
  emoji: string
  patient_id: string
  plan_name: string
  completed_today: boolean
  completion_id: string | null
  completed_at: string | null
}

export type TherapistPatientOverview = {
  therapist_id: string
  patient_id: string
  full_name: string
  date_of_birth: string | null
  avatar_url: string | null
  current_streak: number | null
  longest_streak: number | null
  total_sessions: number | null
  total_exercises: number | null
  points: number | null
  level: number | null
  last_session_date: string | null
  days_active_this_week: number
  active_plan_id: string | null
  active_plan_name: string | null
  plan_exercise_count: number
}

// ── Supabase Database shape (dla createClient<Database>()) ───────────────

/** Kolumny z DEFAULT w bazie — przy INSERT można je pominąć */
type WithDefaults<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

type ProfileInsert = WithDefaults<
  Omit<Profile, 'created_at' | 'updated_at'>,
  'avatar_url' | 'parent_id' | 'date_of_birth' | 'license_type' | 'license_expires_at'
  | 'max_patients' | 'is_blocked' | 'block_reason' | 'notes' | 'phone' | 'organization'
>

type ExerciseInsert = WithDefaults<
  Omit<Exercise, 'id' | 'created_at' | 'updated_at'>,
  'description' | 'description_child' | 'target_sounds' | 'media_url'
  | 'duration_seconds' | 'emoji'
  | 'created_by' | 'is_public' | 'archived_at' | 'archived_by'
>

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: Partial<Profile>
        Relationships: []
      }
      exercises: {
        Row: Exercise
        Insert: ExerciseInsert
        Update: Partial<Exercise>
        Relationships: []
      }
      exercise_plans: {
        Row: ExercisePlan
        Insert: WithDefaults<Omit<ExercisePlan, 'id' | 'created_at' | 'updated_at'>, 'description' | 'is_active' | 'start_date'>
        Update: Partial<ExercisePlan>
        Relationships: []
      }
      plan_exercises: {
        Row: PlanExercise
        Insert: WithDefaults<Omit<PlanExercise, 'id' | 'created_at'>, 'order_index' | 'repetitions' | 'notes'>
        Update: Partial<PlanExercise>
        Relationships: []
      }
      schedules: {
        Row: Schedule
        Insert: WithDefaults<Omit<Schedule, 'id' | 'created_at'>, 'days_of_week' | 'reminder_time' | 'is_active'>
        Update: Partial<Schedule>
        Relationships: []
      }
      exercise_completions: {
        Row: ExerciseCompletion
        Insert: WithDefaults<
          Omit<ExerciseCompletion, 'id' | 'completed_at'>,
          'session_date' | 'recording_url' | 'therapist_ok' | 'therapist_note' | 'reviewed_at'
        >
        Update: Partial<ExerciseCompletion>
        Relationships: []
      }
      patient_stats: {
        Row: PatientStats
        Insert: WithDefaults<PatientStats, Exclude<keyof PatientStats, 'patient_id'>>
        Update: Partial<PatientStats>
        Relationships: []
      }
      achievements: {
        Row: Achievement
        Insert: Omit<Achievement, 'id' | 'unlocked_at'>
        Update: never
        Relationships: []
      }
      therapist_patients: {
        Row: TherapistPatient
        Insert: WithDefaults<Omit<TherapistPatient, 'id' | 'assigned_at'>, 'notes'>
        Update: Partial<TherapistPatient>
        Relationships: []
      }
      push_subscriptions: {
        Row: PushSubscription
        Insert: Omit<PushSubscription, 'id' | 'created_at'>
        Update: Partial<PushSubscription>
        Relationships: []
      }
    }
    Views: {
      today_exercises:            { Row: TodayExercise;            Relationships: [] }
      therapist_patient_overview: { Row: TherapistPatientOverview; Relationships: [] }
      exercise_usage:             { Row: ExerciseUsage;            Relationships: [] }
    }
    Functions: {
      get_patient_calendar: {
        Args: { p_patient_id: string; p_months?: number }
        Returns: Array<{
          session_date: string
          exercises_done: number
          plan_exercise_total: number
          completion_rate: number
        }>
      }
      current_user_role: { Args: Record<never, never>; Returns: string }
    }
    Enums: {
      exercise_category: ExerciseCategory
      difficulty_level: DifficultyLevel
      license_type: LicenseType
    }
    CompositeTypes: Record<never, never>
  }
}
