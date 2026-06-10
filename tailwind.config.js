/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0b0c',
        foreground: '#f4eeee',
        primary: '#b64d50',
        'primary-soft': '#ffa5a9',
        'primary-dark': '#9f4145',
        secondary: '#191616',
        tertiary: '#252222',
        accent: '#45d6c4',
        border: '#332828',
        muted: '#a89595',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
