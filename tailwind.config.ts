import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        line: "#d9ded8",
        paper: "#f7f5ef",
        moss: "#5d7162",
        brass: "#9f7d3a",
        clay: "#a7634d"
      }
    }
  },
  plugins: [],
};

export default config;
