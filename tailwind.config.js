/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0c0c',
        foreground: '#f7f1ef',
        primary: '#b64f52',
        'primary-dark': '#9e4145',
        secondary: '#1b1b1b',
        tertiary: '#262322',
        accent: '#49d7ca',
        border: '#342928',
        muted: '#a79390',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
