/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
  extend: {
    fontFamily: {
      body: ['Work Sans', 'sans-serif'],
      mono: ['Space Mono', 'monospace'],
    },
  },
},
  plugins: [],
}