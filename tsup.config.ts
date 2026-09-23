import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  target: "es2020",
  platform: "neutral",
  clean: true,
  treeshake: true,
  tsconfig: "tsconfig.lib.json",
});
