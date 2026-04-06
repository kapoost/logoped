/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
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
