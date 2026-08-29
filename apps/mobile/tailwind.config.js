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
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          dark: "rgb(var(--color-primary-dark) / <alpha-value>)",
          light: "rgb(var(--color-primary-light) / <alpha-value>)",
        },
        background: {
          DEFAULT: "rgb(var(--color-background) / <alpha-value>)",
          secondary: "rgb(var(--color-background-secondary) / <alpha-value>)",
          card: "rgb(var(--color-background-card) / <alpha-value>)",
          elevated: "rgb(var(--color-background-elevated) / <alpha-value>)",
        },
        "text-primary": "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        border: {
          DEFAULT: "rgb(var(--color-border) / <alpha-value>)",
          accent: "rgb(var(--color-border-accent) / <alpha-value>)",
        },
        error: "#EF4444",
        success: "#22C55E",
        warning: "#F59E0B",
      }
    }
  }
}
