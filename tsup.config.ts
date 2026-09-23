import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "client/index": "src/client/index.ts",
    "config/index": "src/config/index.ts",
    "formats/index": "src/formats/index.ts",
    "jwt/index": "src/jwt/index.ts",
  },
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
