import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default tseslint.config(
  // Ignore build output
  {
    ignores: [".next", "dist"],
  },

  // Extend Next.js recommended rules
  ...compat.extends("next/core-web-vitals"),

  // TypeScript config for .ts/.tsx files
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Add or override rules to reduce unwanted errors
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "react/react-in-jsx-scope": "off", // Not needed in Next.js
    },
  },

  // General linting behavior
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  }
);
