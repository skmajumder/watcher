/**
 * ESLint Configuration for Watcher SDK
 * 
 * ESLint is a static analysis tool that helps identify and fix problems in JavaScript/TypeScript code.
 * This configuration provides a solid foundation for code quality and consistency.
 */
module.exports = {
  // Mark this as the root configuration (no parent configs will be inherited)
  root: true,
  
  // Use TypeScript parser for .ts and .tsx files
  parser: "@typescript-eslint/parser",
  
  // Enable TypeScript-specific ESLint rules
  plugins: ["@typescript-eslint"],
  
  // Extend recommended configurations for both ESLint and TypeScript
  extends: [
    "eslint:recommended",                    // ESLint recommended rules
    "plugin:@typescript-eslint/recommended"  // TypeScript recommended rules
  ],
  
  // Define the environments where the code will run
  env: { 
    node: true,      // Node.js environment
    browser: true,   // Browser environment
    es2021: true     // ES2021 features available
  },
  
  // Files and directories to ignore during linting
  ignorePatterns: [
    "dist",    // Built output
    "types"    // Generated type definitions
  ],
  
  // Custom rule overrides
  rules: {
    // Disable explicit return type annotations for functions
    // This allows TypeScript to infer return types automatically
    "@typescript-eslint/explicit-module-boundary-types": "off",
  },
};
