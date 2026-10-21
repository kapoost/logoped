/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tło wypalone w 127 plikach ilustracji — zmierzone, nie dobrane:
        // średnia z 508 próbek naroży wszystkich plików w wygenerowane/.
        // Kafelek pod ilustracją musi mieć dokładnie tę wartość, inaczej
        // widać krawędź obrazka na jaśniejszym tle.
        cream: '#FEF8EB',
        // Tło strony pod kafelkami — o ton głębsze od kremu, żeby kafelki
        // odcinały się bez użycia czystej bieli, na której ilustracje
        // wyglądają na brudne.
        sand:  '#F6F0E2',
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#6C5CE7',  // primary
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3d2b8e',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      // Dwie skale, bo dziecko i logopeda czytają co innego i inaczej.
      // Dziecko: duże stopnie, nigdy poniżej 16px. Logopeda: gęsto, skanowanie.
      fontSize: {
        'child-display':     ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'child-head-lg':     ['28px', { lineHeight: '36px', fontWeight: '700' }],
        'child-head-md':     ['22px', { lineHeight: '28px', fontWeight: '600' }],
        'child-body-lg':     ['18px', { lineHeight: '26px', fontWeight: '500' }],
        'child-body':        ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'counter':           ['32px', { lineHeight: '36px', letterSpacing: '-0.02em', fontWeight: '800' }],
        'therapist-head':    ['18px', { lineHeight: '24px', fontWeight: '700' }],
        'therapist-body':    ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'therapist-caption': ['13px', { lineHeight: '18px', fontWeight: '500' }],
        'therapist-micro':   ['11px', { lineHeight: '14px', letterSpacing: '0.04em', fontWeight: '600' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        wiggle:  'wiggle 1.8s ease-in-out infinite',
        bounce2: 'bounce2 1.2s ease-in-out infinite',
        pop:     'pop 0.25s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        wiggle: {
          '0%,100%': { transform: 'rotate(-6deg)' },
          '50%':     { transform: 'rotate(6deg)' },
        },
        bounce2: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-4px)' },
        },
        pop: {
          '0%':   { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
