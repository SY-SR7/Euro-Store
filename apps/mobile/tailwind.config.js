/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#B8860B",
          dark: "#9A7209",
          light: "#D4AF37",
        },
        background: {
          DEFAULT: "#0F0F0F",
          secondary: "#1A1A1A",
          card: "#1C1917",
          elevated: "#262626",
        },
        "text-primary": "#E2E2E2",
        "text-secondary": "#A3A3A3",
        "text-muted": "#737373",
        border: {
          DEFAULT: "#27272A",
          accent: "#3F3F46",
        },
        error: "#EF4444",
        success: "#22C55E",
        warning: "#F59E0B",
      }
    }
  }
}
