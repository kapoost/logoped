// lib/gamification.ts
// Pomocnicze funkcje gamifikacji — używane po stronie serwera

import { LEVELS, BADGES } from '@/types/database'
import type { LevelDefinition, BadgeKey } from '@/types/database'

/** Zwraca definicję poziomu na podstawie punktów */
export function getLevelForPoints(points: number): LevelDefinition {
  return [...LEVELS].reverse().find(l => points >= l.minPoints) ?? LEVELS[0]
}

/** Ile punktów do następnego poziomu */
export function pointsToNextLevel(points: number): number | null {
  const nextLevel = LEVELS.find(l => l.minPoints > points)
  return nextLevel ? nextLevel.minPoints - points : null
}

/** Procent do następnego poziomu (0–100) */
export function progressToNextLevel(points: number): number {
  const current = getLevelForPoints(points)
  const next    = LEVELS.find(l => l.level === current.level + 1)
  if (!next) return 100
  return Math.round(((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100)
}

/** Formatuje policzalnik po polsku */
export function formatDays(n: number): string {
  if (n === 1)                        return '1 dzień'
  if (n >= 2 && n <= 4)               return `${n} dni`
  if (n >= 5 && n <= 21)              return `${n} dni`
  const lastTwo = n % 100
  const lastOne = n % 10
  if (lastOne >= 2 && lastOne <= 4 && (lastTwo < 10 || lastTwo >= 20)) return `${n} dni`
  return `${n} dni`
}

/** Ile punktów za akcję */
export const POINTS = {
  exercise:         20,
  sessionComplete:  50,
  streak3:         100,
  streak7:         200,
  streak30:        500,
  onboarding:       50,
} as const

/** Zwraca emoji dla serii */
export function streakEmoji(streak: number): string {
  if (streak >= 30) return '🦁'
  if (streak >= 7)  return '🏅'
  if (streak >= 3)  return '🔥'
  return '💧'
}

/** Zwraca definicję odznaki lub null */
export function getBadge(key: BadgeKey) {
  return BADGES.find(b => b.key === key) ?? null
}
