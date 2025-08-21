module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  env: { node: true, browser: true, es2021: true },
  ignorePatterns: ["dist", "types"],
  rules: {
    "@typescript-eslint/explicit-module-boundary-types": "off",
  },
};
