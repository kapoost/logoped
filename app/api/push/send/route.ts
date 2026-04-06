import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const CRON_SECRET = process.env.CRON_SECRET ?? ''

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Inicjalizuj webpush dopiero tutaj (runtime, nie build time)
  const webpush = await import('web-push')
  const subject  = process.env.VAPID_SUBJECT
  const pubKey   = process.env.VAPID_PUBLIC_KEY
  const privKey  = process.env.VAPID_PRIVATE_KEY

  if (!subject || !pubKey || !privKey) {
    return NextResponse.json({ error: 'VAPID not configured' }, { status: 500 })
  }

  webpush.setVapidDetails(subject, pubKey, privKey)

  const supabase = createAdminClient()
  const now = new Date()
  const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const { data: schedules } = await supabase
    .from('schedules')
    .select(`plan_id, reminder_time, days_of_week, exercise_plans!inner(patient_id, is_active, profiles!inner(full_name))`)
    .eq('is_active', true)
    .contains('days_of_week', [currentDay])

  if (!schedules?.length) {
    return NextResponse.json({ sent: 0, message: 'No schedules' })
  }

  const toNotify = schedules.filter(s => {
    const [sh, sm] = s.reminder_time.split(':').map(Number)
    return Math.abs(sh * 60 + sm - nowMin) <= 5
  })

  let sent = 0
  for (const schedule of toNotify) {
    const plan = (schedule as any).exercise_plans
    if (!plan?.is_active) continue
    const firstName = (plan.profiles?.full_name as string ?? '').split(' ')[0]
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('patient_id', plan.patient_id)

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: '🦜 Papuga czeka!', body: `Czas na ćwiczenia, ${firstName}!`, url: '/pacjent/cwiczenia' })
        )
        sent++
      } catch (err: any) {
        if (err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }
  }

  return NextResponse.json({ sent })
}
