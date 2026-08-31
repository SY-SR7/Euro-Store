/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#B8860B",
          "primary-dark": "#9A7209",
          "primary-light": "#D4AF37",
        },
        surface: {
          DEFAULT: "#FAF7EF",
          secondary: "#F3EEE3",
          card: "#FFFDF8",
          elevated: "#FFFFFF",
        },
        ink: {
          DEFAULT: "#1C1917",
          secondary: "#57534E",
          muted: "#A8A29E",
        },
        line: {
          DEFAULT: "#E8DCC3",
          accent: "#D7BE79",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-manrope)", "sans-serif"],
        arabic: ["var(--font-arabic)", "serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-up": "slide-up 0.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-rtl")],
};
