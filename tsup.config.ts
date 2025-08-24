import { defineConfig } from "tsup";

/**
 * tsup Build Configuration
 * 
 * This configuration file defines how the Watcher SDK is built and bundled.
 * tsup is a modern TypeScript bundler that provides fast builds and multiple output formats.
 */
export default defineConfig({
  // Main entry point for the SDK
  entry: {
    index: "src/index.ts",
  },
  
  // Generate TypeScript declaration files (.d.ts)
  dts: true,
  
  // Output formats: ESM (modern) and CommonJS (Node.js compatibility)
  format: ["esm", "cjs"],
  
  // Clean the output directory before each build
  clean: true,
  
  // Generate source maps for debugging
  sourcemap: true,
  
  // Don't minify during development (can be enabled for production)
  minify: false,
  
  // Enable tree shaking to remove unused code
  treeshake: true,
  
  // Target ES2021 for modern JavaScript features
  target: "es2021",
  
  // Disable code splitting (single bundle output)
  splitting: false,
  
  // Output directory for built files
  outDir: "dist",
});
