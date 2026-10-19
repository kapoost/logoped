// lib/exercises/usage.ts
// Jedno miejsce z regułą "czy to ćwiczenie da się usunąć na twardo".
//
// plan_exercises.exercise_id ma ON DELETE RESTRICT, więc ćwiczenie użyte w planie
// jest nieusuwalne na poziomie bazy. Liczymy zawsze service rolem — logopeda przez
// RLS zobaczyłby tylko swoje plany i mógłby dostać fałszywe "0 użyć".

import { createAdminClient } from '@/lib/supabase/server'
import { plany, pacjenci } from '@/lib/plural'

export interface UsageInfo {
  planCount:       number
  activePlanCount: number
  patientCount:    number
  canHardDelete:   boolean
}

export async function getExerciseUsage(exerciseId: string): Promise<UsageInfo> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('exercise_usage')
    .select('plan_count, active_plan_count, patient_count')
    .eq('exercise_id', exerciseId)
    .single()

  const planCount = Number(data?.plan_count ?? 0)
  return {
    planCount,
    activePlanCount: Number(data?.active_plan_count ?? 0),
    patientCount:    Number(data?.patient_count ?? 0),
    canHardDelete:   planCount === 0,
  }
}

/** Mapa exercise_id → użycie, do list. Jedno zapytanie zamiast N. */
export async function getUsageMap(): Promise<Record<string, UsageInfo>> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('exercise_usage')
    .select('exercise_id, plan_count, active_plan_count, patient_count')

  const map: Record<string, UsageInfo> = {}
  for (const row of data ?? []) {
    const planCount = Number(row.plan_count ?? 0)
    map[row.exercise_id] = {
      planCount,
      activePlanCount: Number(row.active_plan_count ?? 0),
      patientCount:    Number(row.patient_count ?? 0),
      canHardDelete:   planCount === 0,
    }
  }
  return map
}

/** Komunikat dla użytkownika, gdy twarde usunięcie jest zablokowane. */
export function blockedDeleteMessage(u: UsageInfo): string {
  return `Ćwiczenie jest użyte w ${plany(u.planCount)}`
    + (u.patientCount ? ` (${pacjenci(u.patientCount)})` : '')
    + '. Usunięcie skasowałoby je z historii — zarchiwizuj zamiast usuwać.'
}
