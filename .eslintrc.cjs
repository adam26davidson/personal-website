module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh", "mdx"],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
  },
  overrides: [
    {
      files: ["**/*.md?(x)"],
      extends: ["plugin:mdx/recommended"],
      parser: "eslint-mdx",

      // 👇 these keys *must* be on settings.*, not settings.mdx.*
      settings: {
        "mdx/remarkPlugins": [
          // options are optional; this one just disables $…$ inline math
          ["remark-math", { singleDollarTextMath: false }],
        ],
        "mdx/rehypePlugins": ["rehype-katex"],
      },
    },
  ],
};
