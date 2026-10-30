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
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        emerald: {
          500: '#10b981',
          600: '#059669',
        },
        rose: {
          500: '#f43f5e',
          600: '#e11d48',
        },
        amber: {
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-soft': 'bounce 2s infinite',
        'glow-danger': 'glowDanger 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glowDanger: {
          '0%': { boxShadow: '0 0 5px rgba(244, 63, 94, 0.4), inset 0 0 5px rgba(244, 63, 94, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(244, 63, 94, 0.8), inset 0 0 10px rgba(244, 63, 94, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}
