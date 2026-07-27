/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C2620",
        paper: "#FAF6EE",
        paperDim: "#F0EADC",
        gamosa: "#A63A2E",
        gold: "#C0932E",
        teal: "#28483E",
        tealLight: "#3E6656",
        line: "#DDD3BC",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
