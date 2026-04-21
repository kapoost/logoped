'use client'
import dynamic from 'next/dynamic'

// Dynamic import — lottie-react jest ciężkie, ładuj lazy
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

// Wbudowane animacje jako URL-e z lottiefiles CDN (publiczne, darmowe)
const ANIMATIONS = {
  // Confetti/celebration
  celebration: 'https://lottie.host/a0421345-30e7-4e7a-b23a-fae31c527fe5/VqGRAMqb5a.json',
  // Złota gwiazdka
  star: 'https://lottie.host/e1ab7ed2-dbe9-4dde-84db-6e843c8e22d5/SaOvhMNqDE.json',
  // Trofeum
  trophy: 'https://lottie.host/95e5aba2-5ddc-4eee-b4a1-7f6d2ce0f77a/OjCmlnOpd1.json',
} as const

interface Props {
  name: keyof typeof ANIMATIONS
  className?: string
  loop?: boolean
  autoplay?: boolean
  style?: React.CSSProperties
}

export default function LottieAnimation({ name, className, loop = false, autoplay = true, style }: Props) {
  return (
    <Lottie
      path={ANIMATIONS[name]}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={style}
    />
  )
}

export { ANIMATIONS }
