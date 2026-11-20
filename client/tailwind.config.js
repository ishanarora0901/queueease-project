/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f5fa',
          100: '#e2ebf4',
          200: '#c5d8ea',
          300: '#99bedd',
          400: '#669ecc',
          500: '#3f7eb8',
          600: '#2d6399',
          700: '#254f7c',
          800: '#1e3a5f',
          900: '#0f172a', // Deep Navy
          950: '#0a0f1d',
        },
        teal: {
          500: '#0d9488',
          600: '#0f766e',
          700: '#115e59',
        },
        emerald: {
          500: '#10b981',
          600: '#059669',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

