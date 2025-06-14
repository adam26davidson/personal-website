import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // Make sure your blog posts are covered here
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [typography],
};

export default config;
