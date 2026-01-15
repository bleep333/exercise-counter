/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#faf9f7',
          100: '#f5f3f0',
          200: '#eae6e0',
          300: '#ddd6cc',
          400: '#c9bfb0',
          500: '#b8a896',
          600: '#a08f7a',
          700: '#857563',
          800: '#6d5f51',
          900: '#5a4e43',
        },
      },
    },
  },
  plugins: [],
}
