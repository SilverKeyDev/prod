import path from "path";
import { defineConfig } from "vitest/config";

import { buildWebViteResolve } from "./apps/web/vite.config.resolve.js";

const root = path.resolve(__dirname);
const packages = path.join(root, "packages");
const uiComponents = path.join(packages, "ui/components");
const webAppDir = path.join(root, "apps/web");

const webResolve = buildWebViteResolve(packages, uiComponents, webAppDir);

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary", "lcov"],
      reportsDirectory: "./coverage",

      // Coverage thresholds by directory
      thresholds: {
        // High-value shared code: 70% coverage required
        "packages/utils/": {
          lines: 70,
          functions: 70,
          branches: 65,
          statements: 70,
        },
        "packages/hooks/": {
          lines: 70,
          functions: 70,
          branches: 65,
          statements: 70,
        },

        // Feature code: 50% coverage required
        "packages/features/": {
          lines: 50,
          functions: 50,
          branches: 45,
          statements: 50,
        },

        // Services and config: 60% coverage
        "packages/services/": {
          lines: 60,
          functions: 60,
          branches: 55,
          statements: 60,
        },
        "packages/config/": {
          lines: 60,
          functions: 60,
          branches: 55,
          statements: 60,
        },

        // Store slices: 50% coverage
        "packages/store/": {
          lines: 50,
          functions: 50,
          branches: 45,
          statements: 50,
        },
      },

      // Files to include in coverage
      include: ["packages/**/*.{ts,tsx}", "apps/web/**/*.{ts,tsx}"],

      // Files to exclude from coverage
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/__tests__/**",
        "**/node_modules/**",
        "**/dist/**",
        "**/*.config.{ts,js}",
        "**/*.d.ts",
        "**/types/**",
        "**/index.ts", // Barrel files
        "**/.native.{ts,tsx}", // React Native files (not tested in jsdom)
        "**/apps/mobile/**", // Mobile app (tested separately)
        "**/packages/logger/**", // Logger utilities
        "**/packages/contexts/**", // Context providers (integration tests)
      ],

      // Fail build if thresholds not met
      thresholdAutoUpdate: false,
      skipFull: false,
      all: true,
    },
  },

  resolve: webResolve,
});
