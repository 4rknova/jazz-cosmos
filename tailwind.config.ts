import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      container: {
        center: true,
        padding: {
          DEFAULT: "0.75rem",
          sm: "1rem",
        },
        screens: {
          lg: "600px",
          xl: "600px",
        },
      },
      animation: {
        fadeOut: "fadeOut 1s ease-in-out forwards", // start fade after 2s
        fadeIn: "fadeIn 1s ease-in-out forwards", // start fade after 2s
      },
      keyframes: {
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
} as const;

export default config;
