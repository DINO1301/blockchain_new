/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1380ec",
        secondary: "#0c5db4",
        "brand-lightBlue": "#e1effe",
        "brand-navy": "#0d141b",
      }
    },
  },
  plugins: [],
}