'use client'
import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface Props {
  trigger: boolean
  type?: 'celebration' | 'badge' | 'levelup'
}

export default function Confetti({ trigger, type = 'celebration' }: Props) {
  useEffect(() => {
    if (!trigger) return

    if (type === 'levelup') {
      // Wielki fajerwerk na level up
      const end = Date.now() + 1500
      const colors = ['#7c3aed', '#fbbf24', '#22c55e', '#ef4444']
      ;(function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors,
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors,
        })
        if (Date.now() < end) requestAnimationFrame(frame)
      })()
    } else if (type === 'badge') {
      // Złote gwiazdki
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#fcd34d'],
        shapes: ['star'],
        scalar: 1.5,
      })
    } else {
      // Standardowe confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#7c3aed', '#22c55e', '#fbbf24', '#ef4444', '#3b82f6'],
      })
    }
  }, [trigger, type])

  return null
}
