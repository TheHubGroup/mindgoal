/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'fredoka': ['Fredoka', 'cursive'],
        'comic': ['Comic Neue', 'cursive'],
      },
    },
  },
  plugins: [],
}
