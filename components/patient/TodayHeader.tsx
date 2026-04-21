'use client'
// components/patient/TodayHeader.tsx
// Dla dziecka które nie czyta — TYLKO ikony i liczby.
// Jeśli demo: czyta stats z localStorage zamiast DB.

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { isDemo } from '@/lib/demoProgress'
import { seedDemoStats, getDemoStats, type DemoStats } from '@/lib/demoStats'

interface Props {
  name: string
  streak: number
  done: number
  total: number
  patientId: string
  // DB stats — do seedowania localStorage dla demo
  dbPoints: number
  dbLevel: number
  dbStreak: number
  dbTotalExercises: number
}

export default function TodayHeader({
  name, done, total, patientId,
  dbPoints, dbLevel, dbStreak, dbTotalExercises
}: Props) {
  const demo = isDemo(patientId)
  const [localStats, setLocalStats] = useState<DemoStats | null>(null)

  useEffect(() => {
    if (!demo) return
    seedDemoStats({ points: dbPoints, level: dbLevel, streak: dbStreak, total_exercises: dbTotalExercises })
    setLocalStats(getDemoStats())

    const handler = () => setLocalStats(getDemoStats())
    window.addEventListener('demo-stats-updated', handler)
    return () => window.removeEventListener('demo-stats-updated', handler)
  }, [demo, dbPoints, dbLevel, dbStreak, dbTotalExercises])

  const streak     = demo && localStats ? localStats.streak : dbStreak
  const streakEmoji = streak >= 30 ? '🦁' : streak >= 7 ? '🏅' : streak >= 3 ? '🔥' : '💧'
  const allDone    = done === total && total > 0

  return (
    <div className="bg-brand-600 text-white relative overflow-hidden">
      <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/8 rounded-full pointer-events-none" />

      <div className="relative px-5 pt-5 pb-2">
        {/* Imię + papuga */}
        <div className="flex items-center justify-between mb-5">
          <motion.h1
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            className="text-3xl font-black"
          >
            Cześć, {name}!
          </motion.h1>
          <motion.div
            animate={{ rotate: [-6, 6, -6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center border-2 border-white/25 flex-shrink-0"
          >
            <span className="text-4xl inline-block">🦜</span>
          </motion.div>
        </div>

        {/* Seria + gwiazdki */}
        <div className="flex gap-3 mb-4">
          {/* Seria */}
          <div className="bg-white/15 rounded-2xl px-5 py-3 flex items-center gap-3 min-w-[100px]">
            <motion.span
              key={streak}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="text-4xl"
            >
              {streakEmoji}
            </motion.span>
            <motion.span
              key={`s-${streak}`}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl font-black"
            >
              {streak}
            </motion.span>
          </div>

          {/* Gwiazdki postępu */}
          <div className="flex-1 bg-white/15 rounded-2xl px-4 py-3 flex items-center justify-center gap-1.5">
            {Array.from({ length: total || 3 }).map((_, i) => (
              <motion.span
                key={i}
                initial={false}
                animate={i < done
                  ? { opacity: 1, scale: 1.15, rotate: [0, 20, -20, 0] }
                  : { opacity: 0.25, scale: 1, rotate: 0 }
                }
                transition={i < done
                  ? { duration: 0.4, delay: i * 0.1 }
                  : { duration: 0.2 }
                }
                className="text-2xl inline-block"
              >
                ⭐
              </motion.span>
            ))}
          </div>
        </div>

        {/* Celebracja gdy wszystko zrobione */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 12 }}
              className="bg-white/20 rounded-2xl py-3 mb-2 text-center text-2xl"
            >
              <motion.span
                animate={{ rotate: [0, -15, 15, 0] }}
                transition={{ duration: 0.8, repeat: 2 }}
              >
                🎉 🏆 🎉
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <svg viewBox="0 0 390 24" className="w-full block" preserveAspectRatio="none" height="24">
        <path d="M0 24 Q97 0 195 16 Q293 32 390 8 L390 24Z" fill="#F9FAFB" />
      </svg>
    </div>
  )
}
