/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Tailwind v4 replaced the old gray palette with slate/neutral.
      // add gray alias pointing to slate so legacy classes (text-gray-900 etc.) still work.
      colors: {
        gray: colors.slate,
        brand: {
          primary: '#06b6d4',        // teal-400
          'primary-light': '#67e8f9',// teal-300
          secondary: '#8b5cf6',      // purple-600
          accent: '#ec4899',         // pink-500
          dark: '#0f172a',           // gray-900
          light: '#f9fafb',          // gray-50
        },
      },
    },
  },
  plugins: [],
};
