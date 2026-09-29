import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  outExtension: ({ format }) => ({ js: format === "cjs" ? ".cjs" : ".js" }),
  target: "node20",
  platform: "neutral",
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
