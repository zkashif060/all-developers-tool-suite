/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#3762EA', // Core Brand Blue
          600: '#2b4ec4',
          700: '#213da0',
          800: '#1c327f',
          900: '#1a2b66',
          950: '#0f1738',
        },
        surface: {
          light: '#ffffff',
          'light-subtle': '#f8fafc',
          'light-elevated': '#f1f5f9',
          dark: '#0f172a',
          'dark-subtle': '#0b0f19',
          'dark-elevated': '#1e293b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
