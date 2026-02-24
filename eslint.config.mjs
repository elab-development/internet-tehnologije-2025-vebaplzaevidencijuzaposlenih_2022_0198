import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  // Ignore build folders
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

  // Allow require() in JS utility scripts
  {
    files: ["prisma/**/*.js", "scripts/**/*.js", "src/lib/prisma.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-var-requires": "off",
    },
  },

  // Allow 'any' inside tests
  {
    files: ["tests/**/*.{ts,tsx}", "src/__tests__/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Disable aggressive React setState-in-effect rule
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Allow any in Next API routes (route.ts files)
  {
    files: ["src/app/api/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Allow any in Next pages (you used any in a few page.tsx)
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Allow require() in that specific TS route (or all api routes if you want)
  {
    files: ["src/app/api/auth/me/route.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-var-requires": "off",
    },
  },
  {
    files: ["src/lib/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);
