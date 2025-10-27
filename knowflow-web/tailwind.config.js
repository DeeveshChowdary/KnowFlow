/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f5ff",
          100: "#e3e6ff",
          200: "#c2c8ff",
          500: "#4f46e5",
          600: "#4338ca",
          900: "#1e1b4b",
        },
      },
    },
  },
  plugins: [],
};
