/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Courier New"', 'Consolas', 'monospace'],
      },
      colors: {
        studio: {
          950: '#0a0b0e',
          900: '#111318',
          850: '#161922',
          800: '#1e2230',
          700: '#2b3145',
          600: '#3d4460',
          500: '#5c6488',
          accent: '#6366f1',
          cyan: '#06b6d4',
          neon: '#10b981',
          magenta: '#ec4899',
        }
      }
    },
  },
  plugins: [],
}
