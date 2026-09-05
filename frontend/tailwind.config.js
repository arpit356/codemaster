/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#070a12',
          900: '#0c1220',
          850: '#11192c',
          800: '#17223b',
          700: '#233252',
          600: '#384b72'
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          glow: 'rgba(99, 102, 241, 0.25)'
        },
        cyan: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          glow: 'rgba(6, 182, 212, 0.25)'
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          glow: 'rgba(16, 185, 129, 0.25)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow-brand':   '0 0 25px -5px rgba(99, 102, 241, 0.40)',
        'glow-cyan':    '0 0 25px -5px rgba(6, 182, 212, 0.45)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.40)',
        'glow-amber':   '0 0 25px -5px rgba(245, 158, 11, 0.40)',
        'glow-rose':    '0 0 25px -5px rgba(244, 63, 94, 0.40)',
        'cyber-box':    '0 8px 32px 0 rgba(0,0,0,0.45), 0 0 0 1px rgba(6,182,212,0.12)',
      },
      animation: {
        'pulse-subtle':      'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':         'spin 20s linear infinite',
        'spin-reverse-slow': 'spinReverse 28s linear infinite',
        'floating':          'floatingSoft 5s ease-in-out infinite',
        'cyber-scan':        'cyberScan 3.5s ease-in-out infinite',
        'beacon':            'beaconPing 2s ease-in-out infinite',
      },
      keyframes: {
        spinReverse: {
          from: { transform: 'rotate(360deg)' },
          to:   { transform: 'rotate(0deg)' },
        },
        floatingSoft: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        cyberScan: {
          '0%':   { top: '0%',   opacity: '0.9' },
          '50%':  { opacity: '1.0' },
          '100%': { top: '100%', opacity: '0.2' },
        },
        beaconPing: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(6, 182, 212, 0.5)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(6, 182, 212, 0)' },
        },
      },
      backdropBlur: {
        '2xl': '40px',
      },
    },
  },
  plugins: [],
}
