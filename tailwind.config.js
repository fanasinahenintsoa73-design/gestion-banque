/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgBase: "#121212",
        bgSurface: "#181818",
        bgElevated: "#1f1f1f",
        bgCard: "#252525",
        textPrimary: "#ffffff",
        textSecondary: "#b3b3b3",
        textMuted: "#cbcbcb",
        accent: "#1ed760",
        accentDark: "#1db954",
        error: "#f3727f",
        warning: "#ffa42b",
        info: "#539df5",
        border: "#4d4d4d",
        borderLight: "#7c7c7c",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        md: "0 8px 8px rgba(0,0,0,0.3)",
        lg: "0 8px 24px rgba(0,0,0,0.5)",
      },
      borderRadius: {
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
