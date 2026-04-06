'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function IconFrog({ active }: { active: boolean }) {
  return (
    <svg width="38" height="36" viewBox="0 0 38 36" style={{ display:'block', animation: active ? 'navWiggle 2s ease-in-out infinite' : 'none' }}>
      <ellipse cx="19" cy="24" rx="13" ry="10" fill={active ? '#4ade80' : '#86efac'}/>
      <ellipse cx="8" cy="18" rx="4" ry="6" fill={active ? '#22c55e' : '#6ee7b7'} transform="rotate(-30,8,18)"/>
      <ellipse cx="30" cy="18" rx="4" ry="6" fill={active ? '#22c55e' : '#6ee7b7'} transform="rotate(30,30,18)"/>
      <circle cx="19" cy="14" r="11" fill={active ? '#4ade80' : '#86efac'}/>
      <circle cx="13" cy="10" r="5.5" fill="#fff"/>
      <circle cx="25" cy="10" r="5.5" fill="#fff"/>
      <circle cx="13" cy="10" r="3" fill="#1e293b" style={{ animation:'navPupil 4s ease-in-out infinite', transformOrigin:'13px 10px' }}/>
      <circle cx="25" cy="10" r="3" fill="#1e293b" style={{ animation:'navPupil 4s ease-in-out infinite .8s', transformOrigin:'25px 10px' }}/>
      <circle cx="14" cy="9" r="1.2" fill="#fff"/>
      <circle cx="26" cy="9" r="1.2" fill="#fff"/>
      <ellipse cx="13" cy="10" rx="5.5" ry="5.5" fill={active ? '#4ade80' : '#86efac'} style={{ animation:'navBlink 4s ease-in-out infinite', transformOrigin:'13px 10px' }}/>
      <ellipse cx="25" cy="10" rx="5.5" ry="5.5" fill={active ? '#4ade80' : '#86efac'} style={{ animation:'navBlink 4s ease-in-out infinite .1s', transformOrigin:'25px 10px' }}/>
      <path d="M14 18 Q19 22 24 18" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {active && <>
        <rect x="5" y="22" width="10" height="3" rx="1.5" fill="#7c3aed"/>
        <rect x="4" y="20" width="3" height="7" rx="1.5" fill="#6d28d9"/>
        <rect x="15" y="20" width="3" height="7" rx="1.5" fill="#6d28d9"/>
      </>}
    </svg>
  )
}

function IconOwl({ active }: { active: boolean }) {
  return (
    <svg width="38" height="36" viewBox="0 0 38 36" style={{ display:'block' }}>
      <ellipse cx="19" cy="26" rx="12" ry="9" fill={active ? '#a78bfa' : '#ddd6fe'}/>
      <ellipse cx="8" cy="26" rx="5" ry="8" fill={active ? '#8b5cf6' : '#c4b5fd'} transform="rotate(-10,8,26)"/>
      <ellipse cx="30" cy="26" rx="5" ry="8" fill={active ? '#8b5cf6' : '#c4b5fd'} transform="rotate(10,30,26)"/>
      <circle cx="19" cy="14" r="12" fill={active ? '#a78bfa' : '#ddd6fe'}/>
      <ellipse cx="12" cy="5" rx="3" ry="5" fill={active ? '#7c3aed' : '#a78bfa'} transform="rotate(-15,12,5)"/>
      <ellipse cx="26" cy="5" rx="3" ry="5" fill={active ? '#7c3aed' : '#a78bfa'} transform="rotate(15,26,5)"/>
      <circle cx="13" cy="14" r="5.5" fill="#fff"/>
      <circle cx="25" cy="14" r="5.5" fill="#fff"/>
      <circle cx="13" cy="14" r="3.5" fill={active ? '#f59e0b' : '#fcd34d'}/>
      <circle cx="25" cy="14" r="3.5" fill={active ? '#f59e0b' : '#fcd34d'}/>
      <circle cx="13" cy="14" r="2" fill="#1e293b" style={{ animation:'navPupil 6s ease-in-out infinite', transformOrigin:'13px 14px' }}/>
      <circle cx="25" cy="14" r="2" fill="#1e293b" style={{ animation:'navPupil 6s ease-in-out infinite 1.5s', transformOrigin:'25px 14px' }}/>
      <circle cx="14" cy="13" r=".9" fill="#fff"/>
      <circle cx="26" cy="13" r=".9" fill="#fff"/>
      <polygon points="19,18 16,21 22,21" fill={active ? '#f59e0b' : '#fcd34d'}/>
      <rect x="13" y="27" width="12" height="8" rx="2" fill="#fff" opacity=".9"/>
      <line x1="13" y1="30" x2="25" y2="30" stroke={active ? '#c4b5fd' : '#e9d5ff'} strokeWidth="1"/>
      <rect x="15" y="31.5" width="2" height="2" rx=".5" fill={active ? '#7c3aed' : '#a78bfa'}/>
      <rect x="19" y="31.5" width="2" height="2" rx=".5" fill={active ? '#7c3aed' : '#a78bfa'}/>
      <rect x="23" y="31.5" width="2" height="2" rx=".5" fill="#d1d5db"/>
    </svg>
  )
}

function IconBear({ active }: { active: boolean }) {
  return (
    <svg width="38" height="36" viewBox="0 0 38 36" style={{ display:'block', animation: active ? 'navBounce 2.5s ease-in-out infinite' : 'none' }}>
      <circle cx="9" cy="9" r="6" fill={active ? '#d97706' : '#fbbf24'}/>
      <circle cx="29" cy="9" r="6" fill={active ? '#d97706' : '#fbbf24'}/>
      <circle cx="9" cy="9" r="3.5" fill={active ? '#fbbf24' : '#fde68a'}/>
      <circle cx="29" cy="9" r="3.5" fill={active ? '#fbbf24' : '#fde68a'}/>
      <ellipse cx="19" cy="27" rx="13" ry="9" fill={active ? '#f59e0b' : '#fbbf24'}/>
      <ellipse cx="19" cy="28" rx="8" ry="6" fill={active ? '#fcd34d' : '#fde68a'}/>
      <circle cx="19" cy="15" r="12" fill={active ? '#f59e0b' : '#fbbf24'}/>
      <circle cx="14" cy="12" r="4.5" fill="#fff"/>
      <circle cx="24" cy="12" r="4.5" fill="#fff"/>
      <circle cx="14" cy="12" r="2.5" fill="#1e293b" style={{ animation:'navPupil 5s ease-in-out infinite', transformOrigin:'14px 12px' }}/>
      <circle cx="24" cy="12" r="2.5" fill="#1e293b" style={{ animation:'navPupil 5s ease-in-out infinite 1s', transformOrigin:'24px 12px' }}/>
      <circle cx="15" cy="11" r="1" fill="#fff"/>
      <circle cx="25" cy="11" r="1" fill="#fff"/>
      <ellipse cx="19" cy="17" rx="3.5" ry="2.5" fill={active ? '#b45309' : '#d97706'}/>
      <polygon points="19,24 20.5,28 25,28 21.5,30.5 23,34.5 19,32 15,34.5 16.5,30.5 13,28 17.5,28" fill={active ? '#fbbf24' : '#fde68a'} style={{ animation: active ? 'navGlow 1.5s ease-in-out infinite' : 'none' }}/>
      <polygon points="19,25 20,27.5 23,27.5 21,29 22,31.5 19,30 16,31.5 17,29 15,27.5 18,27.5" fill={active ? '#fde68a' : '#fff'}/>
    </svg>
  )
}

function IconParrot({ active }: { active: boolean }) {
  return (
    <svg width="38" height="36" viewBox="0 0 38 36" style={{ display:'block', animation: active ? 'navFloat 2.5s ease-in-out infinite' : 'none' }}>
      <ellipse cx="19" cy="28" rx="11" ry="8" fill={active ? '#16a34a' : '#4ade80'}/>
      <ellipse cx="19" cy="35" rx="3.5" ry="5" fill={active ? '#1d4ed8' : '#60a5fa'}/>
      <ellipse cx="13" cy="34" rx="2.5" ry="4.5" fill={active ? '#2563eb' : '#93c5fd'} transform="rotate(-15,13,34)"/>
      <ellipse cx="25" cy="34" rx="2.5" ry="4.5" fill={active ? '#2563eb' : '#93c5fd'} transform="rotate(15,25,34)"/>
      <ellipse cx="8" cy="27" rx="4" ry="8" fill={active ? '#15803d' : '#22c55e'} transform="rotate(-10,8,27)"/>
      <circle cx="19" cy="14" r="11" fill={active ? '#22c55e' : '#4ade80'}/>
      <ellipse cx="14" cy="5" rx="2.5" ry="4" fill={active ? '#dc2626' : '#fca5a5'} transform="rotate(-20,14,5)"/>
      <ellipse cx="19" cy="4" rx="2.5" ry="4.5" fill={active ? '#ef4444' : '#fca5a5'}/>
      <ellipse cx="24" cy="5" rx="2.5" ry="4" fill={active ? '#dc2626' : '#fca5a5'} transform="rotate(20,24,5)"/>
      <circle cx="13" cy="12" r="5" fill="#fff"/>
      <circle cx="25" cy="12" r="5" fill="#fff"/>
      <circle cx="13" cy="12" r="2.8" fill="#1e293b" style={{ animation:'navPupil 4s ease-in-out infinite', transformOrigin:'13px 12px' }}/>
      <circle cx="25" cy="12" r="2.8" fill="#1e293b" style={{ animation:'navPupil 4s ease-in-out infinite 1.2s', transformOrigin:'25px 12px' }}/>
      <circle cx="14" cy="11" r="1.1" fill="#fff"/>
      <circle cx="26" cy="11" r="1.1" fill="#fff"/>
      <ellipse cx="13" cy="12" rx="5" ry="5" fill={active ? '#22c55e' : '#4ade80'} style={{ animation:'navBlink 4s ease-in-out infinite', transformOrigin:'13px 12px' }}/>
      <ellipse cx="25" cy="12" rx="5" ry="5" fill={active ? '#22c55e' : '#4ade80'} style={{ animation:'navBlink 4s ease-in-out infinite .15s', transformOrigin:'25px 12px' }}/>
      <path d="M15 17 Q19 22 23 17 Q19 15 15 17Z" fill={active ? '#f59e0b' : '#fcd34d'}/>
    </svg>
  )
}

const NAV_ITEMS = [
  { href: '/pacjent/cwiczenia', label: 'Ćwiczenia', Icon: IconFrog   },
  { href: '/pacjent/kalendarz', label: 'Kalendarz',  Icon: IconOwl    },
  { href: '/pacjent/nagrody',   label: 'Nagrody',    Icon: IconBear   },
  { href: '/pacjent/papuga',    label: 'Papuga',     Icon: IconParrot },
] as const

export default function PatientNav() {
  const pathname = usePathname()

  return (
    <>
      <style>{`
        @keyframes navBlink {
          0%,88%,100% { transform: scaleY(0.02) }
          0%,94%,100% { transform: scaleY(0.02) }
          91% { transform: scaleY(1) }
          0% { transform: scaleY(1) }
          85% { transform: scaleY(1) }
          89% { transform: scaleY(0.02) }
          93% { transform: scaleY(1) }
        }
        @keyframes navPupil {
          0%,100% { transform: translate(0,0) }
          30% { transform: translate(1.5px,-1px) }
          65% { transform: translate(-1.5px,1px) }
        }
        @keyframes navWiggle {
          0%,100% { transform: rotate(-4deg) }
          50% { transform: rotate(4deg) }
        }
        @keyframes navBounce {
          0%,100% { transform: scaleY(1) }
          50% { transform: scaleY(1.08) }
        }
        @keyframes navFloat {
          0%,100% { transform: translateY(0) }
          50% { transform: translateY(-3px) }
        }
        @keyframes navGlow {
          0%,100% { opacity: 1 }
          50% { opacity: .6 }
        }
      `}</style>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-purple-100 safe-bottom z-50">
        <div className="flex pb-2">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center pt-1 gap-0"
                style={{ position: 'relative' }}
              >
                {active && (
                  <span style={{
                    position: 'absolute', top: 0, left: '20%', right: '20%',
                    height: '3px', background: '#7c3aed',
                    borderRadius: '0 0 4px 4px',
                  }}/>
                )}
                <Icon active={active} />
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: active ? '#7c3aed' : '#9ca3af',
                  marginTop: '-2px',
                }}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
