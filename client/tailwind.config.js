/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#f8f9fa",
        primary: "#3b82f6",
        foreground: "#111827",
        accent: "#f43f5e",
        border: "#e5e7eb"
      }
    },
  },
  plugins: [],
};
