/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ERP Custom harmonized palette
        primary: {
          50: '#f5f7fa',
          100: '#e4e8f0',
          200: '#c8d1e2',
          300: '#9fb1cf',
          400: '#708ab7',
          500: '#4f6d9e',
          600: '#3d547e',
          700: '#324467',
          800: '#2b3956',
          900: '#25304a',
          950: '#192033',
        },
      },
    },
  },
  plugins: [],
}
