/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#4F46E5',
          secondary: '#6366F1',
          accent: '#818CF8',
        }
      }
    },
  },
  plugins: [],
}
