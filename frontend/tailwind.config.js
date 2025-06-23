/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', 
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        dark: {
          'bg': '#1a1a2e',
          'card': '#16213e',
          'primary': '#0f3460',
          'text': '#e94560',
          'subtext': '#a7a9be',
        }
      }
    },
  },
  plugins: [],
}
