/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{html,jsx,js,tsx}',
    './src/containers/**/*.{html,jsx,js,tsx}',
    './build/*.html',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('tailwind-scrollbar-hide')],
};
