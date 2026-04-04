import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    exclude: ["e2e/**", "node_modules/**"],
  },
  plugins: [
    react(),
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    tailwindcss(),
  ],
  esbuild: {
    //drop: ["console", "debugger"],
  },
  server: {
    host: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@adam26davidson/char-matrix": path.resolve(__dirname, "./packages/char-matrix/src/index.ts"),
      "@adam26davidson/char-matrix-react": path.resolve(__dirname, "./packages/char-matrix-react/src/index.ts"),
      "@adam26davidson/char-matrix-fx": path.resolve(__dirname, "./packages/char-matrix-fx/src/index.ts"),
    },
  },
});
