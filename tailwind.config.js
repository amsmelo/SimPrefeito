/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        republic: {
          green: '#1b5e20',
          yellow: '#fbc02d',
          blue: '#0d47a1',
        }
      }
    },
  },
  plugins: [],
}
