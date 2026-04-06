'use client'
// components/patient/PushSetup.tsx

import { useState, useEffect } from 'react'

export default function PushSetup() {
  const [status, setStatus]   = useState<'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'>('idle')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
      return
    }
    setStatus(Notification.permission === 'granted' ? 'granted' : 'idle')
  }, [])

  async function subscribe() {
    setStatus('loading')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStatus('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      // Wyślij na serwer
      await fetch('/api/push/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          endpoint: sub.endpoint,
          p256dh:   arrayBufferToBase64(sub.getKey('p256dh')!),
          auth:     arrayBufferToBase64(sub.getKey('auth')!),
        }),
      })

      setStatus('granted')
      setSubscribed(true)
    } catch (err) {
      console.error('[push setup]', err)
      setStatus('idle')
    }
  }

  if (status === 'unsupported') {
    return (
      <p className="text-xs text-gray-400">
        Twoja przeglądarka nie obsługuje powiadomień push.
      </p>
    )
  }

  if (status === 'granted' || subscribed) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700">
        <span className="text-lg">✅</span>
        Powiadomienia są włączone! Papuga Cię przypomni.
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <p className="text-xs text-red-500">
        Powiadomienia są zablokowane. Zezwól na nie w ustawieniach przeglądarki.
      </p>
    )
  }

  return (
    <button
      onClick={subscribe}
      disabled={status === 'loading'}
      className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition active:scale-95"
    >
      {status === 'loading' ? 'Włączanie…' : '🔔 Włącz przypomnienia'}
    </button>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}
