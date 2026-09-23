import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage"] },
  js.configs.recommended,
  tseslint.configs.strict,
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-restricted-globals": ["error", "process", "Buffer", "require", "__dirname", "__filename"],
      "no-restricted-imports": ["error", { patterns: ["node:*", "fs", "path"] }],
    },
  },
  {
    // Plain-JS Node smoke tests for the built package.
    files: ["scripts/*.mjs", "scripts/*.cjs"],
    languageOptions: {
      globals: { console: "readonly", process: "readonly", URL: "readonly", require: "readonly" },
    },
  },
  {
    files: ["scripts/*.cjs"],
    languageOptions: { sourceType: "commonjs" },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
);
