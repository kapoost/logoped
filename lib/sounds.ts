// lib/sounds.ts
// Dźwięki przez Web Audio API — zero zewnętrznych bibliotek

let _ctx: AudioContext | null = null

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!_ctx) {
    try { _ctx = new (window.AudioContext || (window as any).webkitAudioContext)() }
    catch { return null }
  }
  return _ctx
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.3, delay = 0) {
  const c = ctx(); if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain); gain.connect(c.destination)
  osc.type = type
  osc.frequency.value = freq
  const t = c.currentTime + delay
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(vol, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
  osc.start(t); osc.stop(t + dur + 0.05)
}

// +1 powtórzenie — krótki ding
export function playRep() {
  tone(880, 0.12, 'sine', 0.2)
}

// Ukończenie jednego ćwiczenia — wznoszące trio
export function playExerciseDone() {
  tone(523, 0.15, 'sine', 0.25, 0)
  tone(659, 0.15, 'sine', 0.25, 0.12)
  tone(784, 0.3,  'sine', 0.3,  0.24)
}

// Ukończenie całej sesji — fanfara
export function playSessionComplete() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((f, i) => tone(f, 0.2, 'sine', 0.3, i * 0.1))
  tone(1047, 0.5, 'sine', 0.4, 0.45)
}

// Zdobycie odznaki — majestatyczny akord
export function playBadge() {
  ;[523, 659, 784, 1047].forEach(f => tone(f, 0.6, 'sine', 0.2))
  tone(1047, 0.8, 'triangle', 0.15, 0.1)
}

// Błąd / cofnięcie
export function playError() {
  tone(200, 0.2, 'sawtooth', 0.15)
}
