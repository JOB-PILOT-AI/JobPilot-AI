/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        foreground: '#ffffff',
        primary: '#e07856',
        'primary-dark': '#d26a48',
        secondary: '#2a2a2a',
        tertiary: '#404040',
        accent: '#4ade80',
        border: '#2a2a2a',
        muted: '#666666',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
