/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        plm: {
          deep:  '#03045E',
          ocean: '#0077B6',
          surf:  '#00B4D8',
          frost: '#90E0EF',
          mist:  '#CAF0F8',
          page:  '#F0F9FF',
        },
      },
      width: {
        'sidebar': '220px',
        'sidebar-collapsed': '64px',
      },
      spacing: {
        'sidebar': '220px',
        'sidebar-collapsed': '64px',
      },
    },
  },
  plugins: [],
}
