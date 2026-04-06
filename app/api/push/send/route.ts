// app/api/push/send/route.ts
// Wywoływane przez cron job na Fly.io o ustalonej godzinie

import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/server'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// Prosty token zabezpieczający cron endpoint
const CRON_SECRET = process.env.CRON_SECRET ?? 'changeme'

export async function POST(request: Request) {
  // Weryfikacja tokenu
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Pobierz pacjentów z aktywnym harmonogramem na teraz
  // + ich subskrypcjami push
  const now         = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const currentDay  = now.getDay() === 0 ? 6 : now.getDay() - 1  // 0=pon

  const { data: schedules } = await supabase
    .from('schedules')
    .select(`
      plan_id,
      reminder_time,
      days_of_week,
      exercise_plans!inner (
        patient_id,
        is_active,
        profiles!inner ( full_name )
      )
    `)
    .eq('is_active', true)
    .contains('days_of_week', [currentDay])

  if (!schedules?.length) {
    return NextResponse.json({ sent: 0, message: 'No schedules for now' })
  }

  // Filtruj po godzinie (±5 min tolerancji)
  const [hh, mm] = currentTime.split(':').map(Number)
  const nowMin   = hh * 60 + mm

  const toNotify = schedules.filter(s => {
    const [sh, sm] = s.reminder_time.split(':').map(Number)
    const schedMin = sh * 60 + sm
    return Math.abs(schedMin - nowMin) <= 5
  })

  let sent = 0
  const errors: string[] = []

  for (const schedule of toNotify) {
    const plan    = (schedule as any).exercise_plans
    const profile = plan?.profiles
    if (!plan?.is_active || !profile) continue

    const patientId = plan.patient_id
    const firstName = (profile.full_name as string).split(' ')[0]

    // Pobierz subskrypcje push dla tego pacjenta
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('patient_id', patientId)

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: '🦜 Papuga czeka!',
            body:  `Czas na ćwiczenia, ${firstName}! Zdobądź punkty i utrzymaj serię!`,
            icon:  '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            url:   '/pacjent/cwiczenia',
          })
        )
        sent++
      } catch (err: any) {
        // 410 Gone = nieważna subskrypcja — usuń ją
        if (err.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        } else {
          errors.push(err.message)
        }
      }
    }
  }

  return NextResponse.json({ sent, errors: errors.length ? errors : undefined })
}
