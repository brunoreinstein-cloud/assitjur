/// <reference types="vitest" />
import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Vitest configuration for unit tests
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/tests/setup.ts"],
    exclude: [
      ...configDefaults.exclude,
      "tests/integration.supabase.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["lcov"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
