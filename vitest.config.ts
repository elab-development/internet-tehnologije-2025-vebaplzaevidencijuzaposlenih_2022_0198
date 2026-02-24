import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["tests/setup.ts", "tests/setup-db.ts"],
    pool: "threads",
    fileParallelism: false,
    include: [
      "**/__tests__/**/*.test.ts",
      "**/__tests__/**/*.spec.ts",
      "**/tests/**/*.test.ts",
      "**/tests/**/*.spec.ts",
    ],
    coverage: {
      reporter: ["text", "html"],
      exclude: ["src/**/node_modules/**", "src/**/*.d.ts"],
    },
  },
});
