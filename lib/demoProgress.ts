// lib/demoProgress.ts
// Lokalny postęp dla konta demo — bez zapisu do bazy

const DEMO_PATIENT_ID = '72ffac7a-1965-485b-b394-74c5978c33ea'

function todayKey() {
  return `logoped_demo_${new Date().toISOString().slice(0, 10)}`
}

type Progress = Record<string, { reps: number; completed: boolean }>

function load(): Progress {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(todayKey()) ?? '{}')
  } catch {
    return {}
  }
}

function save(data: Progress) {
  if (typeof window === 'undefined') return
  localStorage.setItem(todayKey(), JSON.stringify(data))
}

export function isDemo(patientId: string) {
  return patientId === DEMO_PATIENT_ID
}

export function getDemoReps(planExerciseId: string): number {
  return load()[planExerciseId]?.reps ?? 0
}

export function getDemoCompleted(planExerciseId: string): boolean {
  return load()[planExerciseId]?.completed ?? false
}

export function setDemoReps(planExerciseId: string, reps: number, completed: boolean) {
  const data = load()
  data[planExerciseId] = { reps, completed }
  save(data)
}

export function getAllDemoCompleted(): string[] {
  const data = load()
  return Object.entries(data)
    .filter(([, v]) => v.completed)
    .map(([k]) => k)
}
