// app/api/push/subscribe/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { endpoint, p256dh, auth } = await request.json()
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    // Upsert — jeden endpoint może się powtórzyć przy reinstalacji
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { patient_id: user.id, endpoint, p256dh, auth },
        { onConflict: 'endpoint' }
      )

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[push/subscribe]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
