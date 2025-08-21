import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  dts: true,
  format: ["esm", "cjs"],
  clean: true,
  sourcemap: true,
  minify: false,
  treeshake: true,
  target: "es2021",
  splitting: false,
  outDir: "dist",
});
