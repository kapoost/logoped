// lib/demoStats.ts
// Fake statystyki gamifikacji dla konta demo — zapisywane w localStorage

const KEY = 'logoped_demo_stats'

export interface DemoStats {
  points: number
  level: number
  streak: number
  total_exercises: number
  seeded: boolean
}

const LEVELS = [
  { level: 1, minPoints: 0 },
  { level: 2, minPoints: 500 },
  { level: 3, minPoints: 1500 },
  { level: 4, minPoints: 4000 },
  { level: 5, minPoints: 10000 },
]

function calcLevel(points: number): number {
  let lvl = 1
  for (const l of LEVELS) {
    if (points >= l.minPoints) lvl = l.level
  }
  return lvl
}

export function getDemoStats(): DemoStats | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// Zainicjalizuj z danymi DB (tylko raz)
export function seedDemoStats(dbStats: {
  points: number, level: number, streak: number, total_exercises: number
}) {
  if (typeof window === 'undefined') return
  const existing = getDemoStats()
  if (existing?.seeded) return  // już seeded — nie nadpisuj
  const stats: DemoStats = {
    points:           dbStats.points,
    level:            dbStats.level,
    streak:           dbStats.streak,
    total_exercises:  dbStats.total_exercises,
    seeded:           true,
  }
  localStorage.setItem(KEY, JSON.stringify(stats))
}

// +20 pkt za ćwiczenie
export function addDemoExercisePoints(): DemoStats {
  const s = getDemoStats() ?? { points: 0, level: 1, streak: 1, total_exercises: 0, seeded: true }
  s.points += 20
  s.total_exercises += 1
  s.level = calcLevel(s.points)
  localStorage.setItem(KEY, JSON.stringify(s))
  return s
}

// +50 pkt bonus za całą sesję
export function addDemoSessionBonus(): DemoStats {
  const s = getDemoStats() ?? { points: 0, level: 1, streak: 1, total_exercises: 0, seeded: true }
  s.points += 50
  s.level = calcLevel(s.points)
  localStorage.setItem(KEY, JSON.stringify(s))
  return s
}
