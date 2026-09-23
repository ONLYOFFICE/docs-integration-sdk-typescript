import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/*/index.ts"],
  format: ["esm", "cjs"],
  outExtension: ({ format }) => ({ js: format === "cjs" ? ".cjs" : ".js" }),
  target: "node20",
  platform: "neutral",
  dts: true,
  sourcemap: true,
  splitting: true,
  clean: true,
  treeshake: true,
});
